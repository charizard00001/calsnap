import { supabase } from './supabase';

/**
 * The signed-in user's id, without a network round trip.
 *
 * Every repository and profile call used to open with `supabase.auth.getUser()`,
 * which posts to /auth/v1/user to re-validate the token — measured at ~260ms
 * on a fast wired connection, and the app makes three or more of them
 * sequentially before the dashboard can paint. None of that was buying
 * anything: the id is already in the session we hold locally, and every
 * query is guarded by row-level security server-side regardless of what the
 * client believes about who it is.
 *
 * So: keep the id in memory, refreshed by the auth listener, and fall back to
 * `getSession()` (a local-storage read, which only touches the network when
 * the token needs refreshing) the first time we're asked.
 */

let cachedId: string | null = null;
let primed = false;
let inFlight: Promise<string | null> | null = null;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedId = session?.user?.id ?? null;
  primed = true;
});

export async function getCurrentUserId(): Promise<string | null> {
  if (primed) return cachedId;
  // Several queries fire at once on a cold open — make them share one read
  // rather than each doing their own.
  if (!inFlight) {
    inFlight = supabase.auth
      .getSession()
      .then(({ data }) => {
        cachedId = data.session?.user?.id ?? null;
        primed = true;
        return cachedId;
      })
      .catch(() => null)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** Synchronous peek — null until the first resolve. */
export function peekCurrentUserId(): string | null {
  return cachedId;
}
