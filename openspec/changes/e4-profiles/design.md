## Context

E0 la Drizzle-fundamentet uten å ta det i bruk: `drizzle.config.ts` (krever
`DIRECT_URL`, Session pooler port 5432, fordi drizzle-kit henger på Transaction
pooleren), `src/db/index.ts` (app-tilkobling via `DATABASE_URL`, Transaction
pooler port 6543, `prepare: false` — pgBouncer støtter ikke prepared
statements), og `src/db/schema.ts` som **tom placeholder** (`export {}`).
E3 la auth: `createClient()` (server, autoritativ `getUser()`), `useUser()`
(client, kosmetisk), og en `/konto`-side som i dag bare viser «logget inn som
<e-post>» + logg ut.

**Autoritativ kilde:** Supabase' offisielle mønster for `profiles`-tabell
knyttet til `auth.users` med `handle_new_user()`-trigger og RLS, tilpasset at
**vi leser/skriver domenedata via Drizzle, ikke via Supabase JS/PostgREST**
(project-foundation-regelen). Det gir en vri på standardoppskriften som må
forstås (D6).

**Låst av mandatet:**
- Første ekte tabell → oppsettet skal være riktig og gjenbrukbart for E5/E6.
- `profiles` 1:1 med `auth.users`, med visningsnavn (påkrevd) + bio (valgfri,
  offentlig).
- RLS: alle leser, kun eier endrer — policyene skrevet eksplisitt.
- `/konto` utvides til vis + rediger. Norsk copy via `t()`.
- Domenedata via Drizzle; Supabase JS reservert for auth/realtime/storage.
- Bio er offentlig — UI må si det.
- Zine-designsystem, ingen nye avhengigheter.

**Statisk-rendering-premiss (arv fra E2/E3):** forside/blogg/manifest er
statiske; `/konto` er allerede `force-dynamic`. E4 rører kun `/konto` — ingen
statisk rute gjøres dynamisk.

## Goals / Non-Goals

**Goals:**
- Én `profiles`-rad per innlogget bruker, auto-opprettet, aldri manglende.
- `/konto` viser eget visningsnavn + bio og lar bruker redigere begge, med
  synlig personvern-merknad om at bio er offentlig.
- Eier kan endre kun egen profil — håndhevet i server action (autoritativt) OG
  i RLS (dybde-forsvar for anon-stien).
- Alle kan lese visningsnavn/bio (klart for E5/E6).
- Reproduserbar, committet migrasjon + versjonert RLS/trigger-SQL som E5/E6
  kopierer.
- `tsc`/`lint`/`build` rent; statiske ruter uendret.

**Non-Goals:**
- Gjestebok (E5), Stua (E6), avatar-opplasting, offentlige profilsider.
- Admin/moderering-rollemodell (utover evt. billig krok-punkt).
- RLS-håndhevet Drizzle-tilkobling / custom Postgres-roller.
- Engelsk locale.

## Decisions

### D1. `profiles`-skjema: 1:1 med `auth.users`, PK = FK

**Valg:** Drizzle `pgTable("profiles", ...)`:

| Kolonne | Type | Regler |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, FK → `auth.users(id)` `ON DELETE CASCADE` |
| `display_name` | `text` | `NOT NULL`, `CHECK (char_length between 2 and 40)` |
| `bio` | `text` | NULL tillatt, `CHECK (char_length ≤ 300)` |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()`, holdes fersk (D7) |

**Hvorfor PK = FK (ikke egen `user_id`-kolonne):** profilen er en 1:1-utvidelse
av brukeren. `id` som både PK og FK til `auth.users(id)` gjør 1:1 strukturelt
umulig å bryte (ingen dobbel-profil), gir enkle joins, og matcher Supabase'
kanoniske mønster. `ON DELETE CASCADE` betyr at sletting av en Supabase-bruker
tar profilen med seg — ingen foreldreløse rader.

**Merk (Drizzle + `auth`-skjema):** `auth.users` ligger i Postgres-skjemaet
`auth`, ikke `public`. Drizzle må referere FK-en på tvers av skjema. To
alternativer: (a) deklarer en minimal `authUsers = pgSchema("auth").table(...)`
kun for FK-referansen, eller (b) la Drizzle lage tabellen uten FK-en og legg
FK-constrainten i den håndskrevne SQL-en (D3) sammen med RLS/trigger. **Valg:
(a)** — FK-en hører til datamodellen og bør synes i `schema.ts`; kun `id`-
kolonnen på `auth.users` deklareres (ingen forsøk på å eie det skjemaet).

**Alternativ vurdert:** separat `bigserial`-PK + egen `user_id uuid UNIQUE FK`.
Mer «vanlig», men åpner for 1:N ved uhell og gir en meningsløs ekstra nøkkel for
en ren 1:1-utvidelse. Avvist.

### D2. Auto-opprettelse: Postgres-trigger (anbefalt) vs. app-kode

**Valg: Postgres-trigger.** En `SECURITY DEFINER`-funksjon på `auth.users`:

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- default: e-postens lokaldel, trimmet til gyldig lengde; fallback "gjest"
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'gjest')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Hvorfor trigger, ikke app-kode:**
- **Garanti uansett inngangsrute.** Brukeren opprettes av Supabase Auth i det
  magic-linken bekreftes — det finnes ikke ett app-punkt vi kontrollerer der
  «første innlogging» skjer (callbacken bytter bare code mot sesjon). En trigger
  fanger *alle* nye brukere atomisk; app-kode måtte kjørt en «upsert profil hvis
  mangler» på hver beskyttet rute for å være like trygg.
- **Ingen race / ingen «profil mangler»-grein** i lesestier. E5/E6 kan anta at
  en innlogget bruker *har* en profil.
- **Matcher Supabase' dokumenterte mønster** → feilsøking 1:1 mot deres docs.

**Trade-off / kostnad:** trigger + funksjon lever som **SQL**, ikke i Drizzles
TS-modell → må forfattes for hånd og committes (D3). `SECURITY DEFINER` +
`set search_path = ''` er påkrevd sikkerhetshygiene (ellers kan søkesti-
manipulasjon utnyttes) og må gjøres nøyaktig. Default-navnet (e-post-lokaldel)
kan kollidere eller være stygt — derfor lar D4 brukeren endre det straks, og
`/konto` nudger til å sette et ekte navn.

**Alternativ (app-kode-upsert):** i en server action / `getProfile()` gjøre
`insert ... on conflict do nothing` første gang. Enklere å resonnere om i TS,
ingen `auth`-skjema-trigger. Men: må ligge i *hver* vei som trenger en profil,
og en glemt vei = manglende rad. **Avvist som primærmønster**, men beholdes som
defensiv `on conflict`-sikring i `getProfile()` (billig belte-og-bukseseler
hvis triggeren en gang mangler i et miljø).

> **Åpent for Geir:** trigger er anbefalt. Hvis Geir vil holde *all* logikk i
> app-koden (unngå SQL-triggere helt), faller vi tilbake på app-upsert — men da
> mister vi atomisk-garantien. Anbefaling står: trigger.

### D3. Hvor migrasjon + RLS + trigger-SQL bor

**Valg:** Delt kilde, alt versjonert i repoet, ingen dashboard-klikking:
1. **Tabell-DDL** eies av Drizzle: `schema.ts` → `drizzle-kit generate` →
   `drizzle/00XX_<navn>.sql` + `drizzle/meta/`-snapshot. Committes.
2. **RLS-policyer, trigger-funksjon og FK-en mot `auth.users`** (det Drizzle
   ikke genererer) skrives for hånd i `drizzle/rls/profiles.sql` og committes
   ved siden av. Filen er idempotent (`drop policy if exists` / `create or
   replace function`) så den trygt kan kjøres på nytt.

**Rekkefølge ved anvendelse (dokumentert i tasks):** kjør Drizzle-migrasjonen
(tabellen) først, deretter `drizzle/rls/profiles.sql` (policyer + trigger).
Begge kjøres via `psql`/Supabase SQL-editor mot `DIRECT_URL`, eller
`drizzle-kit migrate`. **Ingen** RLS/trigger opprettes ved klikking i
dashboardet — hele sikkerhetsflaten er lesbar i git.

**Hvorfor todelt fremfor alt-i-Drizzle eller alt-i-`supabase/migrations`:**
- Drizzle-kit genererer *ikke* RLS/policyer/triggere → noe SQL må uansett være
  håndskrevet. Å presse RLS inn i Drizzles `sql`-operator gir dårlig lesbarhet
  for nettopp den delen som er sikkerhetskritisk.
- Å flytte *alt* (også tabellen) til `supabase/migrations` ville forlatt Drizzle-
  kit-verktøyet E0 valgte, og gitt to sannhetskilder for skjemaet. Behold
  Drizzle for DDL; håndskriv kun det Drizzle ikke kan.
- `drizzle/rls/`-plasseringen holder den håndskrevne SQL-en *ved siden av* de
  genererte migrasjonene, så E5/E6 ser hele mønsteret ett sted.

**Konvensjon fastsatt for E5/E6:** ny tabell = (1) legg i `schema.ts`, (2)
`db:generate`, commit migrasjon, (3) håndskriv `drizzle/rls/<tabell>.sql` med
`enable row level security` + policyer (+ evt. trigger), commit.

> **Åpent for Geir:** alternativ plassering er `supabase/migrations/` (nærmere
> Supabase-CLI-konvensjon). Anbefaling: `drizzle/rls/` for å holde alt DB-relatert
> under Drizzle-paraplyen prosjektet allerede bruker. Lett å flytte senere.

### D4. `display_name`: påkrevd, lengdebegrenset, **ikke unik** (v1)

**Valg:**
- **Påkrevd** (`NOT NULL`). En profil uten navn er meningsløs for gjestebok/Stua.
- **Lengde 2–40 tegn** (`CHECK` i DB + validering i server action + `maxlength`
  i input). Trimmes for whitespace.
- **Ikke unik i v1.** Ingen `UNIQUE`-constraint på `display_name`.

**Hvorfor ikke unik (nå):**
- Unikhet tvinger inn en feilsti i både auto-opprettelse (default-navn fra
  e-post kan kollidere → triggeren måtte suffiksere) og redigering («navnet er
  opptatt»). Det er reell UX-friksjon for en lavmælt zine med få brukere.
- Identiteten er *raden* (`id`), ikke navnet. Gjestebok/Stua fester bidrag til
  `id`; visningsnavn er kun etikett.
- Case-insensitiv unikhet (så «Geir» ≠ «geir» ikke begge går) krever
  `citext`/funksjonell unik-indeks — mer maskineri enn v1 fortjener.

**Trade-off:** to brukere kan hete «Geir» → mild forvirring / teoretisk
etterligning i E6. Aksept for v1; hvis det blir et problem legger en senere
change en case-insensitiv unik-indeks (additivt, ingen skjemabrudd).

> **Åpent for Geir (viktig valg):** vil du ha **unike** visningsnavn fra start
> (mer «riktig» for et forum, men mer friksjon), eller ikke-unike (enklere,
> anbefalt for v1)? Standardvalget i dette forslaget er **ikke unik**.

### D5. Profil-hjelpere: server-autoritativ + kosmetisk client — uten å tyngre `useUser()`

**Valg (mønsteret E5/E6 arver):**
- **Server (autoritativ):** `getProfile(userId: string)` i
  `src/lib/profile/get-profile.ts` — leser `profiles` via **Drizzle**
  (`db.select().from(profiles).where(eq(profiles.id, userId))`). Returnerer
  `Profile | null`. Brukes av `/konto` og av E5/E6 for å slå opp visningsnavn.
  Inneholder defensiv `on conflict do nothing`-opprettelse hvis rad mangler
  (belte-og-bukseseler mot manglende trigger — se D2).
- **Client (kosmetisk):** `useUser()` holdes **uendret** (ren auth-tilstand).
  Profil-i-client løses med en tynn separat `useProfile()` i
  `src/lib/profile/use-profile.ts` *kun hvis* et client-behov finnes i E4. I E4
  viser `/konto` profilen server-side (siden er allerede dynamisk), så **client-
  hooken bygges bare hvis skjemaet trenger optimistisk client-tilstand**;
  ellers utsettes den til E5/E6 faktisk trenger visningsnavn i en client-komponent.

**Hvorfor ikke utvide `useUser()` til `{ user, profile, loading }`:**
- Det ville tvunget *hvert* eksisterende kall (AuthNav) til å betale for en
  profil-fetch det ikke bruker, og blandet auth-tilstand (Supabase JS) med
  domenedata (som skal gå via Drizzle/server, ikke Supabase JS client-side).
- Å hente profil client-side ville dessuten måtte gå via Supabase JS/PostgREST
  (den eneste klienten i browseren), som bryter «domenedata via Drizzle»-regelen
  med mindre det pakkes i et route handler/server action-kall. Derfor: profil-
  lesing bor server-side som default; client-hjelper kun ved konkret behov, og
  den kaller da et internt endepunkt, ikke Supabase JS direkte.

**Regel notert for E5/E6:** visningsnavn hentes server-side via `getProfile()`
(eller en join) når du rendrer andres bidrag. Client-side visningsnavn kun for
*egen* innlogget bruker og kun kosmetisk.

> **Åpent for Geir:** minimal variant (kun `getProfile()` server-side, ingen
> client-hook i E4) er anbefalt — mindre kode, ingen client-fetch av domenedata.
> Client-hooken legges når E5/E6 trenger den.

### D6. Sikkerhet: server action håndhever eierskap; RLS er dybde-forsvar

**Dette er det viktigste å forstå.** To lag med hver sin rolle:

1. **Server action = den primære muren** (analogt til E3s page-guard).
   `updateProfile(formData)`:
   - `const { data: { user } } = await supabase.auth.getUser()` — utlogget →
     kast/redirect.
   - Valider + trim + lengdesjekk `display_name`/`bio`.
   - Skriv via **Drizzle**: `db.update(profiles).set({...}).where(eq(profiles.id,
     user.id))`. `where`-en på `user.id` er det som gjør at en bruker *bare* kan
     endre egen rad — Drizzle-tilkoblingen (DATABASE_URL) har full tilgang og
     **respekterer ikke RLS**.
   - `revalidatePath("/konto")`.
2. **RLS = dybde-forsvar for PostgREST/anon-stien.** `ENABLE ROW LEVEL SECURITY`
   + `SELECT USING (true)` + `UPDATE USING/WITH CHECK (auth.uid() = id)`.
   Beskytter tilfeller der data *ikke* går via server action + Drizzle: fremtidig
   client-side Supabase-lesing (E5/E6 kan lese offentlige navn via anon-nøkkel),
   Supabase realtime (E6-forum), og PostgREST direkte. Uten RLS ville anon-nøkkel
   gitt skrivetilgang.

**Hvorfor både-og (ikke bare RLS, ikke bare app):**
- Kun RLS ville ikke hjulpet: Drizzle-stien omgår den, så en bug i server
  action-`where` ville skrevet feil rad uansett RLS. Derfor må app-laget håndheve
  eierskap.
- Kun app-lag ville latt anon-nøkkelen (offentlig, i klienten) skrive fritt så
  snart E5/E6 introduserer *noen* client-side Supabase-tilgang. Mandatet krever
  RLS, og det er riktig som andre lag.

**Konsekvens for `SELECT USING (true)`:** visningsnavn *og bio* er lesbare for
hvem som helst med anon-nøkkelen. Det er bevisst (offentlig zine) — og grunnen
til at UI må si «bio vises offentlig» (D8). Ingen private felt legges i denne
tabellen.

### D7. `updated_at` holdes fersk via trigger (moddatetime)

**Valg:** en enkel `BEFORE UPDATE`-trigger setter `updated_at = now()` (Supabase
har `extensions.moddatetime`; ellers en to-linjers plpgsql-funksjon). Ligger i
`drizzle/rls/profiles.sql` sammen med resten.

**Hvorfor DB-trigger, ikke sette `updated_at` i server action:** garanterer at
*enhver* skrivevei (server action nå, evt. andre senere) oppdaterer feltet
konsistent — samme filosofi som D2. Billig og standard.

### D8. `/konto`-UI: vis + rediger, med synlig personvern-merknad

**Valg:** `/konto` (fortsatt `force-dynamic` server component) henter
`getProfile(user.id)` og rendrer:
- Uendret topp: «logget inn som <e-post>» (e-post er *ikke* i profiltabellen,
  kommer fra `auth.users` — og vises kun til eier, ikke offentlig).
- **`<ProfileForm>`** (client component): felt for `display_name` (påkrevd) og
  `bio` (valgfri, `<textarea>`, tegnteller mot 300). Submit → server action
  `updateProfile`. Suksess/feil vises inline i zine-stil.
- **Personvern-merknad** rett ved bio-feltet: en tydelig, lavmælt linje —
  «Dette vises offentlig. Skriv som om hvem som helst kan lese det, for det kan
  de.» (utkast, Geirs ord til slutt).
- All copy fra ny `profil`-slice i `no.ts`.

**Hvorfor client-form + server action (ikke ren `<form action={serverAction}>`
uten JS):** server action kan brukes progressivt — `<form action={updateProfile}>`
funker uten JS, og client-komponenten legger kun tegnteller/inline-feil oppå.
Matcher E3s «funker uten JS»-linje (logg ut-form) og E3 D1s åpning for server
actions i E4.

**Zine-stil:** gjenbruker `/konto`s eksisterende `page.module.css`-språk
(dashed border, stempel-rød aksent, mono-labels). Ingen nye avhengigheter,
ingen border-radius/blur/gradient/emoji.

## Risks / Trade-offs

- **[Risk] RLS ser overflødig ut fordi Drizzle omgår den** → Mitigation: D6
  dokumenterer eksplisitt hva som beskytter hva. RLS er andre lag for anon/
  realtime-stien E5/E6 åpner; server action er primærmuren. Skrevet ned så
  ingen senere «forenkler» bort RLS i tro at app-laget holder.
- **[Risk] `handle_new_user`-trigger med `SECURITY DEFINER` feilkonfigurert** →
  `set search_path = ''` er påkrevd og med i D2-SQL-en; verifiseres i review. Feil
  her er en kjent Postgres-privilegie-fotpistol.
- **[Risk] Trigger finnes ikke i et miljø (glemt å kjøre RLS-SQL)** → innlogging
  gir bruker uten profil → lesestier krasjer. Mitigation: `getProfile()` har
  defensiv `on conflict do nothing`-opprettelse (D5); tasks krever eksplisitt
  verifisering av at RLS-SQL er kjørt i hvert miljø.
- **[Risk] Ikke-unike visningsnavn → forvirring/etterligning i E6** → Aksept for
  v1 (D4); additiv unik-indeks mulig senere uten skjemabrudd. Flagget som åpent
  valg for Geir.
- **[Risk] Bio er offentlig og bruker deler for mye** → Mitigation: tydelig
  personvern-merknad ved feltet (D8); lengdegrense 300; ingen private felt i
  tabellen så «offentlig» er sant for *alt* her.
- **[Risk] drizzle-kit henger / feil pooler-port** → kjent E0-fotpistol:
  `drizzle.config.ts` krever `DIRECT_URL` (5432), appen bruker `DATABASE_URL`
  (6543, `prepare:false`). Tasks minner om begge.
- **[Risk] Å røre `auth`-skjemaet fra Drizzle** → vi deklarerer kun `auth.users.id`
  for FK-referanse (D1), eier ikke skjemaet, genererer ingen DDL mot `auth`.
  Verifiseres i den genererte migrasjonen (skal ikke inneholde `create schema
  auth` e.l.).
- **[Risk] Gratis-plan pauser prosjektet** → E4 legger ingen jobber/cron;
  eksisterende keep-alive dekker. Ingen ny driftslast.

## Migration Plan

Brownfield, additivt. Sekvens:

1. `schema.ts`: definer `profiles` (+ minimal `auth.users`-referanse for FK).
2. `npm run db:generate` → inspiser generert `drizzle/00XX_*.sql`, commit.
3. Håndskriv `drizzle/rls/profiles.sql`: FK mot `auth.users` (hvis ikke i
   generert migrasjon), `enable row level security`, SELECT/UPDATE-policyer,
   `handle_new_user()` + `on_auth_user_created`-trigger, `updated_at`-trigger.
   Idempotent. Commit.
4. `src/lib/profile/get-profile.ts` (Drizzle-lesing + defensiv opprettelse).
5. `src/app/konto/actions.ts` (`updateProfile` server action, Drizzle-skriving,
   `getUser()`-guard, validering, `revalidatePath`).
6. `profil`-slice i `no.ts` (utkast-copy, inkl. personvern-merknad).
7. `ProfileForm` (client) + utvid `konto/page.tsx` + CSS.
8. Anvend mot Supabase: kjør migrasjon (tabell) + `drizzle/rls/profiles.sql`
   (policyer/trigger) mot `DIRECT_URL`. Verifiser i review.
9. Verifisering: opprett testbruker → profil auto-opprettet; rediger navn/bio →
   persisterer, `updated_at` bump; forsøk å endre annens rad via anon-nøkkel →
   nektes (RLS); les profil anonymt → tillatt. `tsc`/`lint`/`build` rent;
   statiske ruter uendret.

**Roll-back:** `git revert` av implementeringscommiten fjerner app-koden. DB:
`drop trigger`/`drop function`/`drop table profiles` (egen ned-SQL). Siden ingen
ekte brukerdata finnes ennå (kun test), er tap ufarlig; men ned-SQL noteres i
tasks for ryddighet.

## Open Questions

Mandatets fire åpne spørsmål er adressert: auto-opprettelse (D2: trigger),
`display_name` påkrevd/unik/default (D1+D4), hvor RLS/trigger-SQL bor (D3),
skrivevei (D8: server action). Gjenstående valg **Geir må bekrefte**:

- **D4 — unike visningsnavn?** Forslaget: **ikke unik** i v1. Geir kan overstyre
  til unik (mer forum-riktig, mer friksjon).
- **D2 — trigger vs. ren app-kode.** Forslaget: **trigger** (m/ defensiv app-
  fallback). Geir kan velge ren app-kode hvis han vil unngå SQL-triggere.
- **D3 — RLS/trigger-SQL i `drizzle/rls/` vs. `supabase/migrations/`.** Forslaget:
  `drizzle/rls/`. Kosmetisk/organisatorisk, lett å flytte.
- **D5 — bygge client-`useProfile()` nå eller vente?** Forslaget: **vente** til
  E5/E6 trenger det; E4 klarer seg med server-side `getProfile()`.
- **Default-visningsnavn** fra e-postens lokaldel (D2): ok, eller foretrekker Geir
  tomt/«gjest» + tvungen navnsetting ved første `/konto`-besøk? Forslaget bruker
  lokaldel som utgangspunkt brukeren straks kan endre.
