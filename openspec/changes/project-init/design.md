## Context

geish_v2 er initialisert som et bart Next.js 16-prosjekt med App Router og `src/`-struktur. Tailwind v4 ligger som dev-dep via `@tailwindcss/postcss`, men det finnes ingen DB-tilkobling, ingen Supabase-klient og ingen UI-bibliotek. Mandatet `openspec/mandates/project-init.md` definerer et greenfield-fundament som må stå før neste feature kan bygges.

**Eksterne konstanter:**
- Supabase-prosjekt `ajsjzdgflnyyoljiqrpq` ligger i `eu-north-1` (Stockholm).
- `.env.local` har allerede `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` satt, og skal være gitignored.
- Next.js 16 har breaking changes vs. tidligere versjoner — CLAUDE.md krever at `node_modules/next/dist/docs/` konsulteres for relevante API-er.
- Tailwind v4 bruker CSS-first config (`@import "tailwindcss"` i `globals.css`), ikke `tailwind.config.ts`. shadcn må initialiseres med `shadcn@latest` (ikke `shadcn-ui`).

**Stakeholders:** Solo-dev (eier av prosjektet). Ingen eksisterende brukere — vi kan velge fritt innenfor mandatets constraints.

## Goals / Non-Goals

**Goals:**
- Etablere en repeterbar, verifiserbar tilkobling fra Next.js til Supabase via to uavhengige veier: Drizzle ORM (Postgres-protokoll, Transaction pooler) og Supabase JS-klient (PostgREST via anon-nøkkel).
- Velge mappestruktur som matcher Drizzle + Supabase best practice for 2026 og er åpenbar for fremtidig kode.
- Slå fast en styringsregel for *hvilken* klient som brukes til *hva*, så features ikke blander Drizzle og Supabase tilfeldig.
- Gi en smoke test som faktisk *kjører* mot Supabase og feiler høylytt hvis miljøet er feilkonfigurert — uten å forurense `app/page.tsx`.
- Holde overflaten liten: ingen schema, ingen middleware, ingen auth-flows.

**Non-Goals:**
- Definere domene-tabeller eller migrations (kommer i feature-mandater).
- Sette opp Supabase Auth, RLS-policies, middleware eller session-håndtering.
- Endre `app/page.tsx` — første feature eier den ruten.
- Vercel-deploy, CI, eller produksjonsobservability.
- Eslint/Prettier-tuning utover Next.js defaults.

## Decisions

### D1. Drizzle bruker `postgres-js` mot Transaction pooler (port 6543) med `prepare: false`

**Valg:** `drizzle-orm/postgres-js` + `postgres`-driveren, med connection string fra `DATABASE_URL` som peker på Supabase pooler i transaction mode (`...pooler.supabase.com:6543`).

**Hvorfor:** Supabase Transaction pooler er pgBouncer i transaction mode, som ikke støtter prepared statements. `postgres`-driveren må eksplisitt få `prepare: false` — ellers feiler queries med `prepared statement does not exist` ved andre kall. Mandatet krever dette.

**Alternativer vurdert:**
- `node-postgres` (`pg`): Tyngre, mindre ergonomisk med Drizzle, ingen gevinst her.
- Session pooler (port 5432): Støtter prepared statements, men er strupet på antall connections og ikke anbefalt for serverless runtime. Vi velger transaction pooler for runtime, og bruker session pooler kun for drizzle-kit (se D1b).
- Direkte tilkobling (db.<ref>.supabase.co:5432): Ikke skalerbar fra Vercel/serverless, og IPv6-only — brekker på IPv4-nett/CI.

### D1b. drizzle-kit CLI bruker `DIRECT_URL` (Session pooler, port 5432)

**Valg:** `drizzle.config.ts` leser en separat env-var `DIRECT_URL` som peker på Session pooler (`...pooler.supabase.com:5432`, samme host som `DATABASE_URL`, kun port og bruker-handle skiller). App-runtime bruker fortsatt `DATABASE_URL` (transaction pooler, 6543).

**Hvorfor:** `drizzle-kit` (introspeksjon, `push`, `migrate`, `studio`) bruker sin egen interne postgres-tilkobling og honorerer *ikke* `prepare: false` fra drizzle.config.ts. Mot pgBouncer transaction mode henger introspeksjonen evig fordi prepared statements droppes mellom queries. Session pooler holder samme session for hele transaksjonen og støtter prepared statements — derfor virker drizzle-kit der.

Dette er det kanoniske Supabase + Drizzle-mønsteret (samme idé som Prisma sin `directUrl`). To URL-er er en liten kostnad mot å få både serverless-vennlig runtime *og* en CLI som faktisk fungerer.

**Alternativer vurdert:**
- Direkte tilkobling (`db.<ref>.supabase.co:5432`) for drizzle-kit: Avvist — IPv6-only, så det brekker på IPv4-only utviklermaskiner og CI.
- Bare session pooler for både runtime og CLI: Avvist — strupes på connections under serverless burst.
- Patche/wrappe drizzle-kit for å sende `prepare: false`: Avvist — uvedlikeholdbart, brytes ved oppgradering.
- Hardkode port-swap (6543 → 5432) i drizzle.config.ts: Avvist — implisitt magi, vanskelig å bytte hvis Supabase endrer pooler-arkitekturen.

### D2. To Supabase-klienter via `@supabase/ssr` — én for server, én for browser

**Valg:** `src/lib/supabase/server.ts` eksporterer `createClient()` som bruker `createServerClient` fra `@supabase/ssr` med Next.js `cookies()`-API. `src/lib/supabase/client.ts` eksporterer en browser-klient via `createBrowserClient`.

**Hvorfor:** Next.js 16 App Router skiller server- og client-komponenter strengt. `@supabase/ssr` er Supabase' offisielle pakke for SSR-kompatibilitet og håndterer cookie-basert auth korrekt. Selv om vi ikke gjør auth i dette mandatet, etablerer vi mønsteret nå så fremtidige features ikke trenger å refaktorere.

**Alternativer vurdert:**
- Kun `@supabase/supabase-js` med en singleton: Bryter på server (cookies, request scope). Avvist.
- Kun server-klient: Vi vil ha hooks/realtime tilgjengelig i fremtiden — billig å sette opp browser-klient nå.

### D3. Styringsregel: Drizzle for data, Supabase-klient for plattformtjenester

**Valg:** Eksplisitt arbeidsdeling:
- **Drizzle** er primær- og *eneste* vei for lesing, skriving, og migrations mot domene-tabeller.
- **Supabase-klienten** brukes kun til plattformfunksjoner som ikke har en god ORM-ekvivalent: **auth, realtime, og storage**. Den brukes *ikke* til `from('domain_table').select()` i applikasjonskode.

Regelen dokumenteres som topp-kommentar i `src/db/index.ts` ("primary read/write/migrations path") og i `src/lib/supabase/server.ts` + `client.ts` ("use for auth/realtime/storage only — domain data goes through Drizzle"). Smoke-test-ruten er det eneste unntaket: der treffer Supabase-klienten PostgREST bevisst for å verifisere at anon-nøkkel + URL faktisk fungerer.

**Hvorfor:** Med to klienter mot samme prosjekt blir det fort kaotisk hvilken som skal brukes hvor. Drizzle gir typesikkerhet og migrations; Supabase-klienten er nødvendig for plattformfunksjoner som RLS-aware auth, realtime channels og signed URLs. En skreven regel i toppen av de aktuelle filene er billigere å håndheve enn lint-regler.

**Alternativer vurdert:**
- Tillate begge mot domene-tabeller og la stil bestemme: Avvist — vil gi dobbeltlogikk og divergerende typer.
- Bare Drizzle, droppe Supabase JS-klienten: Avvist — vi trenger uansett auth/realtime senere, og `@supabase/ssr` koster lite nå.

### D4. Mappestruktur: `src/db/` + `src/lib/supabase/`

**Valg:**
```
src/
  db/
    index.ts        // eksporterer `db` (Drizzle-instans) og `client` (postgres-instans); topp-kommentar med styringsregel
    schema.ts       // tom placeholder med en kommentar; tabeller kommer i feature-mandater
  lib/
    supabase/
      server.ts     // createClient() for RSC / server actions / route handlers; topp-kommentar med styringsregel
      client.ts     // createClient() for client components; topp-kommentar med styringsregel
```
`drizzle.config.ts` ligger på repo-rot.

**Hvorfor:** Følger Drizzle-dokumentasjonens anbefaling (`src/db/`) og Supabase' SSR-guide for Next.js App Router (`src/lib/supabase/`). Holder DB-laget separat fra Supabase-klient-laget — de er to forskjellige API-er mot samme prosjekt og bør ikke blandes.

**Alternativer vurdert:**
- Alt under `src/lib/db/`: Skjuler at Drizzle er førstelinje-DB-API. Avvist.
- Flat `src/supabase.ts` + `src/db.ts`: Skalerer ikke — vi får flere filer (schema, migrations, hooks) snart.

### D5. shadcn/ui med Tailwind v4 via `shadcn@latest init`

**Valg:** Kjør `npx shadcn@latest init` med Tailwind v4-preset. Legg én komponent (`button`) som røyktest. `components.json` på rot, komponenter under `src/components/ui/`. `Button` importeres i smoke-ruten (ikke `app/page.tsx`).

**Hvorfor:** `shadcn@latest` (ikke `shadcn-ui` som er deprecated) støtter Tailwind v4 og Next.js 16. Mandatet krever én verifiserbar komponentimport.

**Alternativer vurdert:**
- Manuell oppsett uten shadcn CLI: Mer skjør, ingen gevinst.
- Tailwind v3: Brutt mot mandat-constraint.

### D6. Smoke test som dedikert, slettbar rute `app/smoke/page.tsx`

**Valg:** Opprett en ny rute `app/smoke/page.tsx` som async server component. Den:
1. Importerer `db` fra `@/db` og kjører `select(sql\`1\`)` (eller tilsvarende `SELECT 1`); fanger feil til `dbStatus`.
2. Importerer `createClient` fra `@/lib/supabase/server`, treffer PostgREST med anon-nøkkelen — f.eks. ved å gjøre `client.from('nonexistent_smoke_table').select('*').limit(0)` og sjekke at responsen er en *tabell-ikke-funnet*-feil fra PostgREST (kode `42P01` / status 404 fra schema-introspeksjon) og *ikke* en 401/`Invalid API key`/nettverksfeil. En 401 → `supabaseStatus = "fail: invalid key"`; en nettverksfeil → `"fail: unreachable"`; tabell-ikke-funnet → `"ok"` (det beviser at requesten kom gjennom auth-laget på PostgREST).
3. Importerer `Button` fra `@/components/ui/button` og rendrer det sammen med begge statusene, slik at både UI- og DB-verifikasjon skjer i samme render.

`app/page.tsx` rørres ikke — den eies av første feature-mandat.

**Hvorfor:**
- Egen rute holder `app/page.tsx` rent slik mandatet beskriver implisitt (smoke skal ikke definere forsiden), og gjør smoke-testen trivielt slettbar når den ikke lenger trengs (`rm -r app/smoke/`).
- Server component gir umiddelbar feedback i nettleser ved `npm run dev` — ett av suksesskriteriene.
- PostgREST-kall mot ukjent tabell er den enkleste måten å bevise at *anon-nøkkelen faktisk virker mot dette prosjektets PostgREST-endepunkt*. Hvis nøkkelen er feil får vi 401; hvis URL-en er feil får vi DNS/timeout; hvis tabellen ikke finnes — som er forventet — får vi en spesifikk PostgREST-feil som beviser at requesten gikk gjennom auth.

**Alternativer vurdert:**
- `app/page.tsx` som smoke-rute: Bryter med "smoke skal være slettbar uten å påvirke routing". Forsiden eies av første feature. Avvist.
- `client.auth.getUser()` som Supabase-verifikasjon: **Avvist eksplisitt** — `auth.getUser()` returnerer `{ data: { user: null }, error: null }` selv ved ugyldig anon-nøkkel hvis det ikke finnes en aktiv session. Det er en falsk-positiv som ikke verifiserer noe meningsfullt om at klienten faktisk når Supabase.
- Route handler (`app/api/smoke/route.ts`): Krever `curl` eller manuell GET-request for å trigge — ingen umiddelbar feedback fra `npm run dev`. Avvist for nå; kan vurderes hvis vi senere vil ha en CI-vennlig smoke som returnerer JSON.
- Standalone Node-script (`tsx scripts/smoke.ts`): Krever ekstra `tsx`-dep eller egen tsconfig, og verifiserer ikke Next.js runtime.
- Vitest-basert test: Premature — vi har ingen testrunner satt opp og mandatet vil ikke ha det.

### D7. `drizzle.config.ts` bruker `dotenv/config` for å laste `.env.local`, og leser `DIRECT_URL`

**Valg:** `drizzle.config.ts` importerer `dotenv/config` med `{ path: '.env.local' }` slik at `drizzle-kit` CLI kan lese env-variabler uten å være kjørt gjennom Next.js. Den leser `DIRECT_URL` (ikke `DATABASE_URL`) — se D1b. Schema-path peker på `./src/db/schema.ts`, out på `./drizzle/`. Filen kaster eksplisitt hvis `DIRECT_URL` mangler.

**Hvorfor:** `drizzle-kit` kjører i bart Node — det leser ikke `.env.local` automatisk slik Next.js gjør. Dette er en kjent fotpistol og må håndteres eksplisitt. Å lese `DIRECT_URL` (ikke `DATABASE_URL`) gjør det fysisk umulig å koble drizzle-kit mot transaction pooler ved et uhell.

**Anmerkning:** `db:generate` (uten DB-kall) verifisert lokalt. `db:push` (krever live DB) er wired og henter `DIRECT_URL`, men kunne *ikke* fullføres fra denne dev-maskinen — Supavisor returnerer "tenant/user postgres.<ref> not found" på port 5432 (session pooler er ikke provisjonert for dette prosjektet), og direktekoblingen `db.<ref>.supabase.co:5432` er IPv6-only og resolver ikke. Verifiseres i CI eller fra IPv6-enabled miljø ved første schema-mandat. Den ekte runtime-tilkoblingen er fortsatt bevist av Drizzle `SELECT 1` i smoke-ruten mot transaction pooler.

## Risks / Trade-offs

- **[Risk] `prepare: false` glemmes ved fremtidige Drizzle-instanser** → Mitigation: Eksporter én sentral `db` fra `src/db/index.ts`. Ingen andre filer instansierer `postgres()`-klient direkte. Dokumenter i topp-kommentar at pooler-mode krever flagget.
- **[Risk] Styringsregelen brytes når en utvikler kjapt skriver `supabase.from('users').select()` i en feature** → Mitigation: Topp-kommentaren i `src/lib/supabase/server.ts` og `client.ts` gjør regelen synlig der den vil bli ignorert. Smoke-testen er bevisst det eneste stedet i kodebasen som bryter regelen, og den er kommentert som unntak.
- **[Risk] PostgREST kan returnere uventede feilkoder ved fremtidig RLS-konfig, slik at smoke-testen feiltolker "ok" som "fail"** → Mitigation: Smoke-logikken matcher bevisst på 401/network-feil for fail-tilfellet; alt annet, inkludert tabell-ikke-funnet, behandles som ok. Hvis RLS senere blokkerer anon på schema-introspeksjon må smoke-strategien justeres — dokumentert som open question.
- **[Risk] `@supabase/ssr` kan introdusere cookie-handler-feil ved fremtidig auth-integrasjon** → Mitigation: Vi følger Supabase' offisielle Next.js-guide eksakt; cookie-handlere er minimal og dokumentert. Auth-mandatet kan eventuelt utvide.
- **[Risk] shadcn `init` overskriver `globals.css` eller `tsconfig.json` på uventet måte** → Mitigation: `git status` sjekkes før og etter init; alle endringer committes som egen commit slik at de er reverterbare. (shadcn er en CLI-runner, ikke en kjørende dependency — komponentene er frosset ved å være innsjekket i repoet, så versjonsdrift av selve `shadcn` påvirker ikke produksjonsbuild.)
- **[Risk] Smoke-ruten lekker DB-feilmeldinger til offentlig URL hvis dev-build deployes** → Mitigation: Akseptert trade-off i greenfield. `app/smoke/page.tsx` er bevisst slettbar; første deploy-mandat skal fjerne den eller gate den bak et flag/auth.

## Migration Plan

Greenfield — ingen migrering. Roll-back er `git revert` av implementeringscommit, eller `rm -r app/smoke/` for å fjerne kun smoke-ruten uten å påvirke resten. Ingen data å håndtere.

## Open Questions

- Når smoke-ruten ikke lenger trengs (etter at første ekte feature er på plass og verifisert i prod), skal den slettes eller gates? → Forslag: slette i samme PR som auth-mandatet lander, fordi auth-flowen blir den nye "lever fundamentet?"-indikatoren.
- Hvis vi senere setter RLS på `pg_catalog`-introspeksjon, vil smoke-testens PostgREST-strategi måtte endres. Skal vi heller bygge en dedikert `_smoke_health`-view nå? → Avvist for nå; PostgREST `?select=...` mot ukjent tabell holder for greenfield.
- Trenger vi `drizzle-kit studio` script nå? → Avvist for nå; legges til ved første schema-mandat.
