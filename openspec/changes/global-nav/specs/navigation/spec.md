## ADDED Requirements

### Requirement: Global SiteNav i rot-layouten

Prosjektet SHALL ha én global navigasjonskomponent `SiteNav`
(`src/components/shared/SiteNav/`) montert i `src/app/layout.tsx`, over
`{children}` i `<body>`. `SiteNav` SHALL være den eneste navigasjonsflaten som
binder rommene sammen, og SHALL erstatte og absorbere `AuthNav` fra E3 (auth-
visningen flyttes inn i SiteNav, ikke montert separat). `AuthNav`-fila kan
beholdes i repoet, men SHALL ikke lenger monteres eller eksporteres fra
shared-barrelen.

#### Scenario: SiteNav er montert globalt
- **WHEN** en hvilken som helst side i appen rendres
- **THEN** vises `SiteNav` fra rot-layouten, og `AuthNav` er ikke montert separat

#### Scenario: shared-barrel eksporterer SiteNav
- **WHEN** `src/components/shared/index.ts` inspiseres
- **THEN** eksporteres `SiteNav`, og `AuthNav` eksporteres ikke lenger

### Requirement: Nav viser kun lenker til rom som finnes

`SiteNav` SHALL rendre rom-lenker utelukkende fra `t().nav.links`, og listen
SHALL kun inneholde ruter som faktisk finnes i appen. Ved denne endringen er det
Hjem (`/`), Blogg (`/blogg`) og Manifest (`/manifest`). Det SHALL ikke finnes
grå/disabled placeholder-lenker for rom som ennå ikke er bygget (f.eks.
Stua/Gjestebok); slike lenker legges til FØRST når rommet finnes. All
lenke-copy SHALL hentes fra `t()` (`nav`-slice i `src/content/locales/no.ts`) —
ingen hardkodet tekst i komponenten.

#### Scenario: kun eksisterende rom lenkes
- **WHEN** `SiteNav` rendres
- **THEN** vises lenker til Hjem, Blogg og Manifest, og ingen lenke til rom som ikke finnes (ingen disabled placeholders)

#### Scenario: copy kommer fra i18n
- **WHEN** en nav-etikett skal endres
- **THEN** endres den i `nav`-slicen i `src/content/locales/no.ts`, ikke i komponenten

### Requirement: Nav bevarer statisk rendering

`SiteNav` SHALL være en client-komponent (`"use client"`) som henter innlogget-
tilstand via `useUser()` i nettleseren og aldri leser cookies server-side.
Montering av `SiteNav` i rot-layouten SHALL ikke gjøre statiske ruter dynamiske:
`/`, `/blogg` og `/manifest` SHALL forbli statisk prerendret (`○ (Static)` i
Next.js build-output). Mens `useUser()` laster SHALL auth-delen holde reservert
plass slik at det ikke oppstår layout-shift eller «logg inn»-blink for
innloggede brukere.

#### Scenario: statiske ruter forblir statiske
- **WHEN** `npm run build` kjøres
- **THEN** er `/`, `/blogg` og `/manifest` fortsatt merket `○ (Static)` i rute-oversikten

#### Scenario: ingen layout-shift ved auth-loading
- **WHEN** en side lastes og `useUser()` ennå ikke har svart
- **THEN** holder auth-delen reservert plass, uten å blinke «LOGG INN» for en bruker som viser seg å være innlogget

### Requirement: Innlogget-tilstand i nav (absorbert fra E3)

`SiteNav` SHALL vise innlogget-tilstand med samme oppførsel som E3s `AuthNav`:
en utlogget bruker SHALL se en `Logg inn`-lenke til `/logg-inn`; en innlogget
bruker SHALL se en `Min side`-lenke til `/konto` og en `Logg ut`-handling som
POST-er et `<form>` mot `/auth/logg-ut` (fungerer uten JS). Auth-etikettene
SHALL hentes fra `t().nav`. Selve auth-flyten (middleware, callback, `/logg-inn`,
`/auth/logg-ut`, cookie-domene) SHALL være uendret — kun visningen flyttes.

#### Scenario: utlogget bruker
- **WHEN** en utlogget bruker ser `SiteNav`
- **THEN** vises en `Logg inn`-lenke til `/logg-inn`

#### Scenario: innlogget bruker
- **WHEN** en innlogget bruker ser `SiteNav`
- **THEN** vises en `Min side`-lenke til `/konto` og en `Logg ut`-knapp som POST-er mot `/auth/logg-ut`

### Requirement: Aktiv rute markeres

`SiteNav` SHALL markere hvilken rute som er aktiv basert på `usePathname`. Den
aktive lenken SHALL få `aria-current="page"` og en visuell «tapet fast»-tilstand
(stempel-farget fyll) som skiller den fra de andre lappene. For Hjem (`/`)
gjelder eksakt match; for øvrige rom gjelder prefiks-match (`/blogg` er aktiv
også på `/blogg/<slug>`).

#### Scenario: aktiv side utheves
- **WHEN** brukeren er på `/blogg` eller `/blogg/hello-world`
- **THEN** er Blogg-lappen markert aktiv med `aria-current="page"`

#### Scenario: hjem krever eksakt match
- **WHEN** brukeren er på `/blogg`
- **THEN** er Hjem-lappen ikke markert aktiv

### Requirement: Zine-design med papirlapper og mobil-wrap

`SiteNav` SHALL følge Cut & Paste-zine-designsystemet og bruke kun eksisterende
designtokens (CSS-variabler for fonter, farger, avstander, `--border-dashed`) —
ingen nye avhengigheter, ingen border-radius/blur/gradient/emoji. Lenkene SHALL
presenteres som «avrevne papirlapper» (mono/caps, dashed «tape»-kant, lett
rotasjon, stempel-rød på hover). På smal skjerm SHALL lappene flyte over flere
rader (flex-wrap); det SHALL ikke brukes hamburger- eller off-canvas-meny.

#### Scenario: zine-tro styling
- **WHEN** `SiteNav`-stilen inspiseres
- **THEN** brukes kun eksisterende designtokens, og det finnes ingen hamburger, border-radius, blur, gradient eller emoji

#### Scenario: lappene wrapper på mobil
- **WHEN** navet vises på en smal skjerm (f.eks. 320px)
- **THEN** flyter lenke-lappene over flere rader uten hamburger-meny
