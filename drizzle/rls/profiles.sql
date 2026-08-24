-- ────────────────────────────────────────────────────────────────────────────
-- profiles — RLS-policyer + triggere (håndskrevet, idempotent)
--
-- Drizzle-kit genererer IKKE RLS, policyer eller triggere → denne SQL-en bor
-- ved siden av migrasjonen (drizzle/0000_*.sql) og committes. Konvensjon for
-- E5/E6: ny tabell = migrasjon (Drizzle) + drizzle/rls/<tabell>.sql (dette).
--
-- ANVENDELSE (etter tabell-migrasjonen): kjør denne mot DIRECT_URL (Session
-- pooler, 5432). Idempotent — trygg å kjøre på nytt.
--
-- Sikkerhetsmodell (design D6): den AUTORITATIVE eier-sjekken for skriving bor
-- i server action-laget (Drizzle-`where id = user.id`, som omgår RLS). RLS her
-- er DYBDE-FORSVAR for PostgREST/anon-stien (og fremtidig realtime i E6).
-- ────────────────────────────────────────────────────────────────────────────

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- SELECT: offentlig. Visningsnavn + bio er bevisst lesbart for alle (anon +
-- authenticated) — klart for gjestebok (E5) og Stua (E6).
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles
  for select
  using (true);

-- UPDATE: kun eier. auth.uid() = raden sin id.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Ingen client INSERT/DELETE-policy: rader opprettes av triggeren under, og
-- slettes via ON DELETE CASCADE når auth.users-raden fjernes.

-- ── Auto-opprettelse: handle_new_user (design D2) ───────────────────────────
-- SECURITY DEFINER + set search_path = '' er PÅKREVD sikkerhetshygiene (hindrer
-- søkesti-manipulasjon). Setter KUN id — display_name forblir NULL.
--
-- PERSONVERN (Geirs D5): display_name avledes ALDRI fra e-post. Ferske profiler
-- er navnløse (NULL); /konto oppfordrer brukeren til å velge et visningsnavn.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at holdes fersk (design D7) ─────────────────────────────────────
-- BEFORE UPDATE-trigger så ENHVER skrivevei bumper updated_at konsistent.
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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- NED-SQL (roll-back) — kjør manuelt ved behov. IKKE del av anvendelsen over.
-- ════════════════════════════════════════════════════════════════════════════
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user();
-- drop trigger if exists profiles_set_updated_at on public.profiles;
-- drop function if exists public.set_updated_at();
-- drop policy if exists "profiles_select_all" on public.profiles;
-- drop policy if exists "profiles_update_own" on public.profiles;
-- drop table if exists public.profiles;
