-- ────────────────────────────────────────────────────────────────────────────
-- guestbook_entries — RLS-policyer + trigger (håndskrevet, idempotent)
--
-- Drizzle-kit genererer IKKE RLS/policyer/triggere → denne SQL-en bor ved siden
-- av migrasjonen (drizzle/0001_*.sql) og committes. Konvensjon (jf. profiles).
--
-- ANVENDELSE (etter tabell-migrasjonen): kjør mot DIRECT_URL (Session pooler,
-- 5432). Idempotent — trygg å kjøre på nytt.
--
-- Sikkerhetsmodell (design D1/D4): den AUTORITATIVE skrive-/status-logikken bor
-- i server action-laget (Drizzle server, omgår RLS): innlogget → published,
-- anonym → pending; admin modererer. RLS her er DYBDE-FORSVAR for PostgREST/
-- anon-stien: publikum skal ALDRI se pending/hidden via direkte API.
-- ────────────────────────────────────────────────────────────────────────────

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.guestbook_entries enable row level security;

-- SELECT: kun PUBLISHED er offentlig lesbart (anon + authenticated). Pending og
-- hidden er usynlig for alle klient-roller — kun admin-stien (Drizzle server,
-- bruker connection som omgår RLS) ser alt (design D4).
drop policy if exists "guestbook_select_published" on public.guestbook_entries;
create policy "guestbook_select_published"
  on public.guestbook_entries
  for select
  using (status = 'published');

-- Ingen client INSERT/UPDATE/DELETE-policy: ALL skriving går via server actions
-- (honeypot + status-avgjørelse + moderering) på Drizzle server-stien, aldri fra
-- klienten. Uten policy er disse operasjonene nektet for anon/authenticated.
--
-- DYBDE-FORSVAR (Hugin-review): RLS filtrerer rader, men GRANTs styrer om rollen
-- får røre tabellen i det hele tatt. Eldre Supabase-prosjekter gir nye public-
-- tabeller automatisk skrive-grants til anon/authenticated → uten policy er det
-- KUN RLS som stopper skriving (skjørt). Eksplisitt revoke matcher Supabase sin
-- egen anbefaling. Idempotent (revoke på allerede-fjernet grant er no-op).
revoke insert, update, delete, truncate on public.guestbook_entries from anon, authenticated;

-- DYBDE-FORSVAR (Supabase-anbefaling): RLS filtrerer RADER, men GRANTs styrer om
-- rollen får røre tabellen i det hele tatt. Eldre Supabase-prosjekter gir nye
-- public-tabeller skrive-grants til anon/authenticated automatisk. Vi tilbakekaller
-- dem eksplisitt (idempotent) så skriving nektes på GRANT-nivå, ikke bare via
-- fravær av policy. Ren tilleggssikring; endrer ikke lese-stien (RLS styrer den).

-- ── updated_at holdes fersk ─────────────────────────────────────────────────
-- Gjenbruker public.set_updated_at() (definert i profiles.sql). BEFORE UPDATE så
-- enhver skrivevei (moderering: vis/skjul/rediger) bumper updated_at konsistent.
-- Idempotent create-or-replace her også, i tilfelle denne kjøres før profiles.
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

drop trigger if exists guestbook_set_updated_at on public.guestbook_entries;
create trigger guestbook_set_updated_at
  before update on public.guestbook_entries
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- NED-SQL (roll-back) — kjør manuelt ved behov. IKKE del av anvendelsen over.
-- ════════════════════════════════════════════════════════════════════════════
-- drop trigger if exists guestbook_set_updated_at on public.guestbook_entries;
-- drop policy if exists "guestbook_select_published" on public.guestbook_entries;
-- drop table if exists public.guestbook_entries;
-- (behold public.set_updated_at() — deles med profiles)
