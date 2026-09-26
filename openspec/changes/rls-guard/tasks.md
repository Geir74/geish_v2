# Tasks — RLS-vakt

## 1. Bevis eller avkreft årsaken

- [ ] 1.1 Reproduser mistanken i et trygt miljø: opprett en tabell med
      håndskrevet RLS-policy, kjør `drizzle-kit push`, og observer om policyen
      og RLS-flagget overlever. IKKE mot produksjon.
- [ ] 1.2 Dokumenter resultatet i `design.md` — hypotesen bekreftes eller
      forkastes eksplisitt. Forkastes den, let videre før tiltak 2 låses.
- [ ] 1.3 Sjekk om andre operasjoner i repoet kan ha samme effekt
      (`db:generate` + manuell anvendelse, Supabase-migreringer, dashboard-reset).

## 2. Gjør skriptlaget trygt

- [ ] 2.1 Generaliser `scripts/verify-rls.mjs`: sjekk ALLE tabeller i `public`
      (i dag kun `guestbook_entries`), rapporter per tabell RLS-status +
      antall policyer, exit ikke-null ved avvik.
- [ ] 2.2 Legg til `scripts/apply-all-rls.mjs` (eller tilsvarende) som anvender
      alle filer i `drizzle/rls/` i dokumentert rekkefølge. Idempotent.
- [ ] 2.3 Koble `db:push` slik at RLS re-anvendes etter push, og at
      verifiseringen kjøres til slutt. Push som etterlater naken DB skal ikke
      kunne fullføre stille.
- [ ] 2.4 Verifiser lokalt: kjør kjeden og bekreft at RLS står etterpå.

## 3. Bygg vakten

- [ ] 3.1 Ny workflow (`.github/workflows/rls-guard.yml`): `schedule` +
      `workflow_dispatch`. IKKE `pull_request`.
- [ ] 3.2 Legg `DIRECT_URL` inn som GitHub **secret** (Geir gjør dette — agent
      SHALL NOT håndtere prod-credentials i klartekst).
- [ ] 3.3 Workflowen kjører verifiseringsskriptet og feiler rødt ved avvik.
- [ ] 3.4 Test: trigg manuelt mot dagens (grønne) tilstand → grønn.

## 4. Sørg for at den faktisk når fram

- [ ] 4.1 Avgjør varslingskanal (åpent spørsmål i `design.md`): rekker GitHubs
      egen varsling, eller skal rødt pushes til Telegram?
- [ ] 4.2 Verifiser at et rødt utfall faktisk gir et varsel Geir ser — test med
      en bevisst feilende kjøring.

## 5. Dokumentasjon

- [ ] 5.1 Oppdater konvensjons-dokumentasjonen med punkt 4 (push → re-anvend →
      verifiser).
- [ ] 5.2 Noter hendelsen 2026-09-26 kort som bakgrunn, så neste leser skjønner
      hvorfor vakten finnes.

## 6. Gates

- [ ] 6.1 `openspec validate rls-guard --strict` grønt
- [ ] 6.2 `npm run lint` og `npm run build` grønt
- [ ] 6.3 PR mot master, Geirs review
- [ ] 6.4 Etter merge: `openspec archive rls-guard --yes`
