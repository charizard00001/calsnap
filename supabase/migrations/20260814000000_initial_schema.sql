-- CalSnap initial schema.
-- Supabase's built-in auth.users table handles accounts; everything
-- below is app-specific.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Sorcerer',
  calorie_goal int not null default 2000,
  protein_goal int not null default 150,
  install_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  photo_path text,              -- Supabase Storage object path, not a raw file:// URI
  user_note text default '',
  food_name text not null,
  description text default '',
  calories int not null check (calories >= 0),
  protein int not null check (protein >= 0),
  carbs int not null check (carbs >= 0),
  fat int not null check (fat >= 0),
  confidence text not null check (confidence in ('low','medium','high')),
  ai_provider text not null default 'gemini' check (ai_provider in ('gemini','openrouter')),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists meals_user_date_idx on meals (user_id, logged_at desc);

-- Row Level Security: a user can only ever touch their own rows.
alter table profiles enable row level security;
alter table meals enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id);

create policy "own meals" on meals
  for all using (auth.uid() = user_id);

-- Auto-create a profile row the moment someone signs up, so the client
-- never has to handle "user exists but has no profile yet".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Meal photos: private bucket, read/write scoped to the owning user via
-- the storage object's folder name matching their user id.
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "own meal photos read" on storage.objects
  for select using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own meal photos write" on storage.objects
  for insert with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own meal photos delete" on storage.objects
  for delete using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
