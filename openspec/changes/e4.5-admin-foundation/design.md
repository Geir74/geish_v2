# Design: E4.5 — Admin-fundament

Designbeslutninger for det tynne admin-taket. Alle valgt for å holde grensen
minimal, trygg (fail closed) og gjenbrukbar for E5/E6.

## D1: Admin-identitet via env, ikke role-kolonne

**Valg:** `ADMIN_USER_ID` (env) sammenlignes med `user.id`. Ingen `role`-kolonne
på `profiles`.

**Hvorfor:** Geir er realistisk eneste moderator lenge. En role-kolonne er en
tilgangsmekanisme uten brukere ennå (YAGNI). Env-basert er tynt, trygt og
trivielt å oppgradere: den dagen flere moderatorer trengs (Tove/medhjelpere),
blir det en egen liten change som legger `role` på `profiles` og bytter
`isAdmin()`-implementasjonen — kall-stedene (guards, actions) endres ikke.

**Konsekvens:** `isAdmin()` er ett bytte-punkt. Kall-signaturen holdes stabil så
oppgraderingen senere er isolert.

## D2: Fail closed

**Valg:** Mangler `ADMIN_USER_ID`, eller er den tom / bruker utlogget →
`isAdmin()` returnerer `false`. Aldri kast som lekker konfig-tilstand.

**Hvorfor:** En feilkonfigurasjon (glemt env i Vercel) skal stenge døra, ikke
åpne den. Sikkerhetsgrenser feiler mot det trygge.

## D3: Ikke-admin på /admin → 404 (ikke redirect)

**Valg:** `notFound()` (404), ikke redirect til innlogging.

**Hvorfor:** En redirect til `/logg-inn` avslører at `/admin` finnes og er verdt
å angripe. 404 lekker ingenting — for en ikke-admin ser området ut til ikke å
eksistere. Dette er «security through not-advertising», ikke through-obscurity:
sjekken er ekte uansett, men vi unngår å reklamere for angrepsflaten.

**Motforestilling vurdert:** En innlogget ikke-admin som *ved* at `/admin`
finnes får en litt forvirrende 404. Akseptabelt — det er ett menneske (Geir er
eneste admin), og personvern/angrepsflate veier tyngre enn den kosmetiske
forvirringen.

**Alternativ hvis Geir foretrekker:** redirect til forsiden med nøytral tekst.
Besluttes før 3.1 implementeres.

## D4: Guard i server-laget, ikke middleware

**Valg:** `getUser()` + `isAdmin()` i page/action, samme mønster som E3s
`/konto`-guard og E4s action-guard. Ikke middleware, ikke kun RLS.

**Hvorfor:** Domenedata går via Drizzle (`DATABASE_URL`) som omgår RLS — RLS kan
ikke være den primære muren for admin-handlinger. Middleware-guards er lette å
omgå ved feilkonfig og skjuler hvor grensen egentlig håndheves. Å la guarden bo
der handlingen skjer gjør sikkerheten lesbar og testbar. Konsistent med E3/E4.

## D5: Tak nå, paneler senere

**Valg:** E4.5 leverer `/admin`-landingsside + guard + mønster. Ingen faktiske
moderering-paneler (de kommer med E5/E6).

**Hvorfor:** Ikke bygg kartet før landskapet. Taket er verdifullt uansett hvilket
rom som kommer først; panelene speses når flaten de modererer faktisk finnes.

## Åpent for Geir før implementering

- **D3-bekreftelse:** 404 (anbefalt) vs redirect til forsiden? Standard = 404.
- **`/admin/layout.tsx`:** bygges nå (felles guard for `/admin/*`) eller vent til
  E5 legger første underrute? Anbefaling: minimal layout nå, så E5 arver guarden.
