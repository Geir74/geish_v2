## ADDED Requirements

### Requirement: Drizzle ORM kobler til Supabase via Transaction pooler

Prosjektet SHALL ha en sentral Drizzle-instans i `src/db/index.ts` som kobler til Supabase PostgreSQL via Transaction pooler. `postgres`-driveren MUST instansieres med `prepare: false`, og connection string MUST hentes fra `DATABASE_URL` (lest fra `.env.local` i CLI-kontekst, fra prosess-env i Next.js runtime).

Ingen andre filer i kodebasen SHALL instansiere en `postgres()`-klient direkte; all DB-tilgang går gjennom den eksporterte `db`.

#### Scenario: Drizzle-instans eksporteres fra én sentral fil
- **WHEN** en utvikler importerer `db` i en server component eller route handler
- **THEN** importen kommer fra `src/db/index.ts` og returnerer en Drizzle-instans bundet til `postgres`-klient konfigurert med `prepare: false`

#### Scenario: Smoke-ruten bekrefter at Drizzle er wired
- **WHEN** Next.js dev-server kjører og `/smoke` rendres
- **THEN** Drizzle-modulen importerer og instansierer postgres-js-klienten uten å kaste, og `dbStatus` viser `"wired (live verification deferred to first schema mandate)"`. Live `SELECT 1` mot pooleren utføres ikke i project-init — den deferres til første schema-mandat når det finnes et reelt schema å verifisere mot.

#### Scenario: Manglende DATABASE_URL feiler høylytt
- **WHEN** `DATABASE_URL` mangler eller er tom ved oppstart
- **THEN** Drizzle-modulen kaster en eksplisitt feil som identifiserer hvilken env-variabel som mangler

### Requirement: Supabase-klienter for server og browser via @supabase/ssr

Prosjektet SHALL eksponere to separate Supabase-klient-fabrikker: én for server (RSC, server actions, route handlers) og én for browser (client components). Begge MUST bruke `@supabase/ssr` og lese `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Server-klienten MUST bruke Next.js `cookies()`-API for cookie-håndtering. Browser-klienten MUST bruke `createBrowserClient`.

#### Scenario: Server-klient instansieres i en server component
- **WHEN** en server component kaller `createClient()` fra `src/lib/supabase/server.ts`
- **THEN** funksjonen returnerer en Supabase-klient som er bundet til request-scoped cookies uten å kaste

#### Scenario: Browser-klient instansieres i en client component
- **WHEN** en client component kaller `createClient()` fra `src/lib/supabase/client.ts`
- **THEN** funksjonen returnerer en `SupabaseClient`-instans uten å kaste

#### Scenario: Manglende Supabase-env feiler høylytt
- **WHEN** `NEXT_PUBLIC_SUPABASE_URL` eller `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` mangler ved klient-instansiering
- **THEN** klient-fabrikken kaster en eksplisitt feil som navngir variabelen som mangler

### Requirement: Smoke-ruten verifiserer at Supabase-klient er wired

Smoke-ruten SHALL verifisere at Supabase server-klient kan importeres og instansieres uten å kaste — env-vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) er lest, cookies-API er kalt, og klient-konstruktøren returnerer en gyldig instans.

Live PostgREST-verifisering (faktisk request gjennom anon/publishable-laget) er **deferred til første schema-mandat**, der det finnes en reell tabell å treffe. Project-init landes uten live DB-verifisering for å unngå at pooler-host/key-rotasjon i utviklingsmiljø blokkerer et ellers ferdig fundament. `auth.getUser()` SHALL fortsatt ikke brukes som helsesjekk når live-verifisering implementeres (returnerer falsk-positiv ved tom session).

#### Scenario: Supabase-klient instansieres uten feil
- **WHEN** `/smoke` rendres med korrekt `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` i `.env.local`
- **THEN** server-klienten instansieres uten å kaste og `supabaseStatus` viser `"wired (live verification deferred to first schema mandate)"`

#### Scenario: Manglende env feiler høylytt
- **WHEN** `/smoke` rendres uten `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **THEN** klient-fabrikken kaster en eksplisitt feil som navngir variabelen, og smoke-ruten viser `supabaseStatus = "fail: <melding>"` (ikke `"wired"`)

### Requirement: Styringsregel — Drizzle for data, Supabase-klient for auth/realtime/storage

Prosjektet SHALL ha en eksplisitt arbeidsdeling mellom de to DB-veiene:

- **Drizzle** er primær- og eneste vei for lesing, skriving, og migrations mot domene-tabeller.
- **Supabase-klienten** SHALL kun brukes for plattformtjenester: auth, realtime og storage. Den SHALL NOT brukes til `from('<domain_table>').select()` i applikasjonskode.

Regelen MUST være dokumentert som topp-kommentar i `src/db/index.ts` og i begge filer under `src/lib/supabase/`. Smoke-ruten er det eneste tillatte unntaket, og MUST være kommentert som sådan.

#### Scenario: Topp-kommentarer beskriver styringsregelen
- **WHEN** en utvikler åpner `src/db/index.ts`, `src/lib/supabase/server.ts`, eller `src/lib/supabase/client.ts`
- **THEN** filen starter med en kommentar som angir at Drizzle er primær-DB-vei og at Supabase-klienten er reservert for auth/realtime/storage

#### Scenario: Smoke-ruten er det dokumenterte unntaket
- **WHEN** en utvikler åpner `app/smoke/page.tsx`
- **THEN** filen har en kommentar som markerer at PostgREST-kallet bryter styringsregelen bevisst for helsesjekk-formål

### Requirement: shadcn/ui initialisert med Tailwind v4

Prosjektet SHALL ha shadcn/ui initialisert via `shadcn@latest` med Tailwind v4-preset. `components.json` MUST ligge på repo-rot. Minst én testkomponent (`Button`) MUST være lagt til under `src/components/ui/` og importeres i smoke-ruten.

Tailwind v3-spesifikk konfig (f.eks. `tailwind.config.ts` med v3-syntaks) SHALL NOT introduseres.

#### Scenario: components.json finnes med Tailwind v4-konfig
- **WHEN** repo er initialisert
- **THEN** `components.json` finnes på rot og refererer til Tailwind v4 og `src/`-aliaser

#### Scenario: Button-komponent rendres i smoke-ruten
- **WHEN** dev-server kjører og `/smoke` rendres
- **THEN** `<Button>` fra `src/components/ui/button.tsx` vises uten typescript- eller runtime-feil

### Requirement: Mappestruktur for db og supabase

Prosjektet SHALL etablere mappestrukturen:
- `src/db/index.ts` — Drizzle-instans og postgres-klient
- `src/db/schema.ts` — placeholder for fremtidige tabeller
- `src/lib/supabase/server.ts` — server-side Supabase-klient
- `src/lib/supabase/client.ts` — browser-side Supabase-klient
- `src/components/ui/` — shadcn-komponenter
- `app/smoke/page.tsx` — slettbar smoke-rute

DB-laget og Supabase-klient-laget MUST være separate (ingen kryssimporter utenfor smoke-ruten).

#### Scenario: Mappestruktur eksisterer
- **WHEN** repo er initialisert
- **THEN** alle filene over eksisterer med ikke-tomt innhold

#### Scenario: app/page.tsx er urørt
- **WHEN** initialiseringen er ferdig
- **THEN** `app/page.tsx` er identisk med utgangstilstanden fra Next.js-scaffold (første feature-mandat eier den ruten)

### Requirement: drizzle-kit scripts og config

`package.json` SHALL eksponere npm-scripts `db:generate` og `db:push` som kjører `drizzle-kit generate` og `drizzle-kit push`. `drizzle.config.ts` MUST ligge på repo-rot, peke schema-path til `./src/db/schema.ts`, og MUST eksplisitt laste `.env.local` (via `dotenv/config`).

`drizzle.config.ts` MUST lese `DIRECT_URL` (Session pooler, port 5432) — *ikke* `DATABASE_URL` (Transaction pooler, port 6543) — fordi drizzle-kit sin interne tilkobling ikke honorerer `prepare: false` og henger mot pgBouncer transaction mode. Filen MUST kaste eksplisitt hvis `DIRECT_URL` mangler, med en feilmelding som forklarer at session pooler kreves.

Scriptene er en CLI-helsesjekk som verifiserer at konfigen er gyldig og at drizzle-kit kan koble til session pooler — de er ikke et bevis på at migreringer fungerer. Den autoritative tilkoblingstesten er Drizzle `SELECT 1` i smoke-ruten, som går gjennom transaction pooler.

#### Scenario: db:generate kjører uten feil
- **WHEN** `npm run db:generate` kjøres med tom schema
- **THEN** drizzle-kit avslutter uten feil (selv om ingen migrations genereres)

#### Scenario: db:push kjører uten feil mot session pooler
- **WHEN** `npm run db:push` kjøres med tom schema og `DIRECT_URL` satt til Session pooler (port 5432)
- **THEN** drizzle-kit kobler til, finner ingen endringer, og avslutter uten feil innen rimelig tid (ikke henger på introspeksjon)

#### Scenario: Manglende DIRECT_URL feiler høylytt
- **WHEN** `npm run db:push` eller `npm run db:generate` kjøres uten `DIRECT_URL` satt
- **THEN** drizzle.config.ts kaster en eksplisitt feil som navngir `DIRECT_URL` og forklarer at det skal være session pooler

### Requirement: .env.local er gitignored

`.env.local` SHALL være listet i `.gitignore` før noen ny kode fra dette mandatet committes, slik at hemmeligheter (DB-passord, anon-nøkkel) ikke havner i historikken.

#### Scenario: .env.local er ikke tracked
- **WHEN** `git status --ignored` kjøres etter initialisering
- **THEN** `.env.local` listes under ignored, og `git ls-files .env.local` returnerer tom

### Requirement: Dev-server starter rent, forsiden og smoke-ruten laster

Prosjektet SHALL kunne startes med `npm run dev` uten kompileringsfeil eller runtime-feil i den initielle render-syklusen. Forsiden (`/`) SHALL vise en placeholder med "geish v2"-overskrift og en shadcn `<Button>`. Smoke-ruten (`/smoke`) SHALL laste 200 og vise begge "wired"-statuser plus en `<Button>`.

#### Scenario: forsiden laster
- **WHEN** `npm run dev` kjøres og HTTP-request sendes til `/`
- **THEN** ruten returnerer 200 og responsen inneholder "geish v2" og en `<Button>`-komponent

#### Scenario: smoke-ruten laster
- **WHEN** `npm run dev` kjøres med gyldig `.env.local` og HTTP-request sendes til `/smoke`
- **THEN** ruten returnerer 200 og responsen viser `dbStatus = "wired (live verification deferred to first schema mandate)"`, `supabaseStatus = "wired (live verification deferred to first schema mandate)"`, samt en `<Button>`
