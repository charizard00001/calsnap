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

// OpenRouter's free-model lineup rotates — verified working against
// openrouter.ai/api/v1/models on 2026-08-14. Override via
// OPENROUTER_FALLBACK_MODEL without a code change if this stops being
// free/available. Observed latency on the shared free queue ranged from
// a few seconds to ~40s under contention — acceptable for a fallback
// path, not for primary traffic.
const DEFAULT_OPENROUTER_FALLBACK_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

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

  const { imageBase64, userNote } = req.body ?? {};

  if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }
  if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
    res.status(413).json({ error: 'Image too large' });
    return;
  }
  const note = typeof userNote === 'string' ? userNote.slice(0, MAX_NOTE_LENGTH) : '';

  try {
    const result = await callGemini(imageBase64, note);
    res.status(200).json(result);
    return;
  } catch (geminiError) {
    try {
      const result = await callOpenRouterFallback(imageBase64, note);
      res.status(200).json(result);
      return;
    } catch (fallbackError) {
      const geminiMsg = geminiError instanceof Error ? geminiError.message : 'unknown error';
      const fallbackMsg =
        fallbackError instanceof Error ? fallbackError.message : 'unknown error';
      reportServerError('analyze.providers', fallbackError, {
        userId: user.id,
        geminiError: geminiMsg,
      });
      res.status(502).json({
        error: `Analysis failed. Gemini: ${geminiMsg}. Fallback: ${fallbackMsg}`,
      });
    }
  }
}
