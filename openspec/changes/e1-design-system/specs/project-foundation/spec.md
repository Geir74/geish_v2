## REMOVED Requirements

### Requirement: shadcn/ui initialisert med Tailwind v4

**Reason**: E1 erstatter Tailwind/shadcn-stylinglaget med "Cut & Paste Zine"-designsystemet. shadcn/ui og Tailwind v4 var en E0-plassholder for å bevise at UI-laget var wired — det er nå overflødig.

**Migration**: Komponenter som tidligere brukte `<Button>` fra `src/components/ui/button.tsx` skrives om til å bruke vanlige HTML-elementer (eller, der det er meningsfullt, nye komponenter fra det nye `design-system`-capability). `src/components/ui/`, `components.json`, `src/lib/utils.ts`, `postcss.config.mjs`, og Tailwind-deps (`tailwindcss`, `@tailwindcss/postcss`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `@base-ui/react`) slettes fra repo og `package.json`. Tailwind-direktiver fjernes fra `src/app/globals.css`.

## MODIFIED Requirements

### Requirement: Mappestruktur for db og supabase

Prosjektet SHALL etablere mappestrukturen:
- `src/db/index.ts` — Drizzle-instans og postgres-klient
- `src/db/schema.ts` — placeholder for fremtidige tabeller
- `src/lib/supabase/server.ts` — server-side Supabase-klient
- `src/lib/supabase/client.ts` — browser-side Supabase-klient
- `app/smoke/page.tsx` — slettbar smoke-rute

DB-laget og Supabase-klient-laget MUST være separate (ingen kryssimporter utenfor smoke-ruten). `src/components/ui/` (shadcn) eksisterer ikke etter E1.

#### Scenario: Mappestruktur eksisterer
- **WHEN** repo er initialisert
- **THEN** alle filene over eksisterer med ikke-tomt innhold

#### Scenario: src/components/ui finnes ikke
- **WHEN** repo er på master etter E1-merge
- **THEN** `src/components/ui/` eksisterer ikke, og det finnes ingen `shadcn`-relaterte filer (`components.json`) på repo-rot

### Requirement: Dev-server starter rent, forsiden og smoke-ruten laster

Prosjektet SHALL kunne startes med `npm run dev` uten kompileringsfeil eller runtime-feil i den initielle render-syklusen. Forsiden (`/`) SHALL vise en minimal placeholder med "geish v2"-overskrift og en henvisning til `/styleguide`. Smoke-ruten (`/smoke`) SHALL laste 200 og vise begge "wired"-statuser. **Ingen shadcn-komponenter brukes**; den faktiske forsiden bygges i `e1-forside`-mandatet.

#### Scenario: forsiden laster
- **WHEN** `npm run dev` kjøres og HTTP-request sendes til `/`
- **THEN** ruten returnerer 200 og responsen inneholder "geish v2" og en lenke/henvisning til `/styleguide`

#### Scenario: smoke-ruten laster
- **WHEN** `npm run dev` kjøres med gyldig `.env.local` og HTTP-request sendes til `/smoke`
- **THEN** ruten returnerer 200 og responsen viser `dbStatus = "wired (live verification deferred to first schema mandate)"` og `supabaseStatus = "wired (live verification deferred to first schema mandate)"`. Ingen shadcn-`<Button>` rendres.

### Requirement: Smoke-ruten verifiserer at Supabase-klient er wired

Smoke-ruten SHALL verifisere at Supabase server-klient kan importeres og instansieres uten å kaste — env-vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) er lest, cookies-API er kalt, og klient-konstruktøren returnerer en gyldig instans.

Live PostgREST-verifisering er **deferred til første schema-mandat**. `auth.getUser()` SHALL fortsatt ikke brukes som helsesjekk når live-verifisering implementeres (returnerer falsk-positiv ved tom session). Smoke-ruten importerer ikke shadcn-komponenter etter E1.

#### Scenario: Supabase-klient instansieres uten feil
- **WHEN** `/smoke` rendres med korrekt `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` i `.env.local`
- **THEN** server-klienten instansieres uten å kaste og `supabaseStatus` viser `"wired (live verification deferred to first schema mandate)"`

#### Scenario: Manglende env feiler høylytt
- **WHEN** `/smoke` rendres uten `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **THEN** klient-fabrikken kaster en eksplisitt feil som navngir variabelen, og smoke-ruten viser `supabaseStatus = "fail: <melding>"` (ikke `"wired"`)

#### Scenario: Ingen shadcn-import
- **WHEN** `src/app/smoke/page.tsx` leses
- **THEN** filen importerer ingen ting fra `@/components/ui/` (mappen finnes ikke) og ingen Tailwind-utility-klasser brukes
