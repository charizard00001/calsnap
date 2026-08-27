/**
 * The analysis engines a user can pick between, best first.
 *
 * Everything here is benchmarked against a real plate photo, not guessed —
 * the timings are medians measured through the deployed endpoint. Groq runs
 * the primary models because it is markedly faster than Gemini on this task;
 * Gemini stays as the automatic fallback for every choice, since Groq's free
 * tier is capped on tokens-per-minute and will refuse under a burst.
 */

export type AiProvider = 'groq' | 'gemini';

export interface AiModelOption {
  /** Sent to /api/analyze; the server maps it to a provider call. */
  id: string;
  provider: AiProvider;
  /** Shown in onboarding and settings. */
  label: string;
  /** One line on the trade-off. */
  blurb: string;
  /** Rough measured round trip, for the UI. */
  speed: string;
  recommended?: boolean;
}

export const AI_MODELS: AiModelOption[] = [
  {
    id: 'qwen-3.8',
    provider: 'groq',
    label: 'QWEN 3.8',
    blurb: 'Quickest read on a plate. Best all-rounder.',
    speed: '~1s',
    recommended: true,
  },
  {
    id: 'qwen-3.6',
    provider: 'groq',
    label: 'QWEN 3.6',
    blurb: 'Thinks a little longer before answering.',
    speed: '~2s',
  },
  {
    id: 'gemini-flash',
    provider: 'gemini',
    label: 'GEMINI FLASH',
    blurb: "Google's model. Slower, strong on food it knows.",
    speed: '~3s',
  },
];

export const DEFAULT_AI_MODEL = AI_MODELS[0].id;

export function modelById(id: string | null | undefined): AiModelOption {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[0];
}
