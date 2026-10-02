# E6 – Stua: design (hvorfor / avveininger)

Utdyper proposal.md. Kilde: GRIM `mandate-e6-stua.md` (Geirs discovery-svar
2026-09-19, Hugin-gransket to runder). Fanger tekniske valg + de tre gjenstående
åpne valgene som IKKE rører grunn-skjema.

## D1 – Build vs buy: bygg selv (avgjort)

Tinget (Munin + Opus + Hugin/Gemini) konkluderte uavhengig. Geirs tre sterkeste
krav — eie selv, zine-estetikk uten kompromiss, liten/gratis server uten ny
Docker-last — peker alle mot bygg selv oppå Next+Supabase+Drizzle. Buy
(Discourse/Flarum/NodeBB) = SSO-lim mot Supabase + fremmed DB + evig
tema-kamp. Lavtrafikk-premisset («aldri mye brukt, mest support») fjerner de
dyre forum-bitene (anti-spam i skala, sanntidsvarsler, fulltekstsøk).

## D2 – Lukket tilgang: RLS-implikasjon

Hele Stua bak innlogging (lese OG skrive). Dette former RLS:
- **`stua_rooms` SELECT:** kun `authenticated` (ikke `anon`). Rom-metadata er
  ikke hemmelig, men lukket-prinsippet holder alt bak døra.
- **`stua_threads` / `stua_posts` SELECT:** `authenticated` OG `status='published'`
  (tråd) / synlig via tråd. Anon får ingenting.
- **revoke insert/update/delete/truncate** fra anon+authenticated (E5-lærdom:
  eldre Supabase-prosjekt har default-grants, truncate-hull). All skriving via
  Drizzle server-connection (bypass, bevist i E5).
- **Lekkasje-vakt:** forsidens StuaPreview + evt. fremtidig RSS må ALDRI vise
  trådtitler/innhold til utloggede. Løst med to datafunksjoner (D8).

## D3 – Datamodell: tre tabeller

**`stua_rooms`** (admin-styrt, seedet):
- `id uuid` PK, `slug text` UNIQUE, `name text` NOT NULL, `description text`
  NULL, `sort_order int` DEFAULT 0, `created_at`.
- Seed: Geish.no, Reik.no, Prat, Annet, Blogg (sort_order styrer visning).
- Ingen bruker-skriving → ingen skrive-policy.

**`stua_threads`**:
- `id uuid` PK, `room_id uuid` FK→rooms (ON DELETE RESTRICT — ikke slett rom med
  tråder utilsiktet), `author_id uuid` FK→auth.users ON DELETE SET NULL,
  `title text` NOT NULL (trim-CHECK 1–160),
  `slug text` NOT NULL UNIQUE (GLOBALT unik, immutabel — kanonisk rute
  `/stua/t/[slug]`, room-agnostisk oppslag),
  `source_slug text` NULL UNIQUE (bloggpost-slug for blogg-tråder; lazy
  auto-kobling; UNIQUE håndhever én tråd per post),
  `last_activity_at timestamptz NOT NULL DEFAULT now()` (denormalisert — settes
  av skrive-actions ved nytt svar; driver «nyeste aktivitet»-sortering, unngår
  N+1 og subquery-max),
  `reply_count int NOT NULL DEFAULT 0` (antall svar UTOVER åpningsinnlegget;
  brukes til «tom tråd»-sjekk for bruker-sletting uten count-query),
  `status text NOT NULL DEFAULT 'published'` CHECK(published/hidden),
  `created_at`, `updated_at`.

**`stua_posts`**:
- `id uuid` PK, `thread_id uuid` FK→threads ON DELETE CASCADE, `author_id uuid`
  FK→auth.users ON DELETE SET NULL (= anonymisering), `body text` NOT NULL
  (trim-CHECK 1–10000), `status text NOT NULL DEFAULT 'published'`
  CHECK(published/hidden), `created_at`, `updated_at`.
- **Åpningsinnlegg = første post-rad** (ikke duplisert felt på thread). Ett
  kodesti for alt innhold (sitat/rediger/skjul/forfatter-visning).

## D4 – Slug: global unik, immutabel, trygg generering

- **Globalt unik** (ikke per-rom): blogg må peke entydig, og trådflytting gjør
  per-rom-unikhet tvetydig. Kanonisk rute `/stua/t/[slug]`.
- **Immutabel:** slug settes ved opprettelse, endres ALDRI ved tittel-endring
  (ellers brekker lenker).
- **Trygg slugify (MÅ):** translitterering (æ→ae, ø→oe, å→aa), lowercase, fjern
  ikke-alfanumerisk → bindestrek, trim. Tom resultat (tittel kun emoji/tegn) →
  fallback `traad-` + kort id. DERETTER unik-suffiks-sjekk (`-2`, `-3`) mot
  eksisterende slugs. Rekkefølge: normaliser → fallback-hvis-tom → unik-suffiks.

## D5 – Tillitsmodell + moderering

- **Skrive** (tråd/svar/rediger/flytt/slett) krever `getUser()`. Uinnlogget → nekt.
- **Publiseres umiddelbart**, ingen kø (innlogget = betrodd, ulikt E5-anonyme).
- **Trådens status er AUTORITATIV for synlighet:** admin skjuler en TRÅD
  (`status='hidden'`) → hele tråden inkl. alle innlegg skjules i lese-ruten.
  Post-status er kun for enkeltinnlegg-moderering innad i en synlig tråd.
- **Cascade er unntaket:** normal moderering = soft-hide (`status='hidden'`).
  Hard-delete (thread→posts CASCADE) kun ved bevisst sletting (bruker på tom
  tråd, eller admin på hva som helst).
- **Bruker-sletting:** kun egen tråd med `reply_count = 0` (tom). Server-action
  sjekker eierskap + reply_count før delete.
- **Anonymisering (admin):** `UPDATE stua_posts SET author_id = NULL` →
  forfatter faller til stormtrooper-fallback (E4 `displayNameFor`). Admin kan
  også redigere body. Ingen eget «anonymt navn»-felt.

## D6 – Lazy blogg-tråd (race-sikret)

«Diskuter i Stua» på en bloggpost (innlogget):
1. Slå opp `stua_threads WHERE source_slug = <bloggslug>`.
2. Finnes → redirect til `/stua/t/[slug]`.
3. Finnes ikke → «start diskusjonen»-skjema (forhåndsutfylt trådtittel =
   posttittel). Ved submit: `INSERT ... ON CONFLICT (source_slug) DO NOTHING`,
   så `SELECT ... WHERE source_slug = ...` for å hente den vinnende raden (egen
   eller den andres ved samtidig klikk). Begge havner i SAMME tråd, ingen rå feil.
- Utlogget som klikker → `/logg-inn?next=<sti>`.

## D7 – E6 rører E2 (avgjort — rydd bort dødt felt)

Den manuelle `stua_thread`-frontmatteren ERSTATTES av automatisk `source_slug`-
oppslag. E6 endrer E2-blog-koden:
- «Diskuter i Stua»-lenken i blog-motoren: fra å lese frontmatter-feltet til å
  route mot `/stua`-oppslag på bloggpost-slug (via D6-flyt).
- Fjern `stua_thread` fra frontmatter-zod-skjemaet + fra hello-world.mdx.
- Verifiser at bloggen fortsatt bygger etter fjerning. Én-sannhetskilde.

## D8 – StuaPreview: to datafunksjoner (ikke if-flagg)

- `getStuaPublicStats()` — kun aggregat (antall rom, antall tråder). Trygt for
  utloggede. Forsiden viser dette + «Logg inn for å se».
- `getStuaRecentThreads()` — trådtitler/nyeste. KUN kalt for innloggede.
- Titler behandles som privat info (bak innloggings-muren). Ingen if-flagg som
  kan feilaktig lekke — to separate funksjoner, member-varianten kalles aldri
  utlogget.

## Avgjorte valg (Geir 2026-09-26 — tidligere åpne)

1. **Rediger eget innlegg: FRITT.** Ingen tidsvindu. Lavtrafikk, innloggede folk
   man kjenner, og admin kan alltid overstyre. Forkastet: tidsvindu — ekstra
   tilstand som bare skaper spørsmålet «hvorfor får jeg ikke redigere?».
   *Implementasjon stemmer: ingen tidssjekk i rediger-action.*
2. **Trådlås: 1.1, ikke 1.0.** Låsing er et konfliktverktøy for konflikter som
   ikke finnes i en lukket stue med venner og kjente brukere. Forkastet: ta
   `locked`-kolonnen «siden den er billig» — scope-disiplin veier tyngre.
   *Implementasjon stemmer: ingen `locked`-kolonne i `src/db/schema.ts`.*
3. **StuaPreview til utloggede: VIS ANTALL.** Et tall viser at Stua lever og
   inviterer til innlogging; titler er selv privat info og vises aldri utlogget.
   Antallet SKAL være globale totaler for hele Stua — aldri per rom, som ville
   avslørt hvor og når det er aktivitet (Hugin 2026-09-26).
   *Implementasjon stemmer: `getStuaPublicStats()` gir aggregat server-side i
   ISR-HTML; titler hentes av client-boundary bak sesjonssjekk.*

## Ikke-mål (fase 1)

Sitering, @-nevning, e-postvarsel, PM, avatarer, fulltekstsøk, paginering,
reaksjoner, rate-limiting utover innloggings-vern, brukeropprettede rom. Alle
Stua 1.1, kun ved reelt behov.
