## MODIFIED Requirements

### Requirement: Dev-server starter rent, forsiden og smoke-ruten laster

Prosjektet SHALL kunne startes med `npm run dev` uten kompileringsfeil eller runtime-feil i den initielle render-syklusen. Forsiden (`/`) SHALL vise den fulle Cut & Paste Zine-forsiden — 13 seksjoner i 12-kolonners grid per `homepage`-capability. Smoke-ruten (`/smoke`) SHALL laste 200 og vise begge "wired"-statuser. Styleguide-ruten (`/styleguide`) SHALL fortsatt laste 200 og vise hele designsystemet.

Ingen shadcn-komponenter brukes på noen rute.

#### Scenario: forsiden viser full Cut & Paste Zine-layout
- **WHEN** `npm run dev` kjøres og HTTP-request sendes til `/`
- **THEN** ruten returnerer 200, ingen kompileringsfeil, og responsen inneholder bevis på alle 13 seksjoner fra `homepage`-capability (Megabox-headline, CornerStamp-tekst, ManifestCut-sitater, ProjectsRow med 5 cards, FooterRow med VisitorCounter, etc.)

#### Scenario: smoke-ruten laster
- **WHEN** `npm run dev` kjøres med gyldig `.env.local` og HTTP-request sendes til `/smoke`
- **THEN** ruten returnerer 200 og responsen viser `dbStatus = "wired (live verification deferred to first schema mandate)"` og `supabaseStatus = "wired (live verification deferred to first schema mandate)"`

#### Scenario: styleguide-ruten laster
- **WHEN** `npm run dev` kjøres og HTTP-request sendes til `/styleguide`
- **THEN** ruten returnerer 200 og rendrer hele designsystemet (tokens, komponenter, mønstre) som før
