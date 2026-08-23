## ADDED Requirements

### Requirement: Magic link er eneste innloggingsmetode

Innlogging SHALL skje utelukkende via Supabase Auth magic link (OTP på e-post): brukeren oppgir e-postadresse, `signInWithOtp` sender en lenke, og lenken byttes mot en sesjon. Det SHALL ikke finnes passordfelt, OAuth-knapper eller andre innloggingsmetoder. `shouldCreateUser` står på default — innlogging og registrering er samme flyt ("innlogget: ja/nei", ingen roller).

#### Scenario: e-post gir magic link
- **WHEN** en bruker skriver en gyldig e-postadresse på `/logg-inn` og sender skjemaet
- **THEN** kalles `supabase.auth.signInWithOtp` med adressen og `emailRedirectTo` mot `/auth/callback`, og Supabase sender en magic link til adressen

#### Scenario: ingen andre metoder eksponeres
- **WHEN** `/logg-inn` inspiseres
- **THEN** finnes ingen passordfelt og ingen OAuth-provider-knapper

### Requirement: Innloggingsside /logg-inn med lenke-sendt-kvittering

`src/app/logg-inn/page.tsx` SHALL rendre et e-postskjema i zine-designsystemet (CSS-vars + CSS Modules, ingen nye UI-avhengigheter). Etter vellykket `signInWithOtp` SHALL skjemaet erstattes av en kvitteringstilstand som viser mottakeradressen og en mulighet for å bruke en annen adresse. Feil fra callbacken (`?feil=`-param) eller fra utsendingen SHALL vises som feilmelding med mulighet til å prøve igjen. En allerede innlogget bruker som besøker `/logg-inn` SHALL redirectes til `/konto`. All bruker-synlig copy SHALL hentes fra `t()` (`auth`-slice i `src/content/locales/no.ts`).

#### Scenario: kvittering etter sending
- **WHEN** skjemaet sendes med `geir@example.com` og `signInWithOtp` lykkes
- **THEN** vises en "lenke sendt"-kvittering som inkluderer `geir@example.com`, og skjemaet er ikke lenger synlig

#### Scenario: feil fra callback vises
- **WHEN** brukeren lander på `/logg-inn?feil=lenke` (utløpt/ugyldig magic link)
- **THEN** vises en feilmelding og e-postskjemaet slik at brukeren kan be om ny lenke

#### Scenario: innlogget bruker sendes videre
- **WHEN** en innlogget bruker navigerer til `/logg-inn`
- **THEN** redirectes hen til `/konto`

### Requirement: PKCE-callback som server-rute

`src/app/auth/callback/route.ts` SHALL være en GET route handler som bytter `code`-parameteren mot en sesjon via `supabase.auth.exchangeCodeForSession` (server-side PKCE — ikke client-side). Ved suksess SHALL den redirecte til `next`-parameteren; `next` MUST valideres til kun interne stier (starter med `/`, ikke `//`), med default `/konto`. Ved manglende `code` eller feilet exchange SHALL den redirecte til `/logg-inn?feil=lenke`. Redirects MUST bygges på requestens `origin` (ingen hardkodede hoster).

#### Scenario: gyldig kode gir sesjon
- **WHEN** brukeren klikker magic-linken og lander på `/auth/callback?code=<gyldig>`
- **THEN** byttes koden mot en sesjon (cookies settes) og brukeren redirectes til `/konto`

#### Scenario: ugyldig eller utløpt kode
- **WHEN** `/auth/callback` treffes med utløpt/ugyldig kode
- **THEN** redirectes brukeren til `/logg-inn?feil=lenke` uten sesjon

#### Scenario: open redirect avvises
- **WHEN** `/auth/callback?code=<gyldig>&next=https://ondsinnet.no` treffes
- **THEN** ignoreres den eksterne `next`-verdien og brukeren redirectes til `/konto`

### Requirement: Logg ut som POST-endepunkt

`src/app/auth/logg-ut/route.ts` SHALL være en POST route handler som kaller `supabase.auth.signOut()` (tømmer sesjonscookies server-side) og redirecter til `/`. Logg ut SHALL trigges via `<form method="post">` — ikke GET-lenke — så prefetch/crawlere ikke kan logge brukeren ut.

#### Scenario: logg ut tømmer sesjonen
- **WHEN** en innlogget bruker poster til `/auth/logg-ut`
- **THEN** tømmes sesjonscookies, brukeren redirectes til `/`, og et påfølgende besøk på `/konto` redirecter til `/logg-inn`

### Requirement: Beskyttet /konto-rute som review-flate

`src/app/konto/page.tsx` SHALL være en server component som kaller `supabase.auth.getUser()`. Er brukeren utlogget SHALL siden `redirect("/logg-inn")`. Er brukeren innlogget SHALL siden vise "logget inn som <e-post>" og en logg ut-knapp (form mot `/auth/logg-ut`). Guarden SHALL ligge i selve pagen (ikke i middleware, ikke i layout). `/konto` er den ENESTE beskyttede ruten i E3.

#### Scenario: utlogget redirectes
- **WHEN** en utlogget bruker navigerer til `/konto`
- **THEN** redirectes hen til `/logg-inn`

#### Scenario: innlogget ser sin e-post
- **WHEN** en innlogget bruker navigerer til `/konto`
- **THEN** vises "logget inn som <brukerens e-post>" og en logg ut-knapp

### Requirement: Token-refresh i middleware, ingen rute-guard der

`src/middleware.ts` SHALL implementere Supabase' `updateSession`-mønster: lese auth-cookies fra requesten, refreshe tokenet ved behov via `auth.getUser()`, og synke oppdaterte cookies til både request og response. Matcheren SHALL ekskludere `_next/static`, `_next/image`, favicon og statiske filendelser. Middleware SHALL IKKE redirecte eller håndheve tilgang — sesjonen refreshes, guards bor i pages/handlers.

#### Scenario: sesjonen overlever refresh og navigasjon
- **WHEN** en innlogget bruker laster siden på nytt eller navigerer etter at access-tokenet er utløpt
- **THEN** refresher middleware tokenet transparent og brukeren forblir innlogget

#### Scenario: middleware redirecter aldri
- **WHEN** en utlogget bruker requester en hvilken som helst rute
- **THEN** returnerer middleware responsen uendret (ingen redirect) — eventuell guard skjer i pagen

### Requirement: Offentlig innhold forblir offentlig og statisk

Forsiden, `/blogg`, `/blogg/[slug]` og `/manifest` SHALL være tilgjengelige uten innlogging — ingen global auth-mur. Disse rutene SHALL forbli statisk rendret (ingen server-side cookie-lesing introduseres i deres tre); innlogget-tilstand på disse sidene løses client-side (AuthNav).

#### Scenario: offentlig innhold uten sesjon
- **WHEN** en bruker uten sesjonscookies besøker `/`, `/blogg` og `/manifest`
- **THEN** returneres 200 med fullt innhold — ingen redirect til `/logg-inn`

#### Scenario: statisk rendering bevart
- **WHEN** `npm run build` kjøres
- **THEN** rapporteres forside-, blogg- og manifest-rutene fortsatt som statiske (`○`/SSG), mens `/konto` er dynamisk

### Requirement: Env-betinget cookie-domene .geish.no i prod

Auth-cookies SHALL settes med `Domain=.geish.no` KUN i produksjon, styrt av env-varen `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` som settes utelukkende i Vercel Production-environment. I dev (localhost) og på Vercel-preview SHALL variabelen være usatt og cookie-domenet `undefined` (host-default). Verdien SHALL leses gjennom én felles helper (`src/lib/supabase/cookie-domain.ts`) som brukes av server-klienten, browser-klienten og middleware-klienten — ingen av de tre stedene hardkoder domenet.

#### Scenario: prod-cookie på .geish.no
- **WHEN** en bruker logger inn på deployet prod-site og inspiserer cookies i nettleseren
- **THEN** har `sb-*`-auth-cookiene `Domain=.geish.no`

#### Scenario: localhost får host-default
- **WHEN** en bruker logger inn på `http://localhost:3000` (uten env-varen satt)
- **THEN** settes auth-cookies uten eksplisitt Domain-attributt, og hele login-flyten fungerer

#### Scenario: én kilde for domenet
- **WHEN** `grep -rn "geish.no" src/lib/supabase/ src/middleware.ts` kjøres
- **THEN** finnes ingen hardkodet `.geish.no`-streng — domenet kommer kun fra env-varen via helperen

### Requirement: Innlogget tilstand i nav via AuthNav

En delt client component `src/components/shared/AuthNav/` SHALL monteres i rot-layouten (`src/app/layout.tsx`) og vises på alle sider. Utlogget SHALL den vise en "logg inn"-lenke til `/logg-inn`; innlogget SHALL den vise en "konto"-lenke til `/konto` og en logg ut-knapp (form mot `/auth/logg-ut`). Den SHALL bruke browser-klienten via `useUser()`-hooken (ingen server-side cookie-lesing i layouten). Mens tilstanden lastes SHALL den rendre en tom placeholder med reservert plass — ikke feil tilstand, ikke layout-shift. Stil: zine-designsystemet (CSS-vars + CSS Modules), ingen nye avhengigheter.

#### Scenario: utlogget nav
- **WHEN** en utlogget bruker laster en hvilken som helst side
- **THEN** viser AuthNav en lenke til `/logg-inn`

#### Scenario: innlogget nav
- **WHEN** en innlogget bruker laster en side
- **THEN** viser AuthNav en lenke til `/konto` og en logg ut-knapp — ikke "logg inn"

#### Scenario: nav oppdateres ved utlogging
- **WHEN** brukeren logger ut
- **THEN** viser AuthNav "logg inn"-tilstanden ved neste sidelasting (eller via `onAuthStateChange` uten reload)

### Requirement: Innlogget-tilstand som gjenbrukbart mønster for E4

Prosjektet SHALL eksponere innlogget-tilstand gjennom to dokumenterte mekanismer som E4 arver:

- **Server-side (autoritativ):** `createClient()` fra `@/lib/supabase/server` + `auth.getUser()` — brukes for guards og all tilgangskontroll.
- **Client-side (kosmetisk):** `useUser()`-hook i `src/lib/auth/use-user.ts` — `getUser()` ved mount + `onAuthStateChange`-subscription, returnerer `{ user, loading }`. Brukes KUN til å vise/skjule UI (f.eks. skrive-knapper i E4), aldri som tilgangskontroll.

#### Scenario: useUser gir user og loading
- **WHEN** en client component kaller `useUser()` mens en bruker er innlogget
- **THEN** returneres `{ user }` med brukerens data etter lasting, og `loading` går fra `true` til `false`

#### Scenario: hook reagerer på auth-endringer
- **WHEN** sesjonen endres (innlogging/utlogging) mens en komponent med `useUser()` er montert
- **THEN** oppdateres `user`-verdien via `onAuthStateChange` uten sidelasting
