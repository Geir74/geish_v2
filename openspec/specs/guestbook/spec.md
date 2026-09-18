# guestbook Specification

## Purpose
TBD - created by archiving change e5-gjestebok. Update Purpose after archive.

## Requirements

### Requirement: guestbook_entries-tabell med moderering-status

Prosjektet SHALL definere en `guestbook_entries`-tabell i `src/db/schema.ts`
(Drizzle `pgTable`). Tabellen SHALL ha:

- `id uuid` PRIMARY KEY DEFAULT `gen_random_uuid()`.
- `author_name text NOT NULL` med `CHECK` som håndhever 1–60 tegn (fritekst –
  ingen identitetsvalidering, D2).
- `body text NOT NULL` med `CHECK` som håndhever 1–2000 tegn.
- `status text NOT NULL DEFAULT 'pending'` med `CHECK` begrenset til
  `('pending','published','hidden')`.
- `author_id uuid` NULL, FOREIGN KEY til `auth.users(id)` med `ON DELETE SET
  NULL` — settes for innloggede, NULL for anonyme.
- `created_at timestamptz NOT NULL DEFAULT now()`.
- `updated_at timestamptz NOT NULL DEFAULT now()`.

Tabell-DDL SHALL genereres via `drizzle-kit generate` og committes som SQL-
migrasjon under `drizzle/`. Migrasjonen MUST NOT opprette eller endre `auth`-
skjemaet.

#### Scenario: tabell finnes med status-constraint
- **WHEN** `src/db/schema.ts` og migrasjonen inspiseres
- **THEN** finnes `guestbook_entries` med `status`-kolonne begrenset til
  `pending`/`published`/`hidden` via `CHECK`, og `author_name`/`body` har
  lengde-`CHECK`

#### Scenario: anonymt innlegg tillater NULL author_id
- **WHEN** en rad lagres uten innlogget bruker
- **THEN** er `author_id` NULL og raden er gyldig

### Requirement: RLS — offentlig leser kun publiserte

`guestbook_entries` SHALL ha Row Level Security aktivert. Policyene SHALL være:

- `SELECT`: tillatt for alle (anon + authenticated) KUN for rader der
  `status = 'published'` — `USING (status = 'published')`.
- Ingen klient-`INSERT`/`UPDATE`/`DELETE`-policy: all skriving skjer via Drizzle
  server-laget (som omgår RLS), aldri via PostgREST/anon-stien.

Policyene SHALL være håndskrevet, committet, idempotent SQL under `drizzle/rls/`.

#### Scenario: anon ser kun publiserte via PostgREST
- **WHEN** en anonym klient leser `guestbook_entries` via PostgREST/anon-stien
- **THEN** returneres kun rader med `status = 'published'`; `pending`/`hidden`
  er usynlige

#### Scenario: skriving via anon-stien er umulig
- **WHEN** en klient forsøker INSERT/UPDATE/DELETE via PostgREST/anon-stien
- **THEN** nektes den (ingen skrive-policy finnes)

### Requirement: offentlig gjestebok-side med innsendingsskjema

`src/app/gjestebok/page.tsx` SHALL vise publiserte innlegg (nyest først, lest
via Drizzle) og et innsendingsskjema. Skjemaet SHALL ha synlige felt `navn`
(påkrevd) og `melding` (påkrevd), OG et usynlig honeypot-felt. Skjemaet SHALL
være en client component som poster til en gjestebok-server-action. All bruker-
synlig copy SHALL komme fra `t()` (`gjestebok`-slice i `no.ts`) — ingen
hardkodede strenger. Innlegg SHALL vise `author_name`, `body` og dato — ALDRI
noen e-post (ingen lagres).

#### Scenario: publiserte innlegg vises
- **WHEN** en besøkende åpner `/gjestebok`
- **THEN** vises publiserte innlegg (nyest først) med navn, melding og dato, og
  et skjema for å skrive nytt innlegg

#### Scenario: pending/hidden vises ikke offentlig
- **WHEN** det finnes innlegg med `status` `pending` eller `hidden`
- **THEN** vises de IKKE på den offentlige `/gjestebok`-siden

#### Scenario: ingen persondata i visning
- **WHEN** gjestebok-siden og dens datalesing inspiseres
- **THEN** finnes ingen e-post eller annen persondata i tabell, henting eller
  visning

### Requirement: innsending — honeypot + innlogging avgjør publiseringsvei

Gjestebok-server-actionen SHALL, i rekkefølge: (1) sjekke honeypot — er det
usynlige feltet utfylt, SHALL innlegget forkastes stille (ikke lagres) og
returnere som suksess (D3); (2) validere at `navn` og `melding` er satt og innen
lengdegrensene; (3) hente innlogget bruker via `supabase.auth.getUser()`; (4)
skrive raden via Drizzle med `status = 'published'` og `author_id = user.id`
DERSOM innlogget, ellers `status = 'pending'` og `author_id = NULL` (D1). Actionen
MUST NOT kreve innlogging for å ta imot et innlegg.

#### Scenario: innlogget publiseres umiddelbart
- **WHEN** en innlogget bruker sender et gyldig innlegg (honeypot tomt)
- **THEN** lagres raden med `status = 'published'` og `author_id = user.id`, og
  innlegget vises umiddelbart på `/gjestebok`

#### Scenario: anonym legges i kø
- **WHEN** en ikke-innlogget besøkende sender et gyldig innlegg (honeypot tomt)
- **THEN** lagres raden med `status = 'pending'` og `author_id = NULL`, og
  innlegget vises IKKE før en admin godkjenner det

#### Scenario: honeypot forkaster stille
- **WHEN** det usynlige honeypot-feltet er utfylt (bot)
- **THEN** lagres ingen rad, og responsen ser ut som suksess (ingen hint til
  boten om at innlegget ble forkastet)

#### Scenario: tomt navn eller melding avvises
- **WHEN** `navn` eller `melding` mangler eller er utenfor lengdegrensene
- **THEN** avvises innsendingen med en synlig, `t()`-basert feilmelding, uten å
  skrive til databasen
