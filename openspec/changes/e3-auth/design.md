## Context

E0 la Supabase-fundamentet: `@supabase/ssr`-klientfabrikker (`src/lib/supabase/server.ts` + `client.ts`) som leser `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, verifisert via smoke-ruten. Ingen middleware finnes, ingen ruter bruker auth, og det finnes **ingen global nav** — hver side rendrer sin egen brødsmule-strip (`.crumb` i `/blogg`, `/manifest`), og rot-layouten (`src/app/layout.tsx`) inneholder kun fonter + `<body>{children}</body>`.

**Autoritativ kilde:** Supabase' offisielle Next.js App Router-guide for `@supabase/ssr` (2026): server-klient, browser-klient, `updateSession`-middleware, PKCE-callback som route handler. Det deprecte `auth-helpers`-mønsteret brukes ikke.

**Låst av mandatet:**
- Magic link (OTP e-post) som eneste metode. Ingen OAuth, ingen passord.
- Callback som *server-rute* som bytter code mot sesjon (PKCE) — ikke client-side.
- Cookie-domene `.geish.no` KUN i prod, env-betinget (fotpistolen).
- Guard KUN på `/konto`. Resten av siten forblir offentlig.
- Zine-designsystem (CSS-vars + CSS Modules), ingen nye UI-avhengigheter.
- Ingen DB-tabeller/Drizzle/RLS — E3 bruker kun `auth.users`.

**Statisk-rendering-premiss (viktig for D5):** `/blogg`-rutene er `force-static`, forsiden og manifest er statiske. Å lese `cookies()` i rot-layouten ville tvunget hele treet dynamisk. Innlogget-tilstand i global nav må derfor løses uten server-side cookie-lesing i layouten.

## Goals / Non-Goals

**Goals:**
- Bruker skriver e-post på `/logg-inn` → mottar magic link → klikker → er innlogget.
- Sesjonen overlever full sidelasting og navigasjon (token-refresh i middleware).
- `/konto` viser innlogget e-post; redirecter til `/logg-inn` når utlogget.
- Logg ut tømmer sesjonen; `/konto` blir utilgjengelig etterpå.
- Offentlig innhold (forside, `/blogg`, `/manifest`) forblir tilgjengelig uten innlogging — og forblir *statisk*.
- Cookie på `.geish.no` i prod (verifiserbar i nettleserens cookie-inspektør), auth funker fortsatt på localhost og Vercel-preview.
- Nav reflekterer innlogget tilstand på alle sider.
- Innlogget-tilstand eksponert som dokumentert mønster (server + client) som E4 arver.

**Non-Goals:**
- Profiles-tabell, Drizzle-migrasjoner, RLS (E4).
- OAuth-providere (senere backlog).
- Roller/invitasjoner/per-tråd-gating (E4+).
- Skrive-funksjoner av noe slag.
- Subdomene-apper eller testing mot subdomener.
- Custom SMTP / e-postmaler / rate limiting.
- Engelsk locale på auth-flatene.

## Decisions

### D1. Rute-navngiving: `/logg-inn`, `/auth/callback`, `/auth/logg-ut`, `/konto`

**Valg:**

| Rute | Type | Rolle |
|------|------|-------|
| `/logg-inn` | page (client form) | E-postskjema + lenke-sendt-kvittering |
| `/auth/callback` | route handler (GET) | PKCE code → sesjon, redirect inn |
| `/auth/logg-ut` | route handler (POST) | `signOut()`, redirect til `/` |
| `/konto` | page (server, dynamisk) | Beskyttet review-flate |

**Hvorfor:**
- Brukersynlige ruter er norske (`/logg-inn`, `/konto`) — konsistent med `/blogg`, `/manifest` og sitens språk.
- `/auth/*` er tekniske endepunkter brukeren aldri skriver inn selv. `/auth/callback` matcher Supabase' dokumentasjonskonvensjon og er strengen som registreres i Supabase' Redirect URLs — å følge konvensjonen gjør feilsøking mot deres docs 1:1. Logg ut legges under samme tekniske prefix (`/auth/logg-ut`) siden det også er et endepunkt, ikke en side.
- Logg ut som **POST** (ikke GET): endrer server-state (tømmer sesjon), skal ikke kunne trigges av prefetch/crawlere/`<img src>`-triks. `<form method="post">` funker uten JS.

**Alternativer vurdert:**
- `/logg-inn/callback`: samler alt, men avviker fra Supabase-konvensjonen alle guider bruker. Avvist.
- Logg ut som server action i stedet for route handler: funker, men route handler gir ett HTTP-endepunkt begge konsumentene (nav + `/konto`) kan poste til med ren HTML-form — mindre klientkode. Avvist for nå; E4 kan gjerne bruke server actions for sine flows.

### D2. Guard: middleware refresher, `/konto`-siden guarder

**Valg:** To lag med hver sin jobb:
1. **`src/middleware.ts`** kjører Supabase' `updateSession`-mønster: leser cookies fra request, refresher tokenet ved behov (`auth.getUser()`), skriver oppdaterte cookies på både request og response. Matcher: alt unntatt `_next/static`, `_next/image`, favicon og statiske filendelser. Middleware **redirecter ikke** og kjenner ingen "beskyttede ruter"-liste.
2. **`/konto/page.tsx`** gjør selve guarden: server component kaller `createClient()` → `auth.getUser()` → `redirect("/logg-inn")` hvis `null`.

**Hvorfor:**
- Supabase' egne docs advarer mot å stole på middleware alene for beskyttelse (cookie kan være stale; kun `getUser()` nær datakilden er autoritativ). Page-guarden er det robuste laget.
- Én beskyttet rute = en middleware-basert rute-liste er overengineering. Page-guard er ~3 linjer og åpenbar å lese.
- Middleware trengs *uansett* for token-refresh (uten den dør sesjonen når access-tokenet utløper — suksesskriteriet "sesjonen overlever refresh og navigasjon" hviler på den). Å la den gjøre kun dét gir én jobb per lag.
- E4-arv: nye beskyttede ruter kopierer page-guard-mønsteret (eller får en delt `requireUser()`-helper når det blir flere enn to steder — ikke nå, YAGNI).

**Alternativer vurdert:**
- Middleware-redirect på `/konto`-matcher: raskere redirect (før rendering), men dobbelt sannhetskilde for "hvem er beskyttet" og falsk trygghet ved stale cookie. Avvist.
- Layout-guard (`konto/layout.tsx`): Next-docs fraråder guard i layout (layouts re-rendres ikke ved klientnavigasjon innen samme segment). Page-guard er det dokumenterte mønsteret. Avvist.

### D3. Cookie-domene: eksplisitt env-var, én helper, tre konsumenter (fotpistolen)

**Valg:** Ny helper:

```ts
// src/lib/supabase/cookie-domain.ts
/**
 * `.geish.no` KUN i prod. På localhost og *.vercel.app er `.geish.no` et
 * ugyldig cookie-domene → nettleseren DROPPER cookien stille → auth ser ut
 * til å virke (lenke sendes) men sesjonen forsvinner. Derfor: env-var som
 * BARE settes i Vercel Production-env; alle andre miljøer får undefined
 * (= host-only cookie, riktig for localhost + preview).
 */
export function authCookieDomain(): string | undefined {
  return process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || undefined;
}
```

Alle tre klient-stedene sender den inn:

```ts
createServerClient(url, key, { cookieOptions: { domain: authCookieDomain() }, cookies: {...} });
createBrowserClient(url, key, { cookieOptions: { domain: authCookieDomain() } });
// + samme i updateSession-middleware-klienten
```

`NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.geish.no` settes i Vercel **kun** for Production-environment. Ikke i `.env.local`, ikke i Preview.

**Hvorfor eksplisitt env-var (ikke `VERCEL_ENV`-deteksjon):**
- Browser-klienten trenger verdien client-side → må uansett være `NEXT_PUBLIC_*`. (`VERCEL_ENV` er server-only med mindre man også eksponerer `NEXT_PUBLIC_VERCEL_ENV` — da har man samme env-konfig-avhengighet, med mer logikk rundt.)
- "Sett variabelen kun i prod" gjør prod-oppførselen til en *synlig konfigbeslutning* i Vercel-dashbordet i stedet for skjult kodelogikk. Feilsøking = sjekk om variabelen er satt.
- `|| undefined` sikrer at tom streng ikke sendes som domene.
- Én helper + tre konsumenter = umulig å ha rett domene i server-klienten men glemme middleware (som er den klassiske varianten av denne buggen).

**Verifisering (fanges i tasks):** deployet site viser `Domain=.geish.no` på `sb-*`-cookies i nettleserens inspektør; localhost viser host-only cookie; hele login-flyten kjøres lokalt som del av review.

### D4. Innlogget-tilstand eksponeres todelt: server `getUser()`, client `useUser()`

**Valg (dette er mønsteret E4 arver):**
- **Server components / route handlers / server actions:** `createClient()` fra `@/lib/supabase/server` → `const { data: { user } } = await supabase.auth.getUser()`. Autoritativt (validerer mot Supabase), brukes for guards og alt som gir tilgang.
- **Client components:** ny hook `useUser()` i `src/lib/auth/use-user.ts` — wrapper browser-klienten: `getUser()` ved mount + `onAuthStateChange`-subscription. Returnerer `{ user: User | null, loading: boolean }`. Kosmetisk (vis/skjul UI), aldri tilgangskontroll.

```ts
// src/lib/auth/use-user.ts (skisse)
"use client";
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { user, loading };
}
```

**Hvorfor ikke React context/provider:** en provider i rot-layouten som fetcher user server-side ville gjort hele treet dynamisk (bryter statisk-premisset) eller krevd hydration-triksing. `useUser()` er selvforsynt — hver konsument betaler kun sin egen klientkostnad, statiske sider forblir statiske. Med dagens én konsument (AuthNav) og E4s håndfull skrive-knapper er context-deduplisering ikke verdt kompleksiteten. Kan løftes til provider senere uten API-endring for konsumentene.

**Regel som noteres for E4:** `useUser()` styrer bare hva som *vises*. Selve skrivingen valideres alltid server-side med `getUser()` (+ RLS når E4 lander tabeller).

### D5. Nav: ny global `AuthNav` (client component) i rot-layouten

**Valg:** Det finnes ingen global nav å endre — sidene har egne brødsmule-strips. I stedet for å innføre auth-lenker i hver strip (4+ steder, og forsiden har ingen strip) monteres én ny komponent i rot-layouten:

- `src/components/shared/AuthNav/` — client component, bruker `useUser()` (D4).
- Utlogget: `LOGG INN →` (lenke til `/logg-inn`). Innlogget: `KONTO` (lenke) + `LOGG UT` (`<form method="post" action="/auth/logg-ut">`).
- Stil: mono-font, liten caps-tekst i zine-språket (dashed border, stempel-rød aksent) — plasseres øverst til høyre som en "trykt etikett", via CSS Module. Ingen nye avhengigheter.
- Mens `loading === true` rendres tom placeholder med fast bredde-reservasjon (ingen "LOGG INN"-blink for innloggede brukere, ingen layout-shift).

**Hvorfor client component i layouten:** rot-layouten kan ikke lese cookies uten å gjøre alle sider dynamiske (se Context). En client component hydreres oppå statisk HTML og henter tilstanden i nettleseren — forsiden/blogg/manifest forblir `force-static`. Trade-off: auth-tilstanden vises et blunk etter last (akseptert; markert som bevisst valg).

**Alternativer vurdert:**
- Auth-lenker i hver sides brødsmule-strip: berører alle sider + forsiden mangler strip; N steder å vedlikeholde. Avvist.
- Server-rendret nav med `cookies()`: gjør hele treet dynamisk. Avvist (bryter E2s statiske arkitektur).
- PPR/`Suspense`-holes: Next-versjonens PPR-status er ikke noe å lene en sikkerhetskritisk epic på. Avvist for nå.

### D6. `/logg-inn`: to-tilstands client-skjema, kvittering med adresse

**Valg:** Siden er en server-page som redirecter til `/konto` hvis allerede innlogget, og ellers rendrer `<LoginForm />` (client component):
1. **Skjema-tilstand:** e-postfelt + "SEND MEG EN LENKE"-knapp. Submit kaller `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/konto` } })`.
2. **Lenke-sendt-tilstand:** skjemaet byttes ut med kvittering i zine-stil: "LENKE SENDT"-stempel + "Sjekk innboksen til <e-post>. Lenken virker i én time." + liten "bruk en annen adresse"-lenke som resetter til skjema-tilstand.
3. **Feil-tilstand:** `?feil=`-param fra callbacken (utløpt/ugyldig lenke) eller nettverksfeil fra `signInWithOtp` vises som feilboks over skjemaet, med mulighet til å prøve igjen.

Copy legges i `src/content/locales/no.ts` (`auth`-slice) per t()-mønsteret.

**Hvorfor:** Supabase-default e-postoppsett holder (mandat), men default-UX-en uten kvittering er forvirrende ("skjedde det noe?"). Å vise mottakeradressen i kvitteringen fanger tastefeil — eneste måten å oppdage feilstavet e-post på i en passordløs flyt. `shouldCreateUser` står på default (true): innlogging og registrering er samme flyt, i tråd med "innlogget: ja/nei"-modellen.

### D7. Callback: `exchangeCodeForSession` i route handler, feil tilbake til `/logg-inn`

**Valg:**

```ts
// src/app/auth/callback/route.ts (skisse)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next")); // kun interne stier, default "/konto"
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/logg-inn?feil=lenke`);
}
```

- `safeNext()` slipper kun gjennom stier som starter med `/` (ikke `//`) — open-redirect-vern.
- Redirect bygges på `origin` fra requesten, så localhost/preview/prod alle lander riktig uten hardkodede hoster.

**Hvorfor:** dette er Supabase' dokumenterte PKCE-mønster for App Router, og mandatet krever server-side exchange eksplisitt. Feil (utløpt lenke, gjenbrukt kode) sendes tilbake til `/logg-inn` der D6 viser den — brukeren står alltid et sted med en handlingsmulighet.

## Risks / Trade-offs

- **[Risk] Cookie-domene-fotpistolen realiseres likevel** (noen setter `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` i `.env.local` eller preview) → Mitigation: helperens kommentar forklarer konsekvensen; tasks inkluderer eksplisitt verifisering av begge miljøer; variabelen dokumenteres som "kun Vercel Production" i proposal/tasks.
- **[Risk] AuthNav blinker/er tom første ~100ms etter last** → Akseptert trade-off for å bevare statiske sider (D5). Fast bredde-reservasjon hindrer layout-shift; ingen feilaktig tilstand vises (tom, ikke "LOGG INN").
- **[Risk] Magic link åpnes i annen nettleser enn den som ba om den** (e-postapp åpner in-app-browser) → PKCE-verifier bor i cookies i nettleseren som *ba om* lenken; exchange i annen browser feiler → `?feil=lenke` på `/logg-inn` med "be om ny lenke". Kjent Supabase-begrensning; kvitteringsteksten ber brukeren åpne lenken på samme enhet/nettleser.
- **[Risk] Middleware på alle ruter koster litt latency også på offentlige sider** → Mitigation: `updateSession` gjør kun arbeid når auth-cookies finnes; matcheren ekskluderer statiske assets. For anonyme besøk er kostnaden ~null.
- **[Risk] `getUser()` i middleware kaller Supabase på hver request for innloggede brukere** → Akseptert: dette er Supabase' anbefalte mønster (tokenvalidering + refresh). Trafikknivået til en personlig zine gjør dette til et ikke-problem; rate limiting er eksplisitt ut av scope.
- **[Risk] Vercel-preview-domener må være registrert som Redirect URLs i Supabase, ellers feiler magic link fra preview** → Mitigation: wildcard (`https://*-geir74s-projects.vercel.app/auth/callback` el.l.) legges inn som del av tasks; verifiseres i PR-review via preview-deployen.
- **[Risk] `/konto` er dynamisk (cookies) mens resten er statisk — lett å senere "smitte" statiske sider ved å importere feil klient** → Mitigation: regelen "server-klient kun i dynamiske ruter/handlers; statiske sider forblir auth-frie server-side" noteres i D4/D5 og arves av E4.
- **[Risk] Fremtidig spin-out: identiteten må kunne eksporteres** → Ingen kode nå (mandat), men D4-mønsteret binder ingenting til geish.no utover Supabase `auth.users` (e-post) — eksport forblir mulig.

## Migration Plan

Brownfield, additivt. Roll-back: `git revert` av implementeringscommiten — ingen DB-endringer, ingen data. Env-varen i Vercel kan stå igjen uten effekt etter revert (men fjernes for ryddighet). Sekvens:

1. Supabase-konfig: Redirect URLs (localhost + prod + preview-wildcard), Site URL.
2. `cookie-domain.ts`-helper + utvid `server.ts`/`client.ts` med `cookieOptions`.
3. `src/lib/supabase/middleware.ts` (updateSession) + `src/middleware.ts` med matcher.
4. `/auth/callback` + `/auth/logg-ut` route handlers.
5. `/logg-inn` (page + LoginForm + CSS) + `auth`-slice i `no.ts`.
6. `/konto` (guard + visning + CSS).
7. `useUser()`-hook + `AuthNav` + montering i rot-layout.
8. Verifisering: full flyt lokalt (send → klikk → innlogget → refresh → logg ut), statiske ruter fortsatt statiske (`npm run build`-output), tsc/lint rent. Prod-cookie-verifisering skjer etter merge/deploy.

## Open Questions

Mandatets fire åpne spørsmål er avgjort i D1 (rute-navngiving), D2 (middleware vs. layout-guard), D4 (eksponering av innlogget-tilstand), D6 (lenke-sendt-UX). Gjenstående småting:

- **Skal smoke-ruten få en `authStatus`-linje?** — Forslag: ja, billig ("middleware wired, session: none/aktiv e-post") — men kun hvis det ikke drar smoke-ruten inn i dynamisk rendering på uønsket vis. Avgjøres i implementering.
- **Plassering av AuthNav visuelt (fast øverst til høyre vs. inline per side)** — Forslag: fixed/absolutt øverst til høyre som "trykt etikett". Finjusteres visuelt i review; ikke arkitektonisk bindende.
- **`next`-param på `/logg-inn`** (redirect tilbake dit man kom fra etter innlogging) — Bygges bare som passthrough til callbacken (`?next=`), default `/konto`. E4 kan bruke den fra skrive-knapper.
