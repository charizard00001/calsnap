import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Meals written locally that Supabase hasn't confirmed yet.
 *
 * Reads treat Supabase as the source of truth and overwrite the local day
 * cache with whatever comes back. That is right for a second device, and
 * wrong for the second or two right after you log something: the server
 * hasn't got the row yet, so the refetch returns a day without it and the
 * meal you just saw disappears until a later refetch picks it up. Holding
 * the ids of in-flight writes lets a read keep them instead of clobbering.
 */

const KEY = 'pending_meal_ids';

let pending = new Set<string>();
let loaded = false;

async function load(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) pending = new Set(JSON.parse(raw) as string[]);
  } catch {
    // A missing or corrupt list just means nothing is pending.
  }
}

function persist(): void {
  AsyncStorage.setItem(KEY, JSON.stringify([...pending])).catch(() => {});
}

export function markPending(id: string): void {
  pending.add(id);
  persist();
}

export function markSynced(id: string): void {
  if (pending.delete(id)) persist();
}

export async function getPendingIds(): Promise<Set<string>> {
  await load();
  return pending;
}

/** Synchronous peek, for paths that can't await. */
export function peekPending(): Set<string> {
  return pending;
}
