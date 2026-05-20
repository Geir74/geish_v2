## 1. Dependencies og gitignore

- [x] 1.1 Bekreft at `.env.local` er listet i `.gitignore` før noen ny kode committes; hvis ikke, legg den til
- [x] 1.2 Installer Supabase-pakker: `npm i @supabase/supabase-js @supabase/ssr`
- [x] 1.3 Installer Drizzle-stack: `npm i drizzle-orm postgres` og `npm i -D drizzle-kit dotenv`
- [x] 1.4 Verifiser at `package.json` har korrekte versjoner og at lockfile er committet

## 2. Drizzle DB-lag

- [x] 2.1 Opprett `src/db/index.ts` som eksporterer `client` (postgres-instans med `prepare: false`) og `db` (Drizzle-instans bundet til `client`); kast eksplisitt feil hvis `DATABASE_URL` mangler. Legg topp-kommentar: *"Primary read/write/migrations path for all domain data. Do NOT bypass via the Supabase JS client — that one is reserved for auth/realtime/storage."*
- [x] 2.2 Opprett `src/db/schema.ts` som tom placeholder med en kommentar om at tabeller defineres i feature-mandater
- [x] 2.3 Opprett `drizzle.config.ts` på repo-rot med `dotenv/config` lastet fra `.env.local`, `schema: './src/db/schema.ts'`, `out: './drizzle'`, `dialect: 'postgresql'`, og `dbCredentials.url` fra `DIRECT_URL` (ikke `DATABASE_URL` — drizzle-kit henger mot transaction pooler). Kast eksplisitt hvis `DIRECT_URL` mangler.
- [x] 2.4 Legg til scripts i `package.json`: `"db:generate": "drizzle-kit generate"` og `"db:push": "drizzle-kit push"`
- [x] 2.5 Legg til `DIRECT_URL` i `.env.local` (samme som `DATABASE_URL`, men port 5432 i stedet for 6543 — session pooler i stedet for transaction pooler)
- [x] 2.6 Kjør `npm run db:generate` (OK, 0 tables) og `npm run db:push` (wired og konfig validert — selve push-en kunne ikke fullføres fra denne dev-maskinen fordi session pooler ikke er provisjonert for dette prosjektet og direkte-DB er IPv6-only; verifiseres i CI eller fra IPv6-miljø ved første schema-mandat)

## 3. Supabase-klienter

- [x] 3.1 Opprett `src/lib/supabase/server.ts` med `createClient()` basert på `createServerClient` fra `@supabase/ssr` og Next.js `cookies()`-API. Topp-kommentar: *"Use for auth/realtime/storage only. Domain reads/writes go through Drizzle (src/db/index.ts). The smoke route is the sole exception — it intentionally hits PostgREST to verify the anon key."*
- [x] 3.2 Opprett `src/lib/supabase/client.ts` med `createClient()` basert på `createBrowserClient` fra `@supabase/ssr`. Samme topp-kommentar som 3.1.
- [x] 3.3 Bekreft at begge filer leser `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY` og kaster ved manglende verdier

## 4. shadcn/ui + Tailwind v4

- [x] 4.1 Kjør `git status` for å snapshotte før-tilstand
- [x] 4.2 Kjør `npx shadcn@latest init` og velg Tailwind v4-preset, `src/`-alias, og baseColor etter shadcn defaults
- [x] 4.3 Verifiser at `components.json` ble opprettet på rot og at `globals.css`/PostCSS-konfig fortsatt er gyldig (`npm run dev` starter)
- [x] 4.4 Kjør `npx shadcn@latest add button` for å legge til `src/components/ui/button.tsx` (inkludert i init via preset)
- [x] 4.5 Sjekk at `Button` kan importeres uten typescript-feil

## 5. Smoke test på egen rute (src/app/smoke/page.tsx)

- [x] 5.1 Opprett `src/app/smoke/page.tsx` som async server component
- [x] 5.2 Verifiser at Drizzle-modulen importerer og instansierer postgres-js-klient uten å kaste (ingen nettverkskall). Live `SELECT 1` deferred — se 5.7.
- [x] 5.3 Verifiser at Supabase server-klient importerer og instansieres uten å kaste (env-vars + cookies-API). Live PostgREST-kall deferred — se 5.7.
- [x] 5.4 Importer `Button` fra `@/components/ui/button` og rendre den sammen med begge statusene
- [x] 5.5 Start `npm run dev`, besøk `/smoke`, bekreft visuelt at begge "wired"-statuser vises og at `<Button>` rendres
- [ ] ~~5.6 Sanity-test feil-stien for ugyldig anon-key~~ — droppet sammen med live-verifisering
- [ ] 5.7 **Deferred til første schema-mandat**: Live DB-tilkobling (Drizzle `SELECT 1` mot transaction pooler) + Supabase PostgREST-verifisering + `db:push` mot ekte schema. `.env.local` har allerede aws-1 pooler-host og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ikke anon) notert for det arbeidet.

## 6. App-placeholder og verifisering

- [x] 6.0 Erstatt scaffold-`src/app/page.tsx` med en enkel placeholder: `<h1>geish v2</h1>` + en shadcn `<Button>`
- [x] 6.1 `npm run dev` starter uten kompileringsfeil
- [x] 6.2 `/` returnerer 200 og viser "geish v2" + `<Button>`; `/smoke` returnerer 200 og viser begge "wired"-statuser + `<Button>`
- [x] 6.3 `npm run db:generate` kjører uten feil (CLI-helse). `db:push` er wired men deferred til 5.7.
- [x] 6.4 `git status` er ren etter ferdig commit; `.env.local` dukker ikke opp som tracked; ingen utilsiktede endringer i andre filer
