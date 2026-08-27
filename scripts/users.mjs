/**
 * Who's using CalSnap.
 *
 *   node scripts/users.mjs
 *
 * Reads SUPABASE_URL and SUPABASE_ACCESS_TOKEN from .env (gitignored). The
 * personal access token is what lets this run arbitrary SQL through the
 * Management API — treat it like a password and never commit it.
 */
import { readFileSync } from 'node:fs';

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { SUPABASE_URL, SUPABASE_ACCESS_TOKEN } = process.env;
if (!SUPABASE_URL || !SUPABASE_ACCESS_TOKEN) {
  console.error('Missing SUPABASE_URL or SUPABASE_ACCESS_TOKEN in .env');
  process.exit(1);
}
const ref = new URL(SUPABASE_URL).hostname.split('.')[0];

const sql = `
  select
    u.email,
    u.created_at::date                                as joined,
    to_char(u.last_sign_in_at, 'Mon DD HH24:MI')      as last_seen,
    coalesce(p.onboarded::text, 'no profile')         as onboarded,
    p.display_name,
    (select count(*) from auth.sessions s
      where s.user_id = u.id and s.not_after is null) as sessions,
    (select count(*) from public.meals m
      where m.user_id = u.id)                         as meals,
    (select max(m.logged_at)::date from public.meals m
      where m.user_id = u.id)                         as last_meal
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.last_sign_in_at desc nulls last;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const rows = await res.json();
if (!Array.isArray(rows)) {
  console.error('Query failed:', rows.message ?? JSON.stringify(rows));
  process.exit(1);
}

const cols = [
  ['email', 'EMAIL', 34],
  ['joined', 'JOINED', 12],
  ['last_seen', 'LAST SEEN', 14],
  ['onboarded', 'SET UP', 12],
  ['display_name', 'NAME', 12],
  ['sessions', 'SESS', 6],
  ['meals', 'MEALS', 7],
  ['last_meal', 'LAST MEAL', 12],
];

console.log(cols.map(([, h, w]) => h.padEnd(w)).join(''));
console.log('-'.repeat(cols.reduce((n, [, , w]) => n + w, 0)));
for (const r of rows) {
  console.log(cols.map(([k, , w]) => String(r[k] ?? '—').padEnd(w)).join(''));
}

const active = rows.filter((r) => Number(r.sessions) > 0).length;
const logging = rows.filter((r) => Number(r.meals) > 0).length;
console.log(
  `\n${rows.length} accounts · ${active} with a live session · ${logging} have logged a meal`
);
