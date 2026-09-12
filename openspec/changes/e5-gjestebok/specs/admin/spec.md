# admin Specification

## ADDED Requirements

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
