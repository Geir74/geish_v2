# stua Specification

## ADDED Requirements

### Requirement: Lukket tilgang — Stua er bak innlogging

Hele `/stua` og alle underruter SHALL kreve innlogget bruker for både LESING og
skriving. En utlogget bruker som navigerer til en Stua-rute SHALL redirectes til
`/logg-inn?next=<opprinnelig-sti>` (ikke 404). Ingen Stua-innhold (rom-lister,
trådtitler, innlegg) SHALL eksponeres til utloggede via noen rute eller
forside-komponent.

#### Scenario: utlogget bruker åpner en Stua-rute
- **WHEN** en utlogget bruker åpner `/stua`, `/stua/[room]` eller `/stua/t/[slug]`
- **THEN** blir hun redirectet til `/logg-inn?next=<sti>` uten å se innhold

#### Scenario: innlogget bruker åpner Stua
- **WHEN** en innlogget bruker åpner `/stua`
- **THEN** vises romoversikten med de fem rommene

### Requirement: Datamodell — stua_rooms, stua_threads, stua_posts

Prosjektet SHALL definere tre tabeller i `src/db/schema.ts` (Drizzle):

- **`stua_rooms`**: `id uuid` PK, `slug text` UNIQUE, `name text NOT NULL`,
  `description text` NULL, `sort_order int NOT NULL DEFAULT 0`, `created_at`.
- **`stua_threads`**: `id uuid` PK, `room_id uuid` FK→`stua_rooms` ON DELETE
  RESTRICT, `author_id uuid` FK→`auth.users(id)` ON DELETE SET NULL,
  `title text NOT NULL` (CHECK trim-lengde 1–160), `slug text NOT NULL UNIQUE`
  (globalt unik, immutabel), `source_slug text` NULL UNIQUE, `last_activity_at
  timestamptz NOT NULL DEFAULT now()`, `reply_count int NOT NULL DEFAULT 0`,
  `status text NOT NULL DEFAULT 'published'` CHECK i (`published`,`hidden`),
  `created_at`, `updated_at`.
- **`stua_posts`**: `id uuid` PK, `thread_id uuid` FK→`stua_threads` ON DELETE
  CASCADE, `author_id uuid` FK→`auth.users(id)` ON DELETE SET NULL,
  `body text NOT NULL` (CHECK trim-lengde 1–10000), `status text NOT NULL DEFAULT
  'published'` CHECK i (`published`,`hidden`), `created_at`, `updated_at`.

Åpningsinnlegget i en tråd SHALL være den første `stua_posts`-raden (ikke et
felt på `stua_threads`). DDL SHALL genereres via `drizzle-kit` og MUST NOT endre
`auth`-skjemaet.

#### Scenario: tabeller finnes med constraints
- **WHEN** schema og migrasjon inspiseres
- **THEN** finnes `stua_rooms`, `stua_threads`, `stua_posts` med angitte
  kolonner, FK-er, CHECK-er og UNIQUE på `stua_threads.slug` og
  `stua_threads.source_slug`

### Requirement: RLS og skrive-vern

Alle tre tabeller SHALL ha Row Level Security aktivert. SELECT-policy SHALL kun
gi tilgang til rollen `authenticated` (ikke `anon`), og for `stua_threads`/
`stua_posts` SHALL SELECT begrenses til `status = 'published'`. Det SHALL IKKE
finnes klient-INSERT/UPDATE/DELETE-policy; i tillegg SHALL `insert, update,
delete, truncate` revokes fra `anon` og `authenticated`. All skriving SHALL skje
via Drizzle server-connection (som omgår RLS), med autoritativ auth-/eier-/
admin-sjekk i server actions.

#### Scenario: anon får ingen tilgang
- **WHEN** en anon PostgREST-forespørsel leser `stua_threads`
- **THEN** returneres ingen rader

#### Scenario: innlogget leser kun published
- **WHEN** rollen `authenticated` leser `stua_threads`
- **THEN** returneres kun rader med `status = 'published'`

### Requirement: Rom er admin-styrt, brukere starter tråder

Rom (`stua_rooms`) SHALL kun opprettes/endres av admin (seedet), aldri av
vanlige brukere. Fem rom SHALL seedes: Geish.no, Reik.no, Prat, Annet, Blogg.
En innlogget bruker SHALL kunne opprette en tråd i et rom og skrive svar
(`stua_posts`) i en tråd; innhold SHALL publiseres umiddelbart (`status =
'published'`, ingen kø).

#### Scenario: innlogget bruker starter tråd
- **WHEN** en innlogget bruker sender inn en ny tråd i et rom
- **THEN** opprettes tråden med `status='published'` og vises umiddelbart

### Requirement: Global immutabel tråd-slug med trygg generering

Hver tråd SHALL ha en globalt unik, immutabel `slug`, og den kanoniske ruten
SHALL være `/stua/t/[slug]` (uavhengig av rom). Slug SHALL genereres fra
tittelen ved: translitterering (æ→ae, ø→oe, å→aa), lowercase, ikke-alfanumerisk
→ bindestrek, trim; ved tomt resultat SHALL fallback `traad-<kort-id>` brukes;
DERETTER SHALL unik-suffiks (`-2`, `-3`, …) sikre unikhet. Slug SHALL IKKE endres
ved senere tittel-redigering.

#### Scenario: tittel med bare emoji
- **WHEN** en tråd opprettes med en tittel som normaliserer til tom streng
- **THEN** får tråden en `traad-<kort-id>`-slug som er unik

#### Scenario: flytting bevarer lenke
- **WHEN** en tråd flyttes til et annet rom
- **THEN** er `/stua/t/[slug]` fortsatt gyldig og peker til samme tråd

### Requirement: Nyeste aktivitet-sortering via last_activity_at

Trådlister SHALL sorteres etter `last_activity_at` (nyeste øverst). `last_activity_at`
SHALL oppdateres av skrive-actions ved nytt svar (ikke via subquery per rad).

#### Scenario: nytt svar løfter tråden
- **WHEN** et nytt svar legges til en tråd
- **THEN** oppdateres trådens `last_activity_at` til nå, og tråden vises øverst
  i rommets trådliste

### Requirement: Bruker- og admin-moderering

En innlogget bruker SHALL kunne redigere og flytte SINE EGNE tråder, og slette
en egen tråd KUN når den er tom (`reply_count = 0`). Admin (`isAdmin()`, fail
closed) SHALL kunne skjule, slette (også besvarte tråder), redigere, flytte og
anonymisere tråder og innlegg. Anonymisering SHALL settes ved `author_id = NULL`
(forfatter faller til E4 stormtrooper-fallback), ikke via et eget navnefelt.
Enhver moderering-/skrive-action SHALL verifisere auth (og for admin-handlinger
`isAdmin()`) FØR skriving.

#### Scenario: bruker sletter besvart tråd nektes
- **WHEN** en bruker forsøker å slette egen tråd med `reply_count > 0`
- **THEN** nektes handlingen (kun admin kan slette besvarte tråder)

#### Scenario: admin anonymiserer innlegg
- **WHEN** admin anonymiserer et innlegg
- **THEN** settes `author_id = NULL` og innlegget vises med stormtrooper-navn

### Requirement: Trådstatus er autoritativ for synlighet

Når en TRÅD har `status = 'hidden'`, SHALL hele tråden inkludert alle innlegg
skjules i lese-ruten. Post-status SHALL kun styre synlighet for enkeltinnlegg
innad i en synlig tråd. Normal moderering SHALL bruke soft-hide
(`status='hidden'`); hard-delete (CASCADE thread→posts) SHALL kun skje ved
bevisst sletting.

#### Scenario: skjult tråd er usynlig
- **WHEN** en tråd settes til `status='hidden'`
- **THEN** vises verken tråden eller dens innlegg i noen lese-rute for vanlige
  brukere

### Requirement: Blogg-rom med lazy, race-sikret auto-tråd

Bloggposter SHALL kobles til en Stua-tråd i Blogg-rommet via `source_slug`
(bloggpostens slug). Tråden SHALL opprettes LAZY — først når en innlogget bruker
faktisk skriver det første innlegget via «start diskusjonen»-flyten. Opprettelsen
SHALL være race-sikret: `INSERT ... ON CONFLICT (source_slug) DO NOTHING`
etterfulgt av re-select, slik at samtidige forsøk havner i samme tråd uten rå
feil. «Diskuter i Stua»-lenken fra en bloggpost SHALL: for innlogget →
eksisterende tråd redirecte dit, ellers vise forhåndsutfylt skjema; for utlogget
→ `/logg-inn?next=`.

#### Scenario: samtidig lazy-opprettelse
- **WHEN** to innloggede brukere sender «start diskusjonen» for samme bloggpost
  samtidig
- **THEN** opprettes nøyaktig én tråd, og begge havner i den samme tråden

### Requirement: Forside-StuaPreview lekker ikke bak innloggings-muren

Forsidens Stua-forhåndsvisning SHALL bruke to separate datafunksjoner: én som
kun returnerer aggregat (antall rom/tråder) for utloggede, og én som returnerer
trådtitler KUN for innloggede. Trådtitler og innlegg SHALL aldri vises til
utloggede.

#### Scenario: utlogget forside
- **WHEN** en utlogget bruker ser forsiden
- **THEN** vises kun antall/«logg inn for å se», aldri trådtitler eller innhold


