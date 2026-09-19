-- ────────────────────────────────────────────────────────────────────────────
-- Stua (E6) — RLS-policyer + trigger (håndskrevet, idempotent)
--
-- Stua er LUKKET (design D2): kun rollen `authenticated` leser. `anon` får INGENTING.
-- Threads/posts: i tillegg kun status='published' via klient-lesing. Admin-stien
-- (Drizzle server-connection) omgår RLS og ser alt (bevist i E5 verify-bypass).
--
-- ANVENDELSE: kjør mot DIRECT_URL. Idempotent.
--
-- Sikkerhetsmodell: autoritativ auth/eier/admin-sjekk i server actions. RLS her
-- er dybde-forsvar for PostgREST/anon-stien.
-- ────────────────────────────────────────────────────────────────────────────

-- ══ stua_rooms ══════════════════════════════════════════════════════════════
alter table public.stua_rooms enable row level security;

-- SELECT: kun innloggede (lukket forum). anon ser ingenting.
drop policy if exists "stua_rooms_select_auth" on public.stua_rooms;
create policy "stua_rooms_select_auth"
  on public.stua_rooms
  for select
  to authenticated
  using (true);

-- Ingen klient-skriving: rom er admin-styrt (seedet via server/SQL).
revoke insert, update, delete, truncate on public.stua_rooms from anon, authenticated;

-- ══ stua_threads ════════════════════════════════════════════════════════════
alter table public.stua_threads enable row level security;

-- SELECT: innlogget OG kun published (skjulte tråder usynlige via klient).
drop policy if exists "stua_threads_select_auth_published" on public.stua_threads;
create policy "stua_threads_select_auth_published"
  on public.stua_threads
  for select
  to authenticated
  using (status = 'published');

revoke insert, update, delete, truncate on public.stua_threads from anon, authenticated;

-- ══ stua_posts ══════════════════════════════════════════════════════════════
alter table public.stua_posts enable row level security;

-- SELECT: innlogget OG kun published. (Trådens status er autoritativ for
-- helhets-synlighet i lese-ruten; denne policyen skjuler enkelt-skjulte svar.)
drop policy if exists "stua_posts_select_auth_published" on public.stua_posts;
create policy "stua_posts_select_auth_published"
  on public.stua_posts
  for select
  to authenticated
  using (status = 'published');

revoke insert, update, delete, truncate on public.stua_posts from anon, authenticated;

-- ══ updated_at-trigger (gjenbruk public.set_updated_at fra profiles.sql) ══════
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stua_threads_set_updated_at on public.stua_threads;
create trigger stua_threads_set_updated_at
  before update on public.stua_threads
  for each row execute function public.set_updated_at();

drop trigger if exists stua_posts_set_updated_at on public.stua_posts;
create trigger stua_posts_set_updated_at
  before update on public.stua_posts
  for each row execute function public.set_updated_at();

-- ══ Seed fem rom (idempotent via ON CONFLICT på slug) ════════════════════════
insert into public.stua_rooms (slug, name, description, sort_order) values
  ('geish-no', 'Geish.no', 'Ønsker, bugs og prat om geish.no.', 1),
  ('reik-no',  'Reik.no',  'Ønsker, bugs og prat om Reik.', 2),
  ('prat',     'Prat',     'Løs prat om løst og fast.', 3),
  ('annet',    'Annet',    'Alt som ikke passer andre steder.', 4),
  ('blogg',    'Blogg',    'Diskusjon rundt bloggpostene.', 5)
on conflict (slug) do nothing;

-- ════════════════════════════════════════════════════════════════════════════
-- NED-SQL (roll-back) — kjør manuelt ved behov.
-- ════════════════════════════════════════════════════════════════════════════
-- drop trigger if exists stua_posts_set_updated_at on public.stua_posts;
-- drop trigger if exists stua_threads_set_updated_at on public.stua_threads;
-- drop policy if exists "stua_posts_select_auth_published" on public.stua_posts;
-- drop policy if exists "stua_threads_select_auth_published" on public.stua_threads;
-- drop policy if exists "stua_rooms_select_auth" on public.stua_rooms;
-- drop table if exists public.stua_posts;
-- drop table if exists public.stua_threads;
-- drop table if exists public.stua_rooms;
