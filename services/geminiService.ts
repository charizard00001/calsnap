import type { NutritionResult } from '@/types';
import * as ImageManipulator from 'expo-image-manipulator';

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!key || key === 'your_key_here') {
    throw new Error(
      'Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.'
    );
  }
  return key;
}

/**
 * Compress and resize image to max 800px width, JPEG quality 0.7.
 * Returns base64 string.
 */
export async function preprocessImage(imageUri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!manipulated.base64) {
    throw new Error('Failed to convert image to base64');
  }
  return manipulated.base64;
}

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

function parseResponse(text: string): NutritionResult {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (
    typeof parsed.foodName !== 'string' ||
    typeof parsed.calories !== 'number' ||
    typeof parsed.protein !== 'number' ||
    typeof parsed.carbs !== 'number' ||
    typeof parsed.fat !== 'number'
  ) {
    throw new Error('Invalid nutrition data received from AI');
  }

  return {
    foodName: parsed.foodName,
    description: parsed.description || '',
    servingSize: parsed.servingSize || 'Unknown',
    calories: Math.round(parsed.calories),
    protein: Math.round(parsed.protein),
    carbs: Math.round(parsed.carbs),
    fat: Math.round(parsed.fat),
    confidence: ['low', 'medium', 'high'].includes(parsed.confidence)
      ? parsed.confidence
      : 'low',
  };
}

async function callGeminiAPI(
  imageBase64: string,
  userNote: string
): Promise<NutritionResult> {
  const apiKey = getApiKey();
  const prompt = buildPrompt(userNote);

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini API error (${response.status}): ${errorBody.slice(0, 200)}`
    );
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response text from Gemini API');
  }

  return parseResponse(text);
}

/**
 * Main entry point: analyze a food image and return nutrition data.
 * Preprocesses the image and retries once on failure.
 */
export async function analyzeFoodImage(
  imageUri: string,
  userNote: string = ''
): Promise<NutritionResult> {
  const imageBase64 = await preprocessImage(imageUri);

  try {
    return await callGeminiAPI(imageBase64, userNote);
  } catch (firstError) {
    // Retry once
    try {
      return await callGeminiAPI(imageBase64, userNote);
    } catch (retryError) {
      if (retryError instanceof Error) {
        throw new Error(`Analysis failed: ${retryError.message}`);
      }
      throw new Error('Analysis failed after retry. Please try again.');
    }
  }
}
