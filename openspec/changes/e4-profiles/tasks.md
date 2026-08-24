## 1. Forutsetninger (env — fra E0, ikke nye variabler)

> Ingen nye env-vars. Migrasjoner krever at E0-variablene er satt i `.env.local`.

- [x] 1.1 `DATABASE_URL` satt (Transaction pooler, port 6543) — appen bruker denne (`prepare:false`).
- [x] 1.2 `DIRECT_URL` satt (Session pooler, port 5432) — `drizzle-kit` krever denne (henger ellers).

> GEIRS OVERSTYRING (D5): `display_name` er NULLABLE, ikke `NOT NULL`. Ferske
> profiler er navnløse (NULL) og navn avledes ALDRI fra e-post. `CHECK` gjelder
> kun når navn er satt (2–40). Auto-triggeren setter derfor bare `id`.

## 2. Drizzle-skjema: profiles

- [x] 2.1 `src/db/schema.ts`: `profiles` (`pgTable`): `id uuid` PK, `display_name text` (NULLABLE per D5), `bio text`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`. `CHECK` display_name (NULL eller 2–40) og bio (NULL eller ≤300).
- [x] 2.2 FK `id → auth.users(id) ON DELETE CASCADE` via minimal `pgSchema("auth").table` kun for `id`-kolonnen (design D1).
- [x] 2.3 Eksporter `Profile`-typen (`InferSelectModel`) for gjenbruk i hjelpere/E5/E6.

## 3. Migrasjon + RLS/trigger-SQL (versjonert)

- [x] 3.1 `npm run db:generate` → `drizzle/0000_tiresome_blizzard.sql`. Drizzle-kit emitter alltid `create table auth.users` (fordi FK-tabellen er deklarert i schema.ts) — den er MANUELT FJERNET fra migrasjonen (dokumentert i topp-kommentar); FK-en beholdes og treffer eksisterende Supabase-tabell. Migrasjon + `drizzle/meta/` committet.
- [x] 3.2 `drizzle/rls/profiles.sql` (idempotent): `enable row level security`, SELECT `USING (true)`, UPDATE `USING/WITH CHECK (auth.uid() = id)`. Ingen client INSERT/DELETE-policy.
- [x] 3.3 Samme SQL: `handle_new_user()` (`SECURITY DEFINER`, `set search_path = ''`) + `on_auth_user_created` `AFTER INSERT`. OVERSTYRT (D5): setter KUN `id`, INGEN default fra e-post — navnløs profil.
- [x] 3.4 Samme SQL: `set_updated_at()` + `profiles_set_updated_at` `BEFORE UPDATE`-trigger.
- [x] 3.5 Ned-SQL (drop trigger/function/policy/table) som kommentar nederst i filen.

## 4. Anvend mot Supabase (utenfor repoet — dokumenteres i PR)

> Kjøres mot `DIRECT_URL` (Session pooler). Ingen dashboard-klikking for policyer.

- [ ] 4.1 IKKE KJØRT (venter Geir/merge). Kjør tabell-migrasjonen mot `DIRECT_URL` — se PR-beskrivelse for eksakt kommando.
- [ ] 4.2 IKKE KJØRT. Kjør `drizzle/rls/profiles.sql` mot `DIRECT_URL`.
- [ ] 4.3 Verifiser i Supabase: RLS aktiv, policyer + triggere finnes.

## 5. Server-hjelper: getProfile

- [x] 5.1 `src/lib/profile/get-profile.ts`: `getProfile(userId)` leser via Drizzle, returnerer `Profile | null`.
- [x] 5.2 Defensiv `INSERT (id) ... ON CONFLICT DO NOTHING` hvis rad mangler (sikkerhetsnett, D2/D5) — setter ikke display_name.

## 6. Server action: updateProfile

- [x] 6.1 `src/app/konto/actions.ts`: `"use server"`-action `updateProfile(prevState, formData)` (useActionState-signatur).
- [x] 6.2 `getUser()`-guard (utlogget → feilstatus); zod-validering: trim, tomt → NULL (D5), display_name 2–40 når satt, bio ≤300.
- [x] 6.3 Skriv via Drizzle `where id = user.id`; `revalidatePath("/konto")`. PLUSS D1: ikke-blokkerende «navn i bruk»-oppslag (annen id) → advarsel, lagrer likevel.

## 7. Copy: profil-slice i no.ts

- [x] 7.1 Ny `profil`-slice i `src/content/locales/no.ts` (UTKAST — Geir godkjenner): heading, felt-labels (visningsnavn, bio), lagre-knapp, tegnteller-tekst, suksess/feil-meldinger.
- [x] 7.2 Eksplisitt personvern-merknad ved bio: «dette vises offentlig» (Geirs ord til slutt).

## 8. UI: /konto vis + rediger

- [x] 8.1 Utvid `src/app/konto/page.tsx`: hent `getProfile(user.id)`, vis e-post (kun eier) + visningsnavn + bio, rendre `ProfileForm`. Behold `force-dynamic` + `getUser()`-guard.
- [x] 8.2 `src/app/konto/ProfileForm.tsx` (client): felt for display_name + bio (`<textarea>` m/ tegnteller), `<form action={updateProfile}>` (funker uten JS), inline suksess/feil. Personvern-merknad ved bio.
- [x] 8.3 Utvid `src/app/konto/page.module.css` i zine-stil (gjenbruk eksisterende språk; ingen nye deps, ingen radius/blur/gradient/emoji).

## 9. Verifisering — lokal

> Krever kjørende dev-server + Supabase-konfig (seksjon 4) + testbruker.

- [x] 9.1 `npx tsc --noEmit` og `npm run lint` rent (verifisert).
- [x] 9.2 `npm run build` grønt: forside/blogg/manifest statiske; `/konto` dynamisk (ƒ); ingen utilsiktet dynamisk rute. (Sharp-fella slo ikke inn denne gang.)
- [ ] 9.3 IKKE VERIFISERT (krever kjørt migrasjon + testbruker). MERK D5: auto-opprettet rad er NAVNLØS (NULL), ikke default-navn.
- [ ] 9.4 IKKE VERIFISERT (krever DB). Kodesti klar.
- [ ] 9.5 IKKE VERIFISERT (krever DB). `<form action={formAction}>` funker uten JS.
- [ ] 9.6 IKKE VERIFISERT (krever DB).
- [ ] 9.7 IKKE VERIFISERT (krever DB). CHECK + zod på plass.

## 10. Forbudsliste + sanity

- [x] 10.1 Ingen nye npm-avhengigheter (`package.json` urørt).
- [x] 10.2 Ingen Supabase JS-klient for profildata (Drizzle); Supabase JS kun for `getUser()`.
- [x] 10.3 All bruker-synlig copy via `t()` (`profil`-slice).
- [x] 10.4 Ingen Tailwind/shadcn, ingen border-radius, ingen blur/gradient, ingen emoji i profil-UI.
- [x] 10.5 RLS/trigger som committet SQL (`drizzle/rls/profiles.sql`).
- [x] 10.6 `useUser()` urørt.

## 11. Åpne valg — AVGJORT AV GEIR (kveld 2026-08-24)

- [x] 11.1 Unike visningsnavn? NEI, fritt navn + ikke-blokkerende «i bruk»-advarsel (D1).
- [x] 11.2 Auto-opprettelse: trigger + app-sikkerhetsnett (D2).
- [x] 11.3 RLS-SQL-plassering: `drizzle/rls/` (D3).
- [x] 11.4 Client-`useProfile()`: NEI nå, server-side `getProfile()` (D4).
- [x] 11.5 Default-visningsnavn: TOMT (NULL), aldri fra e-post; /konto oppfordrer til navn (D5).
