## 1. Env + admin-identitet (D1)

- [ ] 1.1 Legg til `ADMIN_USER_ID` i `.env.example` (dokumentert: Supabase
  `auth.users`-UUID for Geir; verdien settes i `.env.local` + Vercel, aldri
  committet).
- [ ] 1.2 Sett `ADMIN_USER_ID` i `.env.local` på munin (Geirs auth-UUID — hentes
  fra den ene eksisterende profilraden / Supabase auth). Verifiser at det er
  riktig UUID.

## 2. isAdmin()-hjelper

- [ ] 2.1 `src/lib/admin/is-admin.ts`: server-side `isAdmin()` som henter
  `getUser()` og sammenligner `user.id === process.env.ADMIN_USER_ID`.
- [ ] 2.2 Fail closed: mangler `ADMIN_USER_ID` eller ingen bruker → returner
  `false`. Ingen unntak-kast som lekker konfig.
- [ ] 2.3 Enkel enhetsdekning / manuell verifisering: admin-UUID → true;
  annen UUID → false; utlogget → false; tom env → false.

## 3. /admin-tak + guard

- [ ] 3.1 `src/app/admin/page.tsx`: `force-dynamic`, `getUser()` + `isAdmin()`-
  guard. Ikke-admin → `notFound()` (404, lekker ikke innhold) — bekreft valg
  mot design (404 vs redirect).
- [ ] 3.2 Minimal admin-landingsside (zine-stil, gjenbruk tokens): overskrift +
  plass for senere paneler (E5/E6). Tom-tilstand-tekst via `t()`.
- [ ] 3.3 `src/app/admin/layout.tsx` (valgfritt hvis flere `/admin/*` ruter
  trengs allerede): felles guard/ramme så E5/E6 slipper å repetere guarden.

## 4. Moderering-mønster (dokumentasjon + minimal referanse)

- [ ] 4.1 Kort mønster-notat (i mandat/PR eller `openspec/`): moderering =
  server action bak `isAdmin()`-guard + progressiv `<form action>` +
  `revalidatePath`. E5 er første forbruker.
- [ ] 4.2 Ingen generisk moderering-motor bygges (bevisst — hver flate bringer
  egen tabell/panel).

## 5. Copy

- [ ] 5.1 `admin`-slice i `src/content/locales/no.ts` (UTKAST — Geir godkjenner):
  overskrift, tom-tilstand, «ikke autorisert»-tekst.
- [ ] 5.2 All admin-synlig copy via `t()` (ingen hardkodet tekst).

## 6. Verifisering

- [ ] 6.1 `npx tsc --noEmit` og `npm run lint` rent.
- [ ] 6.2 `npm run build` grønt: `/admin` dynamisk (ƒ), ikke utilsiktet statisk.
- [ ] 6.3 Admin-bruker (Geir innlogget) når `/admin` (200).
- [ ] 6.4 Innlogget ikke-admin nektes `/admin` (404/redirect, ingen lekkasje).
- [ ] 6.5 Utlogget nektes `/admin`.
- [ ] 6.6 Tom `ADMIN_USER_ID` → ingen når `/admin` (fail closed verifisert).

## 7. Forbudsliste + sanity

- [ ] 7.1 Ingen nye npm-avhengigheter.
- [ ] 7.2 Ingen DB-migrasjon / role-kolonne (D1: env-basert).
- [ ] 7.3 Ingen admin-sjekk i middleware eller kun i RLS — guarden bor i
  server-laget (page + actions).
- [ ] 7.4 `ADMIN_USER_ID`-verdi aldri committet (kun i `.env.example` som navn).
- [ ] 7.5 Ingen border-radius/blur/gradient/emoji i admin-UI; zine-stil,
  gjenbruk eksisterende design-språk.
- [ ] 7.6 Ingen Tailwind/shadcn.
