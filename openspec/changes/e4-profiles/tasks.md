## 1. Forutsetninger (env — fra E0, ikke nye variabler)

> Ingen nye env-vars. Migrasjoner krever at E0-variablene er satt i `.env.local`.

- [ ] 1.1 `DATABASE_URL` satt (Transaction pooler, port 6543) — appen bruker denne (`prepare:false`).
- [ ] 1.2 `DIRECT_URL` satt (Session pooler, port 5432) — `drizzle-kit` krever denne (henger ellers).

## 2. Drizzle-skjema: profiles

- [ ] 2.1 `src/db/schema.ts`: definer `profiles` (`pgTable`): `id uuid` PK, `display_name text NOT NULL`, `bio text`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`. Lengde-`CHECK` på display_name (2–40) og bio (≤300).
- [ ] 2.2 FK `id → auth.users(id) ON DELETE CASCADE` via minimal `pgSchema("auth").table` kun for `id`-kolonnen (design D1) — ingen DDL som eier `auth`-skjemaet.
- [ ] 2.3 Eksporter `Profile`-typen (`InferSelectModel`) for gjenbruk i hjelpere/E5/E6.

## 3. Migrasjon + RLS/trigger-SQL (versjonert)

- [ ] 3.1 `npm run db:generate` → inspiser generert `drizzle/00XX_*.sql`; verifiser at den IKKE oppretter/endrer `auth`-skjemaet. Commit migrasjon + `drizzle/meta/`.
- [ ] 3.2 Håndskriv `drizzle/rls/profiles.sql` (idempotent): FK mot `auth.users` (hvis ikke i generert migrasjon), `enable row level security`, SELECT-policy `USING (true)`, UPDATE-policy `USING/WITH CHECK (auth.uid() = id)`. Ingen client INSERT/DELETE-policy.
- [ ] 3.3 I samme SQL: `handle_new_user()` (`SECURITY DEFINER`, `set search_path = ''`) + `on_auth_user_created` `AFTER INSERT`-trigger på `auth.users`; default `display_name` fra e-postens lokaldel med fallback.
- [ ] 3.4 I samme SQL: `updated_at`-`BEFORE UPDATE`-trigger (moddatetime eller to-linjers plpgsql).
- [ ] 3.5 Skriv en kort ned-SQL (drop trigger/function/table) som kommentar/sidecar for roll-back.

## 4. Anvend mot Supabase (utenfor repoet — dokumenteres i PR)

> Kjøres mot `DIRECT_URL` (Session pooler). Ingen dashboard-klikking for policyer.

- [ ] 4.1 Kjør tabell-migrasjonen (`drizzle-kit migrate`/`push` eller `psql`).
- [ ] 4.2 Kjør `drizzle/rls/profiles.sql`.
- [ ] 4.3 Verifiser i Supabase: RLS aktiv på `profiles`, policyene finnes, triggerne finnes.

## 5. Server-hjelper: getProfile

- [ ] 5.1 `src/lib/profile/get-profile.ts`: `getProfile(userId)` leser via Drizzle (`src/db`), returnerer `Profile | null`.
- [ ] 5.2 Defensiv `INSERT ... ON CONFLICT DO NOTHING`-opprettelse hvis rad mangler (sikkerhetsnett mot manglende trigger, design D2/D5).

## 6. Server action: updateProfile

- [ ] 6.1 `src/app/konto/actions.ts`: `"use server"`-action `updateProfile(formData)`.
- [ ] 6.2 `getUser()`-guard (utlogget → kast/redirect); valider + trim + lengdesjekk `display_name` (2–40) og `bio` (≤300).
- [ ] 6.3 Skriv via Drizzle: `db.update(profiles).set({...}).where(eq(profiles.id, user.id))` (eier-sjekk i `where`); `revalidatePath("/konto")`.

## 7. Copy: profil-slice i no.ts

- [ ] 7.1 Ny `profil`-slice i `src/content/locales/no.ts` (UTKAST — Geir godkjenner): heading, felt-labels (visningsnavn, bio), lagre-knapp, tegnteller-tekst, suksess/feil-meldinger.
- [ ] 7.2 Eksplisitt personvern-merknad ved bio: «dette vises offentlig» (Geirs ord til slutt).

## 8. UI: /konto vis + rediger

- [ ] 8.1 Utvid `src/app/konto/page.tsx`: hent `getProfile(user.id)`, vis e-post (kun eier) + visningsnavn + bio, rendre `ProfileForm`. Behold `force-dynamic` + `getUser()`-guard.
- [ ] 8.2 `src/app/konto/ProfileForm.tsx` (client): felt for display_name + bio (`<textarea>` m/ tegnteller), `<form action={updateProfile}>` (funker uten JS), inline suksess/feil. Personvern-merknad ved bio.
- [ ] 8.3 Utvid `src/app/konto/page.module.css` i zine-stil (gjenbruk eksisterende språk; ingen nye deps, ingen radius/blur/gradient/emoji).

## 9. Verifisering — lokal

> Krever kjørende dev-server + Supabase-konfig (seksjon 4) + testbruker.

- [ ] 9.1 `npx tsc --noEmit` og `npm run lint` rent.
- [ ] 9.2 `npm run build`: forside/blogg/manifest fortsatt statiske; `/konto` dynamisk; ingen utilsiktet dynamisk rute.
- [ ] 9.3 Ny testbruker (magic link) → `profiles`-rad auto-opprettet med default-navn.
- [ ] 9.4 `/konto`: rediger visningsnavn + bio → persisterer; `updated_at` bumpet; ny verdi vises etter reload.
- [ ] 9.5 Skjema uten JS (server action progressivt): innsending funker.
- [ ] 9.6 RLS: forsøk å endre annen brukers rad via anon-nøkkel/PostgREST → nektes. Les profil anonymt → tillatt.
- [ ] 9.7 Lengdegrenser: for kort navn / for lang bio → avvist (DB `CHECK` + app-validering).

## 10. Forbudsliste + sanity

- [ ] 10.1 Ingen nye npm-avhengigheter (`git diff package.json` tom).
- [ ] 10.2 Ingen Supabase JS-klient for profildata (lesing/skriving går via Drizzle); Supabase JS kun for `getUser()`.
- [ ] 10.3 Ingen hardkodet bruker-synlig copy — alt via `t()` (`profil`-slice).
- [ ] 10.4 Ingen Tailwind/shadcn, ingen border-radius > 0, ingen blur/gradient, ingen emoji-ikoner i profil-UI.
- [ ] 10.5 RLS/trigger finnes som committet SQL, ikke kun i dashboardet.
- [ ] 10.6 `useUser()` uendret (ren auth-tilstand).

## 11. Åpne valg som må bekreftes av Geir før implementering

- [ ] 11.1 Unike visningsnavn? (forslag: NEI i v1.)
- [ ] 11.2 Auto-opprettelse: trigger (forslag) vs. ren app-kode.
- [ ] 11.3 RLS-SQL-plassering: `drizzle/rls/` (forslag) vs. `supabase/migrations/`.
- [ ] 11.4 Client-`useProfile()` nå (forslag: vent til E5/E6).
- [ ] 11.5 Default-visningsnavn fra e-post-lokaldel (forslag) vs. tomt + tvungen navnsetting.
