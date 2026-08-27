import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildPrompt, parseNutritionJson, type NutritionResult } from './_lib/nutrition';
import { requireUser } from './_lib/requireUser';
import { reportServerError } from './_lib/serverError';

// 20 requests/user/day protects the shared free Gemini/OpenRouter quotas
// from a single runaway client. Built lazily so a missing Upstash env var
// returns a clean 503 instead of crashing the route at module load.
let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (!limiter) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Rate limiter not configured (UPSTASH_REDIS_REST_URL / _TOKEN)');
    }
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(20, '1 d'),
      prefix: 'calsnap:analyze',
    });
  }
  return limiter;
}

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// OpenRouter's free-model lineup rotates, and it rotates faster than you'd
// think: the model pinned here on 2026-08-14 had been delisted by 08-27,
// which meant the fallback silently didn't exist and a Gemini rate-limit
// became a hard failure for the user instead of a slower success. Re-checked
// against openrouter.ai/api/v1/models on 2026-08-27. Override via
// OPENROUTER_FALLBACK_MODEL without a code change when this one goes too.
// Observed latency on the shared free queue ranges from a few seconds to
// ~40s under contention — fine for a fallback, not for primary traffic.
const DEFAULT_OPENROUTER_FALLBACK_MODEL = 'google/gemma-4-31b-it:free';

const MAX_NOTE_LENGTH = 500;
// ~2MB of base64 is comfortably more than the 800px/0.7-quality JPEGs the
// client sends; this just guards against an absurd payload reaching either API.
const MAX_IMAGE_BASE64_LENGTH = 3_000_000;

/** Shape Gemini must return, so the reply needs no unwrapping or repair. */
const NUTRITION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    foodName: { type: 'STRING' },
    description: { type: 'STRING' },
    servingSize: { type: 'STRING' },
    calories: { type: 'NUMBER' },
    protein: { type: 'NUMBER' },
    carbs: { type: 'NUMBER' },
    fat: { type: 'NUMBER' },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
  },
  required: [
    'foodName',
    'description',
    'servingSize',
    'calories',
    'protein',
    'carbs',
    'fat',
    'confidence',
  ],
} as const;

async function callGemini(imageBase64: string, userNote: string): Promise<NutritionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini not configured on server');

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(userNote) },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        // 2.5 Flash thinks before answering by default, which on a
        // look-at-the-plate-and-estimate task bought nothing and cost
        // seconds — it was the single largest chunk of analysis latency.
        thinkingConfig: { thinkingBudget: 0 },
        // Ask for the object directly rather than JSON-inside-markdown:
        // fewer output tokens, and nothing to unwrap before parsing.
        responseMimeType: 'application/json',
        responseSchema: NUTRITION_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response text from Gemini API');

  return { ...parseNutritionJson(text), provider: 'gemini' };
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * The Groq model ids the client may ask for. Kept as a whitelist so a
 * client can't point the server at an arbitrary model.
 *
 * Both are vision-capable Qwen builds, measured against a real plate photo:
 * 3.8 answers in about a second, 3.6 takes roughly twice that because it
 * reasons first — which is why reasoning is turned off for it, otherwise it
 * emits a <think> block and the JSON never parses.
 */
const GROQ_MODELS: Record<string, { model: string; extra: Record<string, unknown> }> = {
  'qwen-3.8': {
    model: 'qwen/qwen3.8-27b',
    extra: { response_format: { type: 'json_object' } },
  },
  'qwen-3.6': {
    model: 'qwen/qwen3.6-27b',
    extra: { response_format: { type: 'json_object' }, reasoning_effort: 'none' },
  },
};

async function callGroq(
  choice: string,
  imageBase64: string,
  userNote: string
): Promise<NutritionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq not configured on server');

  const spec = GROQ_MODELS[choice];
  if (!spec) throw new Error(`Unknown Groq model: ${choice}`);

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: spec.model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(userNote) },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      temperature: 0.2,
      max_completion_tokens: 500,
      ...spec.extra,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response text from Groq');

  return { ...parseNutritionJson(text), provider: 'groq' };
}

async function callOpenRouterFallback(
  imageBase64: string,
  userNote: string
): Promise<NutritionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter fallback not configured on server');

  const model = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_OPENROUTER_FALLBACK_MODEL;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildPrompt(userNote) },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response text from OpenRouter');

  return { ...parseNutritionJson(text), provider: 'openrouter' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireUser(req, res);
  if (!user) return;

  let rateLimiter: Ratelimit;
  try {
    rateLimiter = getLimiter();
  } catch (err) {
    res.status(503).json({ error: reportServerError('analyze.config', err) });
    return;
  }

  const { success, limit, remaining, reset } = await rateLimiter.limit(user.id);
  if (!success) {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
    res.status(429).json({ error: 'Daily analysis limit reached. Try again tomorrow.' });
    return;
  }

  const { imageBase64, userNote, model } = req.body ?? {};

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    res.status(413).json({ error: 'Image too large' });
    return;
  }
  const note = typeof userNote === 'string' ? userNote.slice(0, MAX_NOTE_LENGTH) : '';

  // The user's pick runs first; the other provider is the safety net. Groq's
  // free tier is capped per minute on tokens and images are token-heavy, so
  // it does refuse under a burst — that refusal has to become a slightly
  // slower answer, never an error the user sees.
  const choice = typeof model === 'string' ? model : '';
  const chain: { name: string; run: () => Promise<NutritionResult> }[] =
    choice === 'gemini-flash'
      ? [
          { name: 'gemini', run: () => callGemini(imageBase64, note) },
          { name: 'groq', run: () => callGroq('qwen-3.8', imageBase64, note) },
        ]
      : [
          {
            name: 'groq',
            run: () => callGroq(GROQ_MODELS[choice] ? choice : 'qwen-3.8', imageBase64, note),
          },
          { name: 'gemini', run: () => callGemini(imageBase64, note) },
        ];

  chain.push({ name: 'openrouter', run: () => callOpenRouterFallback(imageBase64, note) });

  const failures: string[] = [];
  for (const link of chain) {
    try {
      const result = await link.run();
      res.status(200).json(result);
      return;
    } catch (err) {
      failures.push(`${link.name}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  reportServerError('analyze.providers', new Error(failures.join(' | ')), {
    userId: user.id,
    choice,
  });

  // The raw provider text is for the logs above, not the screen — it carries
  // org ids and billing URLs, and tells the person holding the phone nothing
  // they can act on. Every provider being busy at once is transient, so say
  // that and point at the one thing that does help: try again.
  const allBusy = failures.every((f) => f.includes('429'));
  res.status(502).json({
    error: allBusy
      ? 'Every analysis engine is busy right now. Give it a few seconds and snap again.'
      : "Couldn't read that photo. Try again, or retake it with the plate more in frame.",
  });
}
