## Why

E3 ga geish.no *identitet* (magic link, `useUser()`, beskyttet `/konto`) men
bevisst *ingen data*: `src/db/schema.ts` er tom, ingen Drizzle-migrasjoner,
ingen RLS. Alt sosialt som står for tur — gjestebok (E5) og Stua (E6) — trenger
minst ett **visningsnavn** å feste bidrag til. Uten et navn er en innlogget
bruker bare en e-post; det holder ikke for et forum eller en signert gjestebok.

E4 legger den **første ekte datatabellen** i prosjektet: `profiles`, knyttet
1:1 til `auth.users`. Fordi dette er første tabell, handler epicen like mye om
å **etablere DB-mønsteret** — hvordan Drizzle-tabeller defineres, hvordan
migrasjoner genereres og committes, hvor RLS-policyer og Postgres-triggere bor,
og hvordan auto-opprettelse av rader gjøres — som om selve profilfeltet.
E5/E6 skal kunne kopiere dette mønsteret uten å finne opp hjulet på nytt.

**Sikkerhetsmodellen må forstås riktig fra start:** domenedata går gjennom
Drizzle (project-foundation-regelen fra E0), som kobler til med `DATABASE_URL`
og dermed **omgår RLS**. Den autoritative eier-sjekken bor derfor i server
action-laget (`getUser()` + `id = user.id`), akkurat som E3s guard bor i pagen,
ikke i middleware. RLS-policyene E4 skriver er **dybde-forsvar** for
PostgREST/anon-stien (og fremtidig realtime i E6) — ikke den primære muren.
Det er et mandatkrav og god praksis, men designet sier tydelig hva som beskytter
hva, så RLS ikke ser overflødig ut.

## What Changes

- **Drizzle tas i bruk for første gang.** `src/db/schema.ts` går fra tom
  placeholder til å definere `profiles`. `drizzle-kit generate` produserer
  første SQL-migrasjon under `drizzle/`, som committes. Konvensjonen fastsettes
  og dokumenteres for E5/E6.
- **`profiles`-tabell** (Drizzle `pgTable`):
  - `id uuid` PRIMARY KEY, FK → `auth.users(id)` `ON DELETE CASCADE`.
  - `display_name text NOT NULL` — visningsnavn (lengdegrense i app + `CHECK`).
  - `bio text` — valgfri, kort presentasjon (lengdegrense). **Offentlig lesbar.**
  - `created_at timestamptz NOT NULL DEFAULT now()`.
  - `updated_at timestamptz NOT NULL DEFAULT now()` (holdes fersk via trigger).
- **Auto-opprettelse via Postgres-trigger** (anbefalt, se design D2): en
  `SECURITY DEFINER`-funksjon `handle_new_user()` på `AFTER INSERT` på
  `auth.users` setter inn en `profiles`-rad med et default `display_name`
  utledet fra e-postens lokaldel. Garanterer at ingen innlogget bruker mangler
  profil, uansett inngangsrute. Trigger-SQL committes i repoet.
- **RLS på `profiles`** (dybde-forsvar for anon/PostgREST-stien):
  - `ENABLE ROW LEVEL SECURITY`.
  - `SELECT`: `USING (true)` for alle (anon + authenticated) — offentlig
    visningsnavn/bio.
  - `UPDATE`: `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` — kun eier.
  - Ingen klient-`INSERT`/`DELETE`-policy: rader opprettes av triggeren,
    slettes via cascade når `auth.users`-raden fjernes.
- **/konto utvides** fra ren «logget inn som»-flate til **vis + rediger egen
  profil**: viser e-post (uendret) + display_name + bio, med et redigeringsskjema.
  Lagring via **server action** (E3 D1 åpnet eksplisitt for server actions i E4)
  som validerer `getUser()`, trimmer/lengdesjekker input, og skriver via Drizzle
  med `where id = user.id`. Tydelig personvern-merknad: bio vises offentlig.
- **Profil-hjelpere som mønster for E5/E6:**
  - Server-side (autoritativ): `getProfile(userId)` i `src/lib/profile/` — leser
    via Drizzle. Brukes av `/konto` og senere av E5/E6 for å slå opp navn.
  - Client-side (kosmetisk): lettvekts-utvidelse så client-UI kan vise eget
    visningsnavn (f.eks. `useProfile()` som bygger på `useUser()`), aldri som
    tilgangskontroll. Konkret form avgjøres i design (D5).
- **Norsk copy** i ny `profil`-slice i `src/content/locales/no.ts` (utkast Geir
  godkjenner) — inkludert eksplisitt «dette vises offentlig»-tekst.

## Capabilities

### New Capabilities
- `profiles`: `profiles`-tabell (1:1 med `auth.users`), auto-opprettet ved
  første innlogging, med RLS (alle leser, kun eier endrer). `/konto` viser og
  redigerer eget visningsnavn + bio via server action. Server- og client-
  hjelpere for profildata som E5/E6 arver.

### Modified Capabilities
- `project-foundation`: Drizzle-fundamentet (tomt siden E0) tas i bruk —
  `src/db/schema.ts` får sin første tabell, første `drizzle-kit`-migrasjon
  committes, og konvensjonen for tabeller + migrasjoner + hvor RLS/trigger-SQL
  bor fastsettes for E5/E6.
- `auth`: Innlogget-tilstands-mønsteret utvides med profildata (server-hjelper
  + kosmetisk client-hjelper), og `/konto` blir en profilflate i tillegg til
  auth-verifiseringsflate.

## Impact

- **Avhengigheter:** ingen nye npm-pakker. `drizzle-orm`, `drizzle-kit`,
  `postgres` er installert siden E0. Ingen nye UI-avhengigheter.
- **Env-vars:** ingen nye i appen. `DATABASE_URL` (app, port 6543,
  `prepare:false`) og `DIRECT_URL` (drizzle-kit, port 5432) må være satt i
  `.env.local` for å kjøre migrasjoner — dokumentert i tasks (forutsetning fra
  E0, ikke ny variabel).
- **Supabase-konfig (utenfor repoet, dokumenteres i tasks):** migrasjonen +
  RLS/trigger-SQL må kjøres mot prosjektet (via `drizzle-kit push`/`migrate`
  for tabellen, og SQL-en for RLS+trigger — se design D3). Ingen dashboard-
  klikking for policyer; alt er versjonert SQL.
- **Filsystem (nytt):**
  - `src/db/schema.ts` (fylles) — `profiles`-tabell + relasjoner.
  - `drizzle/00XX_*.sql` (generert migrasjon) + `drizzle/meta/*` (snapshot).
  - `drizzle/rls/profiles.sql` (eller tilsvarende) — RLS-policyer + trigger,
    håndskrevet SQL (Drizzle genererer ikke RLS/triggere). Plassering låses i D3.
  - `src/lib/profile/get-profile.ts` — server-hjelper (Drizzle).
  - `src/lib/profile/use-profile.ts` — kosmetisk client-hjelper (hvis valgt i D5).
  - `src/app/konto/actions.ts` — server action for profiloppdatering.
  - `src/app/konto/ProfileForm.tsx` + `.module.css` — redigeringsskjema (client).
- **Filsystem (modifisert):**
  - `src/app/konto/page.tsx` — henter + viser profil, rendrer `ProfileForm`.
  - `src/app/konto/page.module.css` — stil for profil/skjema.
  - `src/content/locales/no.ts` — ny `profil`-slice.
  - Evt. `src/lib/auth/use-user.ts` berøres IKKE (holdes ren); profil legges i
    egen hjelper (se D5).
- **Røres ikke:** blogg (E2), manifest, forside-seksjonene, designsystem-tokens,
  auth-flyten (E3: middleware, callback, logg-inn, logg-ut, cookie-domene),
  smoke-ruten.
- **Eksterne systemer:** Supabase Postgres (eu-north-1) får sin første domene-
  tabell + policyer + trigger. `auth.users` styres fortsatt av Supabase; E4
  bare hekter en trigger på den.
- **Ut av scope:**
  - Gjestebok (E5), Stua/forum (E6).
  - Avatar-/bildeopplasting (Supabase Storage) — senere.
  - Offentlige profilsider (`/folk/<navn>`) — senere mulighet, nevnt ikke bygd.
  - Admin-rolle / moderering — E5/E6; E4 legger på sin høyde et billig krok-punkt.
  - Custom Postgres-roller for Drizzle, RLS-håndhevet Drizzle-tilkobling — senere.
  - Unikhets-håndheving på `display_name` hvis Geir velger «ikke unik» (se D4).
