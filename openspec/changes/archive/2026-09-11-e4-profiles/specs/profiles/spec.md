## ADDED Requirements

### Requirement: profiles-tabell knyttet 1:1 til auth.users

Prosjektet SHALL definere en `profiles`-tabell i `src/db/schema.ts` (Drizzle
`pgTable`) som er en 1:1-utvidelse av `auth.users`. Tabellen SHALL ha:

- `id uuid` PRIMARY KEY som samtidig er FOREIGN KEY til `auth.users(id)` med
  `ON DELETE CASCADE`.
- `display_name text` (NULL tillatt — Geirs D5: ferske profiler er navnløse og
  navn avledes aldri fra e-post) med en lengdebegrensning (2–40 tegn NÅR satt)
  håndhevet som `CHECK`-constraint i databasen. IKKE unikt (Geirs D1).
- `bio text` (NULL tillatt) med en lengdebegrensning (≤ 300 tegn) som `CHECK`.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.

Tabell-DDL SHALL genereres via `drizzle-kit generate` og committes som SQL-
migrasjon under `drizzle/`. Migrasjonen MUST NOT opprette eller endre `auth`-
skjemaet — kun `id`-kolonnen på `auth.users` refereres for FK-en.

#### Scenario: profil er 1:1 med bruker
- **WHEN** `src/db/schema.ts` inspiseres
- **THEN** har `profiles` `id` som både primærnøkkel og fremmednøkkel til
  `auth.users(id)` med `ON DELETE CASCADE`, slik at en bruker har høyst én profil
  og profilen slettes når brukeren slettes

#### Scenario: migrasjonen rører ikke auth-skjemaet
- **WHEN** den genererte Drizzle-migrasjonen inspiseres
- **THEN** inneholder den `create table` for `public.profiles` men ingen DDL som
  oppretter eller endrer `auth`-skjemaet eller `auth.users`

#### Scenario: lengdegrenser håndheves i databasen
- **WHEN** en rad forsøkes lagret med `display_name` kortere enn 2 tegn eller
  `bio` lengre enn 300 tegn
- **THEN** avvises skrivingen av en `CHECK`-constraint i databasen

### Requirement: Profil auto-opprettes ved ny bruker

Hver ny rad i `auth.users` SHALL føre til at en tilhørende `profiles`-rad
opprettes automatisk, uansett hvilken inngangsrute innloggingen skjer via. Dette
SHALL implementeres som en Postgres-trigger (`AFTER INSERT` på `auth.users`) som
kaller en `SECURITY DEFINER`-funksjon med `search_path = ''`. Funksjonen SHALL
sette KUN `id` — `display_name` forblir NULL (Geirs D5: navn avledes ALDRI fra
e-post; `/konto` oppfordrer brukeren til å velge et visningsnavn). Trigger- og
funksjons-SQL SHALL være håndskrevet og committet i repoet (ikke opprettet ved
dashboard-klikking).

Server-hjelperen som leser profil (`getProfile`) SHALL i tillegg ha en defensiv
`INSERT ... ON CONFLICT DO NOTHING`-opprettelse som sikkerhetsnett dersom
triggeren mangler i et miljø.

#### Scenario: ny bruker får profil
- **WHEN** en bruker fullfører magic link-innlogging for første gang og det
  opprettes en rad i `auth.users`
- **THEN** finnes det en tilhørende `profiles`-rad (navnløs — `display_name` NULL,
  D5), klar til at brukeren velger et visningsnavn

#### Scenario: trigger-funksjonen er sikkert konfigurert
- **WHEN** trigger-SQL-en inspiseres
- **THEN** er funksjonen `SECURITY DEFINER` med `set search_path = ''`, og både
  funksjon og trigger finnes som committet SQL i repoet

#### Scenario: defensivt sikkerhetsnett i lesestien
- **WHEN** `getProfile(userId)` kalles for en bruker som mangler profilrad
- **THEN** opprettes raden via `ON CONFLICT DO NOTHING` og en profil returneres,
  uten å kaste

### Requirement: RLS — alle leser, kun eier endrer

`profiles` SHALL ha Row Level Security aktivert. Policyene SHALL være:

- `SELECT`: tillatt for alle (anon + authenticated) — `USING (true)`.
- `UPDATE`: tillatt kun for eier — `USING (auth.uid() = id)` og
  `WITH CHECK (auth.uid() = id)`.
- Ingen klient-`INSERT`- eller `DELETE`-policy: rader opprettes av triggeren og
  slettes via cascade.

Policyene SHALL være håndskrevet, committet SQL (idempotent), og ligge sammen med
migrasjonen i repoet. RLS er dybde-forsvar for PostgREST/anon-stien; den
autoritative eier-sjekken for skriving bor i server action-laget (se
`profiles`-skrivekravet).

#### Scenario: hvem som helst kan lese profiler
- **WHEN** en anonym klient (anon-nøkkel, ingen sesjon) leser fra `profiles` via
  PostgREST
- **THEN** returneres profilradene (visningsnavn + bio er offentlig lesbare)

#### Scenario: bruker kan ikke endre annens profil via anon-stien
- **WHEN** en innlogget bruker forsøker å oppdatere en `profiles`-rad der
  `id != auth.uid()` via PostgREST/anon-stien
- **THEN** nektes oppdateringen av RLS

#### Scenario: RLS er versjonert SQL
- **WHEN** repoet inspiseres
- **THEN** finnes RLS-policyene som committet SQL-fil, ikke kun i Supabase-
  dashboardet

### Requirement: Profildata leses og skrives via Drizzle server-side

Profildata SHALL leses og skrives via Drizzle (`src/db`), ikke via Supabase JS-
klienten (project-foundation-regelen). En server-hjelper `getProfile(userId)`
i `src/lib/profile/` SHALL lese profil via Drizzle og returnere `Profile | null`.
Profiloppdatering SHALL skje i en server action som (1) henter innlogget bruker
via `supabase.auth.getUser()`, (2) validerer og lengdesjekker input, og (3)
skriver via Drizzle med `WHERE id = user.id`. `WHERE`-betingelsen på `user.id`
er den autoritative eier-sjekken (Drizzle-tilkoblingen omgår RLS).

#### Scenario: lesing går via Drizzle
- **WHEN** `getProfile(userId)` inspiseres
- **THEN** leser den fra `profiles` via Drizzle (`src/db`), ikke via Supabase JS-
  klienten

#### Scenario: skriving er eier-avgrenset i app-laget
- **WHEN** en innlogget bruker sender profilskjemaet
- **THEN** validerer server action `getUser()`, og Drizzle-oppdateringen har
  `WHERE id = user.id` slik at kun egen rad kan endres

#### Scenario: utlogget kan ikke skrive
- **WHEN** profil-server-action treffes uten gyldig sesjon
- **THEN** avbrytes den (kast/redirect) uten å skrive til databasen

### Requirement: /konto viser og redigerer egen profil med personvern-merknad

`src/app/konto/page.tsx` SHALL utvides fra en ren «logget inn som»-flate til å
vise brukerens profil (visningsnavn + bio) og la brukeren redigere den. Siden
SHALL forbli en beskyttet, dynamisk server component (guard via `getUser()`,
`redirect("/logg-inn")` når utlogget). E-postadressen SHALL fortsatt vises kun
til eier (den er ikke i profiltabellen). Redigeringsskjemaet SHALL være en
client component som poster til profil-server-action, og SHALL vise en tydelig
merknad om at bio er offentlig lesbar. All bruker-synlig copy SHALL komme fra
`t()` (`profil`-slice i `src/content/locales/no.ts`).

#### Scenario: innlogget ser og kan redigere profil
- **WHEN** en innlogget bruker åpner `/konto`
- **THEN** vises deres e-post, nåværende visningsnavn og bio, med et skjema for å
  endre visningsnavn og bio

#### Scenario: personvern-merknad ved bio
- **WHEN** `/konto`-redigeringsskjemaet vises
- **THEN** står det en tydelig merknad om at bio vises offentlig

#### Scenario: lagring persisterer og oppdaterer updated_at
- **WHEN** brukeren endrer visningsnavn eller bio og lagrer
- **THEN** persisteres endringen, `updated_at` settes til nåtid, og den nye
  verdien vises ved neste lasting

#### Scenario: utlogget redirectes
- **WHEN** en utlogget bruker åpner `/konto`
- **THEN** redirectes hen til `/logg-inn` (uendret fra E3)

#### Scenario: all copy fra t()
- **WHEN** `/konto`- og profilskjema-komponentene inspiseres
- **THEN** hentes all bruker-synlig tekst fra `profil`-slicen i `no.ts` — ingen
  hardkodede strenger

### Requirement: updated_at holdes fersk via database-trigger

`profiles.updated_at` SHALL settes til `now()` ved hver `UPDATE` av en rad, via
en `BEFORE UPDATE`-trigger i databasen (ikke kun satt i app-koden), slik at
enhver skrivevei oppdaterer feltet konsistent. Trigger-SQL SHALL være committet i
repoet sammen med RLS/opprettelses-triggeren.

#### Scenario: updated_at oppdateres av databasen
- **WHEN** en `profiles`-rad oppdateres (uansett skrivevei)
- **THEN** settes `updated_at` til nåtid av en database-trigger
