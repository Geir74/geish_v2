## Why

geish.no skal huse egne verktøy, ikke bare blogg. Et av dem er en
**surdeigskalkulator** basert på baker's percentages. Dette er første epic
(B1) av fire (B1 kalkulator → B2 oppskrifter/lagring → B3 bake-logg → B4
sosialt lag).

B1 er den minste, frittstående biten: **en ren kalkulator uten database**,
åpent tilgjengelig (uinnlogget) på `/surdeig`. Den skal både være et faktisk
nyttig gratisverktøy og en teaser før lagring (B2) krever innlogging.

Det avgjørende kravet: kalkulatoren MÅ regne **true hydration** — altså ta
hensyn til at surdeigsstarteren selv består av mel og vann. En kalkulator som
behandler starteren som en nøytral ingrediens rapporterer feil hydrering
(f.eks. 70 % oppgitt blir i praksis ~75 % deig), og lurer dermed bakeren. Det
er kjernen i hva en *surdeigs*-kalkulator er.

DDT (deigtemperatur/vanntemperatur) og bassinage (justeringsvann) er bevisst
holdt UTE av B1 og legges til i B1.5 — de er korrekte tillegg, men ikke
nødvendige for at kjerneberegningen er sann.

## What Changes

- **Ny åpen rute `/surdeig`** i geish_v2 (Next.js App Router), server-rendret
  skall + klientside kalkulator-UI. Ingen auth, ingen database.
- **Ren beregningsmodul `src/lib/surdeig/bakers-math.ts`** — rene funksjoner
  uten sideeffekter. All matematikk (baker's %, true hydration, toveis,
  skalering) bor her og er enhetstestbar isolert.
- **True hydration innebygd:** hver oppskrift har en surdeigsstarter med egen
  hydrering (default 100 % = 50/50 mel/vann). Beregningen skiller ut mel og
  vann i starteren og legger dem til totalt mel- og vannregnskap før
  hydreringsprosent vises.
- **Flere meltyper:** brukeren kan legge til flere meltyper, hver med sin
  andel av total mel (summerer til 100 %). Total mel = 100 % baker's basis.
- **Toveis-beregning:** (a) fra melmengde → alle ingredienser via prosenter,
  og (b) fra ønsket ferdig deigvekt → alle ingredienser (løser bakover til
  melmengde).
- **Skalering:** endre totalvekt (eller melmengde), resten følger proporsjonalt.
- **Én uavrundet source of truth** (`baseFlourWeight`, number) i klient-store;
  alle viste gram-verdier er avledede visninger. Ingen komponent oppdaterer en
  annen i ring.
- **Avrundingsregel:** når gram-summer ikke treffer ønsket totalvekt eksakt
  etter avrunding, absorberes differansen i **vannet** (aldri mel eller salt).
- **Prosjektkort/lenke** på forsiden (eller prosjektseksjon) peker til `/surdeig`.

## Impact

- **Berørte capabilities:** ny `surdeig-kalkulator` (verktøy). Ingen endring i
  `auth`, `blog`, `profiles`, `project-foundation`, `guestbook` e.l.
- **Berørte filer (nye):**
  - `src/lib/surdeig/bakers-math.ts` (ren beregning + typer)
  - `src/lib/surdeig/bakers-math.test.ts` (enhetstester av matematikken)
  - `src/app/surdeig/page.tsx` (åpen rute, server-skall)
  - `src/app/surdeig/*` (klientside kalkulator-komponenter + store)
  - evt. `src/styles`-tokens gjenbrukes (ingen nye globale tokens)
- **Ingen DB/RLS/auth-endringer.** B1 rører ikke Supabase. Schema `surdeig`
  opprettes først i B2.
- **Ingen nye eksterne avhengigheter** utover det repoet allerede har (React,
  Next, test-runner). State-håndtering bruker eksisterende mønster i repoet.
- **Følger:** B2 (oppskrifter/lagring i schema `surdeig`), B3 (bake-logg),
  B4 (sosialt). B1.5 (DDT + bassinage) er et lite tillegg oppå B1.
