# navigation

## ADDED Requirements

### Requirement: Global navigasjon montert i rot-layout
Siten SKAL ha én global navigasjonskomponent (`SiteNav`) montert i rot-layouten,
synlig på alle sider, som erstatter den tidligere frittstående `AuthNav`.

#### Scenario: Nav synlig på alle rom
- **GIVEN** en besøkende på en hvilken som helst side (forside, blogg, manifest, surdeig, gjestebok)
- **WHEN** siden lastes
- **THEN** vises SiteNav med lenker til alle eksisterende rom

### Requirement: Lenker kun til rom som finnes
SiteNav SKAL vise lenker til: Hjem (`/`), Blogg (`/blogg`), Surdeig (`/surdeig`),
Gjestebok (`/gjestebok`), Manifest (`/manifest`), i denne rekkefølgen. Den SKAL
IKKE vise lenker til rom som ikke finnes (f.eks. Stua).

#### Scenario: Alle live-rom har lenke
- **GIVEN** SiteNav rendres
- **THEN** finnes nøyaktig disse rom-lenkene i rekkefølge: Hjem, Blogg, Surdeig, Gjestebok, Manifest

#### Scenario: Ingen placeholder for manglende rom
- **GIVEN** et rom som ikke er implementert (Stua)
- **THEN** vises ingen lenke eller disabled-placeholder for det

### Requirement: Auth-tilstand i nav
SiteNav SKAL vise auth-tilstand: `Logg inn` når utlogget, og `Min side` + `Logg ut`
når innlogget. Auth-tilstanden SKAL leses client-side via `useUser()`, aldri
server-side. SiteNav SKAL gjenbruke de EKSAKTE rute-stiene fra dagens `AuthNav`:
konto-lenke `/konto`, logg inn `/logg-inn`, logg ut via `<form method="post"
action="/auth/logg-ut">`. Den SKAL IKKE innføre nye stier (`/min-side` e.l.).

#### Scenario: Utlogget bruker
- **GIVEN** en utlogget besøkende
- **WHEN** SiteNav er hydrert
- **THEN** vises «Logg inn»-lenke og ingen «Logg ut»

#### Scenario: Innlogget bruker
- **GIVEN** en innlogget bruker
- **WHEN** SiteNav er hydrert
- **THEN** vises «Min side» og «Logg ut»

### Requirement: Statisk rendering bevares
SiteNav SKAL være en client-komponent (`"use client"`) og SKAL IKKE lese
cookies eller auth server-side. Statiske ruter SKAL forbli statiske i build-output.

#### Scenario: Statiske ruter forblir statiske
- **GIVEN** build kjøres
- **THEN** forside, blogg og manifest rapporteres fortsatt som statiske ruter

### Requirement: Ingen layout-shift ved auth-loading
Mens auth-tilstanden lastes SKAL SiteNav rendre en placeholder med FAST dimensjon
(ikke returnere `null`), slik at auth-delen ikke forskyver rom-lenkene når den
hydreres. Det SKAL ikke oppstå layout-shift eller «Logg inn»-blink for innloggede.

#### Scenario: Ingen blink eller shift under loading
- **GIVEN** auth-tilstand ikke er ferdig lastet
- **THEN** vises en reservert placeholder med fast dimensjon (ikke `null`), og rom-lenkene forskyves ikke når auth hydreres

### Requirement: Copy fra i18n
All tekst i SiteNav SKAL komme fra `i18n.ts` (ny `nav`-nøkkel + eksisterende
`auth.nav`). Ingen hardkodet tekst i komponenten.

#### Scenario: Ingen hardkodet tekst
- **GIVEN** SiteNav-komponenten
- **THEN** hentes alle etiketter fra i18n, ikke inline-strenger
