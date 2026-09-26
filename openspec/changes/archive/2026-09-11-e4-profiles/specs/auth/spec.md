## MODIFIED Requirements

### Requirement: Innlogget-tilstand som gjenbrukbart mønster for E4

Prosjektet SHALL eksponere innlogget-tilstand og tilhørende profildata gjennom
dokumenterte mekanismer som E5/E6 arver:

- **Server-side (autoritativ):** `createClient()` fra `@/lib/supabase/server` +
  `auth.getUser()` — brukes for guards og all tilgangskontroll. Profildata leses
  server-side via `getProfile(userId)` i `src/lib/profile/` (Drizzle), aldri via
  Supabase JS-klienten.
- **Client-side (kosmetisk):** `useUser()`-hook i `src/lib/auth/use-user.ts` —
  `getUser()` ved mount + `onAuthStateChange`-subscription, returnerer
  `{ user, loading }`. Brukes KUN til å vise/skjule UI, aldri som tilgangskontroll.
  `useUser()` SHALL holdes ren for auth-tilstand; profildata i client-komponenter
  legges i en egen hjelper først når et konkret behov oppstår (E5/E6), og den
  hjelperen henter via et internt server-endepunkt — ikke direkte fra Supabase JS.

#### Scenario: useUser gir user og loading
- **WHEN** en client component kaller `useUser()` mens en bruker er innlogget
- **THEN** returneres `{ user }` med brukerens data etter lasting, og `loading` går fra `true` til `false`

#### Scenario: hook reagerer på auth-endringer
- **WHEN** sesjonen endres (innlogging/utlogging) mens en komponent med `useUser()` er montert
- **THEN** oppdateres `user`-verdien via `onAuthStateChange` uten sidelasting

#### Scenario: profildata hentes server-side via Drizzle
- **WHEN** en server component (f.eks. `/konto`) trenger brukerens profil
- **THEN** hentes den via `getProfile(userId)` (Drizzle), ikke via Supabase JS-klienten

#### Scenario: useUser forblir ren auth-tilstand
- **WHEN** `src/lib/auth/use-user.ts` inspiseres etter E4
- **THEN** returnerer den fortsatt kun `{ user, loading }` uten profildata
