## Why

E0 wiret Supabase (`@supabase/ssr`-klientfabrikker i `src/lib/supabase/`, verifisert via smoke-ruten), men ingenting bruker auth ennå. Siten er en offentlig zine uten identitet — det finnes ingen måte å logge inn, ingen sesjon, ingen "hvem er du". E4 (Stua, gjestebok, skrive-funksjoner) forutsetter en verifisert identitet å knytte bidrag til.

E3 leverer *identitet*, ikke *data*: passordløs innlogging via Supabase Auth magic link (OTP på e-post), cookie-basert sesjon som overlever sidelastinger og refreshes i middleware, og en beskyttet `/konto`-rute som verifiseringsflate (samme rolle som styleguide hadde i E1). Ingen DB-tabeller, ingen Drizzle, ingen RLS — det er E4.

**Tilgangsmodellen er et mønster, ikke en mur:** siden er en zine man deler. Innlogging er for å *bidra*, ikke for å *titte*. Guarden beskytter KUN `/konto`; resten av siten forblir offentlig lesbar. Innlogget-tilstanden eksponeres til UI så E4 kan vise/skjule skrive-knapper — men E3 bygger ingen skrive-funksjoner selv.

Cookien settes på `.geish.no` i prod som forberedelse til fremtidige subdomener — env-betinget, siden `.geish.no` er ugyldig på localhost og Vercel-preview (fotpistolen, se design D3).

## What Changes

- **Magic link som eneste innloggingsmetode.** `supabase.auth.signInWithOtp({ email })` → Supabase sender e-post med lenke → callback bytter kode mot sesjon (PKCE). Ingen passord, ingen OAuth.
- **`@supabase/ssr` App Router-mønster fullføres:**
  - Eksisterende `src/lib/supabase/server.ts` + `client.ts` utvides med env-betinget `cookieOptions.domain` (se under).
  - **Ny `src/middleware.ts`** (Supabase' `updateSession`-mønster): refresher auth-token på hver matchet request og synker cookies mellom request og response. Matcher ekskluderer statiske assets. Middleware guarder IKKE ruter — den refresher kun (se design D2).
- **Cookie-domene, env-betinget (fotpistolen):** ny helper `src/lib/supabase/cookie-domain.ts` leser `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`. Variabelen settes til `.geish.no` KUN i Vercel prod-env; ellers er den usatt → `undefined` → host-default cookie. Alle tre klient-stedene (server, browser, middleware) bruker helperen (design D3).
- **`/logg-inn`** (`src/app/logg-inn/page.tsx`): e-postskjema i zine-stil (CSS-vars + CSS Modules). Client component med to tilstander: skjema → "lenke sendt"-kvittering med mottaker-e-post og "bruk en annen adresse"-mulighet. Viser feilmelding ved retur fra mislykket callback (`?feil=`-param). Allerede-innloggede redirectes til `/konto`.
- **`/auth/callback`** (`src/app/auth/callback/route.ts`): server route handler som bytter `code` mot sesjon via `exchangeCodeForSession` (PKCE), og redirecter til `next`-param (default `/konto`). Feil → redirect til `/logg-inn?feil=<kode>`.
- **`/auth/logg-ut`** (`src/app/auth/logg-ut/route.ts`): POST-route som kaller `signOut()` (tømmer sesjonscookies server-side) og redirecter til `/`. Brukes som `<form method="post">`-target fra både nav og `/konto`.
- **`/konto`** (`src/app/konto/page.tsx`): beskyttet server component. `auth.getUser()` — utlogget → `redirect("/logg-inn")`; innlogget → viser "logget inn som <e-post>" + logg ut-knapp. Dette er epicens review-flate.
- **Innlogget tilstand i nav:** ny client component `src/components/shared/AuthNav/` montert i rot-layouten (`src/app/layout.tsx`) — synlig på alle sider uten å gjøre statiske ruter dynamiske. Viser "LOGG INN" (utlogget) ↔ "KONTO / LOGG UT" (innlogget) i mono/zine-stil. Bruker browser-klienten + `onAuthStateChange` (design D4/D5).
- **Innlogget-tilstand som gjenbrukbart mønster for E4:** server-side = `createClient()` fra `server.ts` + `auth.getUser()`; client-side = ny hook `src/lib/auth/use-user.ts` (`useUser()`). AuthNav er første konsument av hooken (design D4).

## Capabilities

### New Capabilities
- `auth`: Passordløs innlogging via Supabase magic link — `/logg-inn`-flyt med lenke-sendt-kvittering, PKCE-callback, logg ut, beskyttet `/konto`, token-refresh i middleware, env-betinget `.geish.no`-cookie i prod, innlogget-tilstand i nav og som gjenbrukbart mønster (server + client) for E4.

### Modified Capabilities
- `project-foundation`: Supabase-klientfabrikkene (server + browser) utvides med env-betinget `cookieOptions.domain` fra felles helper. Ny `src/middleware.ts` med Supabase token-refresh inngår i fundamentet.

## Impact

- **Avhengigheter:** ingen nye npm-pakker. `@supabase/ssr` (^0.10) + `@supabase/supabase-js` er installert siden E0. Ingen nye UI-avhengigheter (mandat-constraint).
- **Supabase-konfig (utenfor repoet, dokumenteres i tasks):**
  - Redirect URLs: `http://localhost:3000/auth/callback`, `https://geish.no/auth/callback`, Vercel-preview-wildcard.
  - Site URL: `https://geish.no`.
  - E-postmal/SMTP: Supabase-default (mandat: tilpasning senere).
- **Env-vars (nye):** `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.geish.no` settes KUN i Vercel Production-env. Ikke i `.env.local`, ikke i preview.
- **Filsystem (nytt):**
  - `src/middleware.ts` (token-refresh, `updateSession`-mønster).
  - `src/lib/supabase/middleware.ts` (updateSession-implementasjonen middleware delegerer til).
  - `src/lib/supabase/cookie-domain.ts` (env-betinget domene-helper).
  - `src/lib/auth/use-user.ts` (`useUser()`-hook for client components).
  - `src/app/logg-inn/page.tsx` + `page.module.css` + `LoginForm` (client component).
  - `src/app/auth/callback/route.ts`.
  - `src/app/auth/logg-ut/route.ts`.
  - `src/app/konto/page.tsx` + `page.module.css`.
  - `src/components/shared/AuthNav/index.tsx` + `.module.css`.
- **Filsystem (modifisert):**
  - `src/lib/supabase/server.ts` + `client.ts` (cookieOptions med domene-helper).
  - `src/app/layout.tsx` (monterer `<AuthNav />`).
  - `src/components/shared/index.ts` (eksporterer AuthNav).
  - Evt. `src/content/locales/no.ts` (auth-copy: logg inn/konto/logg ut-strenger) — se design D6.
- **Røres ikke:** blogg (E2), manifest, forside-seksjonene, designsystem-tokens, Drizzle/`src/db/`, smoke-ruten (kan evt. få en auth-linje, se tasks), styleguide.
- **Eksterne systemer:** Supabase Auth (prosjekt i eu-north-1) — sender e-post, holder `auth.users`. Ingen DB-skjema-endringer fra oss.
- **Ut av scope:**
  - Profiles-tabell / Drizzle / migrasjoner / RLS — E4.
  - OAuth (Google/GitHub/Meta) — additiv backlog senere.
  - Invitasjoner, roller, tilgangsnivåer — E4+. E3 kjenner bare "innlogget: ja/nei".
  - Skrive-funksjoner, Stua, gjestebok — E4.
  - Subdomene-apper — utenfor v2. Cookien forberedes, ingenting bygges/testes mot subdomener.
  - Spin-out-migrering (brukereksport) — fremtidig ops.
  - Rate limiting, custom SMTP, e-postmaler — Supabase-default holder.
