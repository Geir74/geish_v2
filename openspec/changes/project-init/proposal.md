## Why

geish_v2 er et tomt Next.js 16-skall uten database-tilkobling, UI-bibliotek eller verifisert infrastruktur. Før neste feature kan bygges trenger prosjektet et komplett, utviklingsklart fundament der Supabase, Drizzle og shadcn/ui er installert, koblet og smoke-testet — slik at videre arbeid kan fokusere på domenefunksjonalitet i stedet for plumbing. Fundamentet skal også slå fast *hvordan* de to DB-veiene (Drizzle og Supabase-klient) skal brukes, så features ikke ender med å blande dem tilfeldig.

## What Changes

- Installer og konfigurer `@supabase/supabase-js` og `@supabase/ssr` med separate klienter for server og browser
- Installer og konfigurer Drizzle ORM (`drizzle-orm`, `postgres`, `drizzle-kit`) mot Supabase Transaction pooler med `prepare: false`
- **To DB-URL-er**: `DATABASE_URL` (Transaction pooler, port 6543) for app-runtime; `DIRECT_URL` (Session pooler, samme host, port 5432) for `drizzle-kit`. Transaction pooler kan ikke serve `drizzle-kit` sin introspeksjon (prepared statements), og runtime-flagget `prepare: false` propagerer ikke til CLI-en — den har egen connection. Session pooler velges over direktekobling (`db.<ref>...:5432`) fordi sistnevnte er IPv6-only og brekker på IPv4-nett/CI.
- Etabler en styringsregel: **Drizzle er primær lese/skrive- og migrations-vei; Supabase-klienten reserveres for auth, realtime og storage.** Regelen dokumenteres i topp-kommentar i `src/db/index.ts` og `src/lib/supabase/`-filene, så valget er åpenbart for fremtidig kode.
- Initialiser shadcn/ui med Tailwind v4 via `shadcn@latest` og verifiser med `Button`-komponent
- Opprett mappestruktur `src/db/` (schema, klient) og `src/lib/supabase/` (server/browser-klienter)
- Opprett `drizzle.config.ts` pekt mot `DIRECT_URL`
- Legg til npm-scripts `db:generate` og `db:push`
- Implementer en smoke test på **egen, slettbar rute (`app/smoke/page.tsx`)** — ikke på forsiden — som i samme kjøring verifiserer (a) Drizzle-tilkobling via `SELECT 1`, og (b) at Supabase-klienten faktisk når PostgREST med gyldig anon-nøkkel (en feilende nøkkel/URL skal gi rød status, ikke bare at klienten lar seg instansiere)
- Bekreft at `.env.local` er gitignored før første commit

## Capabilities

### New Capabilities
- `project-foundation`: Utviklingsklart fundament — Supabase-klienter (server/browser), Drizzle ORM-tilkobling mot Supabase pooler, shadcn/ui med Tailwind v4, en eksplisitt styringsregel for Drizzle-vs-Supabase-bruk, og en verifiserbar smoke test på egen rute som bekrefter at både Postgres-protokollen (Drizzle) og PostgREST-laget (Supabase) fungerer mot riktig miljø.

### Modified Capabilities
<!-- Ingen — dette er en greenfield-endring uten eksisterende specs. -->

## Impact

- **Avhengigheter (nye)**: `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`, `postgres`, `drizzle-kit`, `dotenv` (dev), samt shadcn/ui sine peer-deps (`class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`)
- **Filsystem**: Nye filer i `src/db/`, `src/lib/supabase/`, `src/components/ui/`, `drizzle.config.ts`, `components.json`, samt **ny `app/smoke/page.tsx`**. `app/page.tsx` forblir urørt — første feature skriver den.
- **Konfig**: `package.json` får nye scripts (`db:generate`, `db:push`); Tailwind/PostCSS-konfig oppdateres for shadcn-kompatibilitet
- **Env**: Forventer `DATABASE_URL` (transaction pooler, runtime), `DIRECT_URL` (session pooler, port 5432, for drizzle-kit), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` i `.env.local`; fila skal være gitignored. `DIRECT_URL` = `DATABASE_URL` med port 6543 → 5432 (samme host og brukernavn).
- **Eksterne systemer**: Supabase-prosjekt `ajsjzdgflnyyoljiqrpq` (eu-north-1) — kun lese-tilkobling i smoke test, ingen schema-endringer
- **Ut av scope**: Ingen features, ingen tabeller, ingen auth-flows, ingen middleware, ingen deploy
