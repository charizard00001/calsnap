import { supabase } from './supabase';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://calsnap-chi.vercel.app';

// Permanently deletes the signed-in user's account: auth record, profile
// row, all meals, and all uploaded photos. Requires the service-role key
// server-side (api/delete-account.ts), so the client only ever proves who
// it is via its own session token — it can't delete anyone else's account.
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('You must be signed in to delete your account.');
  }

  const response = await fetch(`${API_BASE_URL}/api/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Account deletion failed (${response.status})`);
  }
}
