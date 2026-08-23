## MODIFIED Requirements

### Requirement: Supabase-klienter for server og browser via @supabase/ssr

Prosjektet SHALL eksponere to separate Supabase-klient-fabrikker: én for server (RSC, server actions, route handlers) og én for browser (client components). Begge MUST bruke `@supabase/ssr` og lese `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Server-klienten MUST bruke Next.js `cookies()`-API for cookie-håndtering. Browser-klienten MUST bruke `createBrowserClient`.

Begge fabrikkene MUST sende `cookieOptions.domain` fra den felles helperen `authCookieDomain()` (`src/lib/supabase/cookie-domain.ts`), som returnerer `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` eller `undefined`. Ingen av fabrikkene hardkoder et cookie-domene (se `auth`-capability for env-betingelsen).

I tillegg SHALL fundamentet inkludere `src/middleware.ts` som delegerer til `updateSession` i `src/lib/supabase/middleware.ts` (Supabase' token-refresh-mønster med samme cookie-domene-helper). Middleware-matcheren ekskluderer statiske assets.

#### Scenario: Server-klient instansieres i en server component
- **WHEN** en server component kaller `createClient()` fra `src/lib/supabase/server.ts`
- **THEN** funksjonen returnerer en Supabase-klient som er bundet til request-scoped cookies uten å kaste

#### Scenario: Browser-klient instansieres i en client component
- **WHEN** en client component kaller `createClient()` fra `src/lib/supabase/client.ts`
- **THEN** funksjonen returnerer en `SupabaseClient`-instans uten å kaste

#### Scenario: Manglende Supabase-env feiler høylytt
- **WHEN** `NEXT_PUBLIC_SUPABASE_URL` eller `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` mangler ved klient-instansiering
- **THEN** klient-fabrikken kaster en eksplisitt feil som navngir variabelen som mangler

#### Scenario: Cookie-domene kommer fra felles helper
- **WHEN** `src/lib/supabase/server.ts`, `client.ts` og `middleware.ts` inspiseres
- **THEN** sender alle tre `cookieOptions.domain` fra `authCookieDomain()`, og ingen inneholder en hardkodet domene-streng

#### Scenario: Middleware er wired i fundamentet
- **WHEN** `src/middleware.ts` inspiseres
- **THEN** kaller den `updateSession` fra `src/lib/supabase/middleware.ts` og har en matcher som ekskluderer `_next/static`, `_next/image` og statiske filendelser
