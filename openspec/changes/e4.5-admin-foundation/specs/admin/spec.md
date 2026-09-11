## ADDED Requirements

### Requirement: én autoritativ admin-sjekk i server-laget

Prosjektet SHALL tilby én gjenbrukbar server-side hjelper `isAdmin(user)` (eller
`isAdmin()` som selv henter `getUser()`) som avgjør om innlogget bruker er admin.
Kilden til admin-identitet SHALL være en env-variabel `ADMIN_USER_ID` (en
Supabase `auth.users`-UUID), IKKE en role-kolonne i databasen (D1). Sjekken MUST
sammenligne `user.id` mot `ADMIN_USER_ID` på server-siden.

Admin-sjekken SHALL være den autoritative muren for alt admin-gated innhold og
alle moderering-actions. Den MUST NOT ligge kun i middleware eller kun i RLS —
den bor der handlingen skjer (samme prinsipp som E3s guard i `/konto`).

#### Scenario: admin gjenkjennes
- **WHEN** en innlogget bruker med `user.id === ADMIN_USER_ID` sjekkes
- **THEN** returnerer `isAdmin` sann

#### Scenario: ikke-admin avvises
- **WHEN** en innlogget bruker med `user.id !== ADMIN_USER_ID`, eller en utlogget
  bruker, sjekkes
- **THEN** returnerer `isAdmin` usann

#### Scenario: manglende env feiler trygt
- **WHEN** `ADMIN_USER_ID` ikke er satt
- **THEN** returnerer `isAdmin` usann for alle (fail closed) — ingen får
  admin-tilgang ved feilkonfigurasjon

### Requirement: beskyttet /admin-tak

Prosjektet SHALL tilby et beskyttet `/admin`-område. Ruten `/admin` og alle
`/admin/*`-underruter SHALL være `force-dynamic` og guardes server-side med
`getUser()` + `isAdmin()`. Ikke-admin (utlogget eller innlogget ikke-admin)
SHALL nektes tilgang uten å lekke at området finnes eller hva det inneholder
(404 eller redirect — se design). `/admin` SHALL vise en minimal landingsside
for admin med plass til at senere flater (E5/E6) legger sine paneler under.

#### Scenario: admin når /admin
- **WHEN** admin-brukeren åpner `/admin`
- **THEN** vises admin-landingssiden (200)

#### Scenario: ikke-admin nektes /admin
- **WHEN** en utlogget bruker eller innlogget ikke-admin åpner `/admin`
- **THEN** nektes tilgang (404 eller redirect), og siden avslører ikke
  admin-innhold

### Requirement: moderering-mønster for gjenbruk

Prosjektet SHALL etablere et dokumentert mønster som E5/E6 kopierer for
moderering: server actions bak `isAdmin()`-guard, progressiv `<form action>`
som funker uten JavaScript, og `revalidatePath` etter mutasjon. E4.5 leverer
mønsteret (ikke en generisk moderering-motor); hver senere flate bringer sin
egen tabell og sitt eget panel under `/admin`.

#### Scenario: moderering-action er guardet
- **WHEN** en moderering-server-action (nå eller i E5/E6) kalles
- **THEN** starter den med `isAdmin()`-guard og avviser ikke-admin før noen
  mutasjon skjer

#### Scenario: fungerer uten JS
- **WHEN** et admin-panel rendres uten klient-JavaScript
- **THEN** kan admin fortsatt utføre handlinger via `<form action={...}>`
  (progressiv forbedring)
