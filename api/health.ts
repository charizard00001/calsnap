import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cheap production config check. Reports which server-side env vars are
// present as booleans only — never their values. A single
// `curl https://calsnap-chi.vercel.app/api/health` tells you whether a
// deploy is wired up correctly (this is what would have caught the
// account-deletion outage immediately).
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'OPENROUTER_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const env = Object.fromEntries(
    REQUIRED_ENV.map((key) => [key, Boolean(process.env[key])])
  ) as Record<(typeof REQUIRED_ENV)[number], boolean>;

  const ok = Object.values(env).every(Boolean);

  res.status(ok ? 200 : 503).json({ ok, env, at: new Date().toISOString() });
}
