import { getAiModel } from '@/lib/aiModel';
import { supabase } from '@/lib/supabase';
import type { NutritionResult } from '@/types';
import * as ImageManipulator from 'expo-image-manipulator';

// The server proxy (api/analyze.ts) holds both the Gemini and OpenRouter
// keys — the client never sees either. Override for local dev against
// `vercel dev` via EXPO_PUBLIC_API_BASE_URL; defaults to production.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://calsnap-chi.vercel.app';

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

function isRetryable(status: number): boolean {
  // 5xx (including our proxy's 502 when both providers failed) is worth one
  // retry; 4xx means the request itself was bad and will fail again.
  return status >= 500;
}

async function callAnalyzeEndpoint(
  imageBase64: string,
  userNote: string
): Promise<NutritionResult> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('You must be signed in to analyze a meal.');
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    // The server validates this against its own whitelist and falls back to
    // the other provider on its own, so a stale or unknown id is harmless.
    body: JSON.stringify({ imageBase64, userNote, model: getAiModel() }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.error || `Analysis request failed (${response.status})`;
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Main entry point: analyze a food image and return nutrition data.
 * Preprocesses the image and retries once, but only on a transient
 * (network or 5xx) failure — a bad request will fail identically twice.
 */
export async function analyzeFoodImage(
  imageUri: string,
  userNote: string = ''
): Promise<NutritionResult> {
  const imageBase64 = await preprocessImage(imageUri);

  try {
    return await callAnalyzeEndpoint(imageBase64, userNote);
  } catch (firstError) {
    const status = (firstError as { status?: number }).status;
    if (status !== undefined && !isRetryable(status)) {
      throw firstError;
    }
    try {
      return await callAnalyzeEndpoint(imageBase64, userNote);
    } catch (retryError) {
      if (retryError instanceof Error) {
        throw new Error(`Analysis failed: ${retryError.message}`);
      }
      throw new Error('Analysis failed after retry. Please try again.');
    }
  }
}
