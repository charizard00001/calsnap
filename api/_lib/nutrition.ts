// Pure nutrition-analysis helpers, split out from the request handler so
// they can be unit-tested without pulling in Vercel / Upstash / Supabase.

export interface NutritionResult {
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

export function buildPrompt(userNote: string): string {
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

/**
 * Parses the model's reply into a validated nutrition object. Tolerates a
 * ```json fenced block, rejects missing/non-finite macros, clamps negatives
 * and rounds, and falls back to 'low' confidence for anything unexpected.
 */
export function parseNutritionJson(text: string): Omit<NutritionResult, 'provider'> {
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
