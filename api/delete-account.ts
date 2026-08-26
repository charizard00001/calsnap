import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from './_lib/requireUser';
import { reportServerError } from './_lib/serverError';

// Permanently removes one user: their uploaded photos, meal rows, profile
// row, and finally the auth record itself. The caller only ever proves who
// it is via its own session token (see requireUser) — it can't name someone
// else's account.
//
// The admin client is built lazily: a missing SUPABASE_SERVICE_ROLE_KEY then
// returns a clean 503 at request time instead of throwing at module load and
// 500-ing the route with nothing in the logs.
let adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Account deletion not configured (SUPABASE_SERVICE_ROLE_KEY missing)');
    }
    adminClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return adminClient;
}

const PHOTO_BUCKET = 'meal-photos';
const LIST_PAGE_SIZE = 100;

// storage.list() caps at 100 entries per call, so a heavy user would leave
// orphaned photos behind. Page until the folder is exhausted.
async function listAllPhotoPaths(admin: SupabaseClient, userId: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await admin.storage
      .from(PHOTO_BUCKET)
      .list(userId, { limit: LIST_PAGE_SIZE, offset });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const file of data) paths.push(`${userId}/${file.name}`);

    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireUser(req, res);
  if (!user) return;

  let admin: SupabaseClient;
  try {
    admin = getAdminClient();
  } catch (err) {
    res.status(503).json({ error: reportServerError('delete-account.config', err) });
    return;
  }

  // Tracks how far a partial failure got, so a half-deleted account is
  // diagnosable from the response and the logs.
  const deleted = { photos: 0, meals: false, profile: false, authUser: false };

  try {
    const photoPaths = await listAllPhotoPaths(admin, user.id);
    if (photoPaths.length > 0) {
      const { error } = await admin.storage.from(PHOTO_BUCKET).remove(photoPaths);
      if (error) throw error;
      deleted.photos = photoPaths.length;
    }

    const mealsRes = await admin.from('meals').delete().eq('user_id', user.id);
    if (mealsRes.error) throw mealsRes.error;
    deleted.meals = true;

    const profileRes = await admin.from('profiles').delete().eq('id', user.id);
    if (profileRes.error) throw profileRes.error;
    deleted.profile = true;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw deleteUserError;
    deleted.authUser = true;

    res.status(200).json({ success: true, deleted });
  } catch (err) {
    const message = reportServerError('delete-account', err, { userId: user.id, deleted });
    res.status(500).json({ error: `Account deletion failed: ${message}`, deleted });
  }
}
