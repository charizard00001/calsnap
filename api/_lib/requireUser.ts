import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazily built so a missing SUPABASE_URL / SUPABASE_ANON_KEY surfaces as a
// clean 503 at request time rather than a module-load crash that 500s every
// route with nothing useful in the logs.
let authClient: SupabaseClient | null = null;

function getAuthClient(): SupabaseClient {
  if (!authClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase auth not configured (SUPABASE_URL / SUPABASE_ANON_KEY)');
    }
    authClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return authClient;
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/**
 * Verifies the caller's Supabase session from the `Authorization: Bearer`
 * header. A client-supplied user id is never trusted — identity always comes
 * from `auth.getUser(token)`.
 *
 * On any failure this writes the response and returns `null`; callers must
 * `return` immediately when they get `null` back.
 */
export async function requireUser(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthedUser | null> {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return null;
  }

  let client: SupabaseClient;
  try {
    client = getAuthClient();
  } catch (err) {
    res.status(503).json({ error: err instanceof Error ? err.message : 'Auth not configured' });
    return null;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? null };
}
