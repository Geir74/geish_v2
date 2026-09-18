# admin Specification

## Purpose
TBD - created by archiving change e4.5-admin-foundation. Update Purpose after archive.

## Requirements

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

> Moderering-mønster-kravet er BEVISST UTELATT fra E4.5 (gjennomgang med Geir
> 2026-09-11, beslutning B): et mønster uten en faktisk bruker speses i blinde.
> Det utledes fra E5s første faktiske moderering-panel i stedet. E4.5 leverer kun
> `isAdmin()` + `/admin`-guard + en nesten tom fanzine-landingsside.

### Requirement: moderering-mønster for gjestebok under /admin

`/admin` SHALL få et gjestebok-moderering-panel på `/admin/gjestebok`, guardet av
den samme `getUser()` + `isAdmin()`-muren som resten av `/admin` (fail closed).
Panelet SHALL liste ALLE innlegg uansett status (`pending`, `published`,
`hidden`), nyest først, med hver rads `status` synlig. Rader som venter på
godkjenning (`pending`) SHALL fremheves. Alle actions SHALL være server actions
som (1) verifiserer `isAdmin()` server-side FØR skriving (autoritativ mur, ikke
kun UI), og (2) skriver via Drizzle. Dette ETABLERER moderering-mønsteret som ble
bevisst utsatt fra E4.5 (beslutning B) — nå utledet fra en faktisk bruker.

Moderering-actions SHALL være:

- **Vis:** en `pending`- eller `hidden`-rad → `published`.
- **Skjul:** en `published`- eller `pending`-rad → `hidden` (fjernes fra
  offentlig visning uten å slettes).
- **Slett:** rad fjernes permanent.
- **Rediger:** endre `author_name` og/eller `body` på en rad. Redigering er
  BEVISST AVGRENSET til å rette skrivefeil og fjerne sensitiv informasjon
  (f.eks. telefonnummer, adresse) — den SHALL NOT brukes til å endre meningen i
  det en gjest skrev. Redigering endrer IKKE `status`.

Hver action SHALL sette `updated_at = now()` (der raden består) og SHALL være
utilgjengelig for ikke-admin (server-side avvisning, ikke bare skjult knapp).

#### Scenario: admin ser alle innlegg
- **WHEN** admin åpner `/admin/gjestebok`
- **THEN** vises ALLE innlegg (pending, published, hidden) nyest først med synlig
  status per rad, pending fremhevet, og vis-, skjul-, slett- og rediger-handlinger

#### Scenario: godkjenning publiserer
- **WHEN** admin godkjenner et `pending`-innlegg
- **THEN** settes `status = 'published'` og `updated_at = now()`, og innlegget
  vises deretter på den offentlige `/gjestebok`-siden

#### Scenario: skjul fjerner fra offentlig visning
- **WHEN** admin skjuler et innlegg
- **THEN** settes `status = 'hidden'`, og innlegget vises ikke lenger offentlig,
  men slettes ikke

#### Scenario: redigering retter uten å endre status
- **WHEN** admin redigerer `author_name` og/eller `body` på et innlegg
- **THEN** persisteres endringen og `updated_at = now()`, mens `status` forblir
  uendret

#### Scenario: moderering-action krever admin server-side
- **WHEN** en ikke-admin (utlogget eller innlogget ikke-admin) treffer en
  moderering-server-action direkte
- **THEN** avvises den server-side via `isAdmin()` uten å endre noen rad
