---
project: geish.no v2
feature: e3-auth
date: 2026-05-22
updated: 2026-05-22
type: brownfield
status: ready
---

# Mandat: E3 — Auth (Supabase magic link)

## Mål

Etablere brukeridentitet for geish.no v2: passordløs innlogging via Supabase Auth (magic link), sesjon som persisterer på tvers av sidelastinger, og en cookie satt på `.geish.no` så identiteten følger med til fremtidige subdomener uten ekstra auth-provider. Dette er første sikkerhetskritiske epic og forutsetningen for alt sosialt (E4). E3 leverer *identitet*, ikke *data* — DB-tabeller og RLS hører til E4.

## Scope

### Inn

- Supabase Auth med **magic link** (OTP via e-post) som eneste innloggingsmetode.
- `@supabase/ssr`-oppsett for Next.js App Router: server-klient, browser-klient, cookie-basert sesjon, token-refresh i middleware.
- **Cookie-domene satt til `.geish.no` i prod**, env-betinget så localhost og Vercel-preview fortsatt funker (se Constraints — dette er fotpistolen).
- Innloggingsflyt: en `/logg-inn`-rute der bruker skriver e-post → Supabase sender magic link → callback-rute bytter koden mot en sesjon → redirect inn.
- Logg ut-handling som tømmer sesjonen.
- En **beskyttet `/konto`-rute** som viser "logget inn som <e-post>" og redirecter til `/logg-inn` hvis utlogget. Dette er review-/verifiseringsflaten for epicen (samme rolle som styleguide hadde i E1).
- **Tilgangsmodell som mønster, ikke som mur:** guarden beskytter KUN `/konto` (og senere eksplisitt opt-in-ruter). Resten av siten forblir offentlig lesbar. "Logget inn?"-tilstanden eksponeres til UI så skrive-knapper kan vises/skjules senere — men E3 bygger ingen skrive-funksjoner selv.
- Innlogget tilstand synlig i layout (f.eks. "logg inn" ↔ "konto / logg ut" i nav).

### Ut

- **Profiles-tabell / brukerdata i Postgres** — utsatt til E4. E3 bruker kun `auth.users`. Ingen Drizzle-tabeller, ingen migrasjoner, ingen RLS i denne epicen.
- **OAuth (Google / GitHub / Meta)** — egen, additiv backlog-jobb senere. Magic link alene i E3.
- **Invitasjoner / tilgangsnivåer / roller** — hører til E4 (per-tråd-gating) og senere. E3 kjenner bare "innlogget: ja/nei".
- **Skrive-funksjoner, Stua, gjestebok** — E4.
- **Subdomene-apper (bake/hund/reise)** — utenfor v2-scope. `.geish.no`-cookien settes nå som forberedelse, men ingen subdomene-app bygges eller testes mot her.
- **Spin-out-migrering** (eksportere brukere til utskilt site) — fremtidig ops-oppgave, bygges ikke nå.
- **Rate limiting / custom SMTP / e-postmaler** — Supabase-default holder i E3; tilpasning senere ved behov.

## Delta-type

**Type:** brownfield

Berører E0-fundamentet: legger auth-laget oppå eksisterende `@supabase/ssr`-wiring fra project-init. Legger til middleware (eller utvider eksisterende), nye ruter (`/logg-inn`, `/konto`, auth-callback), og innlogget-tilstand i layout/nav. Rører ikke design-systemet (E1) utover å bruke eksisterende komponenter/tokens for innloggings-UI. Rører ikke blogg (E2).

## Suksesskriterier

- [ ] Bruker kan skrive e-post på `/logg-inn`, motta magic link, klikke den og bli logget inn.
- [ ] Sesjonen overlever full sidelasting (refresh) og navigasjon — token refreshes i middleware.
- [ ] `/konto` viser innlogget e-post når innlogget, og redirecter til `/logg-inn` når utlogget.
- [ ] Logg ut tømmer sesjonen; `/konto` blir utilgjengelig etterpå.
- [ ] Offentlig innhold (forside, /blogg, /manifest) er fortsatt tilgjengelig UTEN innlogging — ingen global auth-mur.
- [ ] Cookie settes på `.geish.no` i prod (verifiserbart i nettleserens cookie-inspektør på deployet site), og auth funker fortsatt lokalt på localhost.
- [ ] Nav reflekterer innlogget tilstand (logg inn ↔ konto / logg ut).

## Constraints

- **Cookie-domene-fotpistolen:** `.geish.no` er ugyldig på `localhost` og på Vercel preview-domener (`*.vercel.app`). Cookie-domenet MÅ være env-betinget — undefined / host-default i dev og preview, `.geish.no` kun i prod. Dette er den enkleste tingen å bomme på i hele epicen og må fanges eksplisitt i design.
- `@supabase/ssr` (ikke det deprecte `auth-helpers`). Følg Supabase' offisielle Next.js App Router-mønster for 2026.
- Magic link-callback håndteres som en server-rute som bytter `code` mot sesjon (PKCE-flyt), ikke client-side.
- Innloggings-UI bruker eksisterende zine-designsystem (CSS-vars + CSS Modules), ikke nye UI-avhengigheter.

## Kontekst for Code

- Stack: Next.js (App Router, `src/`-struktur, `@/`-alias), Supabase (prosjekt i Stockholm / eu-north-1), `@supabase/ssr` allerede installert i E0.
- Supabase Auth er allerede valgt som auth-leverandør (se overview decisions-logg).
- Designsystem: "Cut & Paste Zine" (CSS-vars + CSS Modules). Tailwind / shadcn er fjernet — ikke gjeninnfør.
- Filosofi bak tilgangsmodellen: siden er en zine man deler. Innlogging er for å *bidra*, ikke for å *titte*. Default = offentlig lesbart; innlogging låser opp skriving (senere epics).
- Spin-out-kontekst (påvirker IKKE koden nå, men forklarer hvorfor magic link): subdomene-prosjekter kan på sikt skilles ut til egne nettsteder med egen auth. Magic link = bruker er bare en verifisert e-post, ingen tredjepart bundet inn → smertefri eksport senere. Ikke bygg noe for dette nå; bare ikke koble identiteten til geish.no på en måte som blokkerer fremtidig eksport.

## Åpne spørsmål

- **Rute-navngiving og callback-plassering:** `/logg-inn` + `/auth/callback` er forslag — Code velger endelig struktur etter Supabase' App Router-konvensjon.
- **Middleware vs. per-layout guard for `/konto`:** Code velger enkleste robuste mønster for én beskyttet rute.
- **Hvordan eksponere innlogget-tilstand til klient-UI** (server component-prop, context eller hook) for fremtidige vis/skjul-skrive-knapper — Code avgjør, men noter valget i design så E4 arver det.
- **"Lenke sendt"-tilstand på `/logg-inn`:** standard Supabase-oppførsel holder; Code bekrefter UX for kvittering etter at lenke er sendt.
