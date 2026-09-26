# Tasks – E5 Gjestebok

## 1. Datamodell
- [x] 1.1 Legg `guestbook_entries` i `src/db/schema.ts` (id, author_name 1–60 CHECK, body 1–2000 CHECK, status pending/published/hidden CHECK default pending, author_id uuid NULL FK auth.users ON DELETE SET NULL, created_at, updated_at) — trim()-CHECK på navn+body (Hugin-review)
- [x] 1.2 `npm run db:generate` → migrasjon `drizzle/0001_complex_synch.sql` + `db:push` mot Supabase
- [x] 1.3 Håndskriv `drizzle/rls/guestbook_entries.sql`: RLS på, SELECT USING (status='published'), ingen klient-INSERT/UPDATE/DELETE, BEFORE UPDATE-trigger for updated_at (idempotent) + revoke insert/update/delete/truncate fra anon/authenticated (Hugin-dybdeforsvar)
- [x] 1.4 Kjørt mot Supabase (DIRECT_URL) + verifisert: RLS aktiv, kun published-SELECT-policy, anon/authenticated har kun SELECT (truncate-hull funnet+lukket)

## 2. Offentlig gjestebok
- [x] 2.1 `gjestebok`-slice i `src/content/locales/no.ts` (tittel, skjema-labels, feilmeldinger, tomtilstand)
- [x] 2.2 `getPublishedEntries()` i `src/lib/guestbook/` – leser published via Drizzle, nyest først
- [x] 2.3 `src/app/gjestebok/page.tsx` – server component, lister innlegg (navn/melding/dato), ingen e-post
- [x] 2.4 Skjema-client-component: navn + melding + usynlig honeypot, poster til server action

## 3. Innsending (server action)
- [x] 3.1 `submitEntry`-server-action: honeypot-sjekk → forkast stille ved utfylt
- [x] 3.2 Valider navn+melding (lengde), returner t()-feil ved feil
- [x] 3.3 getUser() → innlogget: status=published + author_id; anonym: status=pending + author_id NULL
- [x] 3.4 Skriv via Drizzle, revalider /gjestebok

## 4. Admin-moderering
- [x] 4.1 `admin`-copy utvides i no.ts (gjestebok-panel)
- [x] 4.2 `src/app/admin/gjestebok/page.tsx` – guardet, lister ALLE innlegg (nyest først, status synlig, pending fremhevet)
- [x] 4.3 Moderering-server-actions (vis/skjul/slett) – isAdmin()-sjekk FØR skriving, updated_at=now()
- [x] 4.3b Rediger-server-action (author_name/body, rører ikke status) + edit-UI – isAdmin()-sjekk FØR skriving
- [x] 4.4 Lenke fra /admin-landingssiden til /admin/gjestebok

## 5. Verifisering
- [ ] 5.1 `npx tsc --noEmit` rent
- [ ] 5.2 `npm run lint` rent
- [ ] 5.3 `npm run build` grønt
- [ ] 5.4 Manuell: anon-innlegg → pending, ikke synlig; innlogget → published, synlig umiddelbart
- [ ] 5.5 Manuell: admin ser alle statuser; vis pending → offentlig; skjul → forsvinner; rediger retter tekst uten å endre status; honeypot utfylt → ikke lagret
- [ ] 5.6 RLS-verifisering: anon PostgREST-lesing returnerer kun published

## 6. OpenSpec + merge
- [ ] 6.1 `openspec validate e5-gjestebok --strict` grønt
- [ ] 6.2 PR mot master, Geirs review
- [ ] 6.3 Etter merge: `openspec archive e5-gjestebok --yes` (fletter guestbook- + admin-delta inn i specs/)
