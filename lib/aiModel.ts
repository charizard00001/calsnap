import { DEFAULT_AI_MODEL } from '@/constants/aiModels';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Which analysis engine this device uses. A device preference, like the sound
 * toggle — it deliberately doesn't live on the profile, so choosing it never
 * costs a round trip on the path that actually matters (snapping a meal).
 */

const KEY = 'ai_model';

let current: string = DEFAULT_AI_MODEL;

AsyncStorage.getItem(KEY)
  .then((v) => {
    if (v) current = v;
  })
  .catch(() => {});

export function getAiModel(): string {
  return current;
}

export async function setAiModel(id: string): Promise<void> {
  current = id;
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {
    // Preference is a nicety — never let storage failure block a change.
  }
}

/** Await the stored value, for the first read before the module settles. */
export async function loadAiModel(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v) current = v;
  } catch {}
  return current;
}
