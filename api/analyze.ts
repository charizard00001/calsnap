import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// OpenRouter's free-model lineup rotates. Override via env without a code
// change if this stops being free/available — check openrouter.ai/models.
const DEFAULT_OPENROUTER_FALLBACK_MODEL = 'google/gemma-3-27b-it:free';

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
