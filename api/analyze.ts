import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 20 requests/user/day protects the shared free Gemini/OpenRouter quotas
// from a single runaway client.
const ratelimit = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const limiter = new Ratelimit({
  redis: ratelimit,
  limiter: Ratelimit.slidingWindow(20, '1 d'),
  prefix: 'calsnap:analyze',
});

const authClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface NutritionResult {
  foodName: string;
  description: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'low' | 'medium' | 'high';
  provider: 'gemini' | 'openrouter';
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

function buildPrompt(userNote: string): string {
  return `You are a nutrition expert AI. Analyze the food in this image.
The user has provided this note: "${userNote}" (use this to adjust portion size if mentioned).
Return ONLY a valid JSON object with this exact structure, no extra text, no markdown:
{
  "foodName": "string",
  "description": "string",
  "servingSize": "string",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "low" | "medium" | "high"
}
If you cannot identify the food, return confidence as "low" and provide best estimates.`;
}

function parseNutritionJson(text: string): Omit<NutritionResult, 'provider'> {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (
    typeof parsed.foodName !== 'string' ||
    typeof parsed.calories !== 'number' ||
    typeof parsed.protein !== 'number' ||
    typeof parsed.carbs !== 'number' ||
    typeof parsed.fat !== 'number' ||
    !Number.isFinite(parsed.calories) ||
    !Number.isFinite(parsed.protein) ||
    !Number.isFinite(parsed.carbs) ||
    !Number.isFinite(parsed.fat)
  ) {
    throw new Error('Invalid nutrition data received from AI');
  }

  const clamp = (n: number) => Math.max(0, Math.round(n));

  return {
    foodName: parsed.foodName,
    description: parsed.description || '',
    servingSize: parsed.servingSize || 'Unknown',
    calories: clamp(parsed.calories),
    protein: clamp(parsed.protein),
    carbs: clamp(parsed.carbs),
    fat: clamp(parsed.fat),
    confidence: ['low', 'medium', 'high'].includes(parsed.confidence)
      ? parsed.confidence
      : 'low',
  };
}

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

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const { success, limit, remaining, reset } = await limiter.limit(userData.user.id);
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
      res.status(502).json({
        error: `Analysis failed. Gemini: ${geminiMsg}. Fallback: ${fallbackMsg}`,
      });
    }
  }
}
