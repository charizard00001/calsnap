import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Verifies the caller's own session (never trusts a client-supplied user id),
// then uses the service-role key — required for auth.admin.deleteUser and to
// bypass RLS when cleaning up storage/rows — to fully remove that one user.
const authClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const userId = userData.user.id;

  try {
    const { data: files } = await adminClient.storage.from('meal-photos').list(userId);
    if (files && files.length > 0) {
      await adminClient.storage
        .from('meal-photos')
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    await adminClient.from('meals').delete().eq('user_id', userId);
    await adminClient.from('profiles').delete().eq('id', userId);

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ error: `Account deletion failed: ${message}` });
  }
}
