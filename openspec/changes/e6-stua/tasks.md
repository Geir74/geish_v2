# Tasks – E6 Stua

## 1. Datamodell
- [x] 1.1 Legg `stua_rooms`, `stua_threads`, `stua_posts` i `src/db/schema.ts`
      (kolonner/FK/CHECK/UNIQUE per spec: slug UNIQUE global, source_slug UNIQUE,
      last_activity_at, reply_count, status-CHECK, trim-CHECK på title/body,
      room_id ON DELETE RESTRICT, thread_id ON DELETE CASCADE, author_id ON
      DELETE SET NULL)
- [x] 1.2 `npm run db:generate` → migrasjon under `drizzle/` + `db:push`
- [x] 1.3 Håndskriv `drizzle/rls/stua.sql`: RLS på alle tre; SELECT kun
      `authenticated` (rooms) / `authenticated`+status='published' (threads/posts);
      ingen klient-skrive-policy; revoke insert/update/delete/truncate fra
      anon+authenticated; set_updated_at-trigger (gjenbruk); idempotent
- [x] 1.4 Kjør RLS mot Supabase (apply-rls.mjs) + verifiser (verify-rls.mjs):
      RLS aktiv, anon får 0 rader, authenticated kun published, ingen
      skrive-grants
- [x] 1.5 Seed fem rom (Geish.no, Reik.no, Prat, Annet, Blogg) via seed-script
      eller idempotent SQL (sort_order styrer visning)

## 2. Slug + hjelpere
- [ ] 2.1 `src/lib/stua/slugify.ts`: translitterering (æ→ae/ø→oe/å→aa),
      lowercase, ikke-alfanum→bindestrek, trim; tom → `traad-<kort-id>`
- [ ] 2.2 `uniqueThreadSlug(base)`: sjekk mot eksisterende slugs, suffiks -2/-3
      (server-side, i skrive-action-transaksjon)
- [ ] 2.3 Enhetstest slugify: norsk tittel, kun-emoji-tittel, kollisjon

## 3. Tilgangsguard + lesing
- [ ] 3.1 `src/app/stua/layout.tsx`: getUser-guard, utlogget →
      redirect(`/logg-inn?next=<sti>`) (E3-mønster)
- [ ] 3.2 `src/lib/stua/queries.ts`: getRooms(), getThreadsByRoom(roomSlug)
      (sortert last_activity_at desc), getThreadBySlug(slug) + posts, med
      forfatter-join (displayNameFor, E4) — ingen N+1. Forfatter-visning:
      visningsnavn (displayNameFor) IKKE-klikkbart i 1.0 (offentlig profilrute
      finnes ikke ennå → klikkbart navn = Stua 1.1). author_id NULL →
      stormtrooper-fallback.
- [ ] 3.3 `stua`-locale-slice i `no.ts` (romnavn/labels/skjema/feil/tomtilstand)
- [ ] 3.4 `/stua/page.tsx` — romoversikt (fem rom + siste aktivitet)
- [ ] 3.5 `/stua/[room]/page.tsx` — trådliste (nyeste aktivitet øverst),
      notFound ved ukjent rom
- [ ] 3.6 `/stua/t/[slug]/page.tsx` — tråd (åpningsinnlegg + svar kronologisk) +
      svarskjema; skjult tråd (status='hidden') → notFound for VANLIG bruker,
      men admin-gren (isAdmin → vis tråden med «skjult»-badge, så Geir kan
      re-vise). Skjulte enkeltsvar vises som «[skjult]» for vanlig, fullt for admin.

## 4. Skrive-server-actions (alle: getUser FØR skriving, Drizzle, revalidate)
- [ ] 4.1 `createThread(roomId, title, body)`: slugify+unik, insert thread +
      første post (åpningsinnlegg) i transaksjon, sett last_activity_at
- [ ] 4.2 `createReply(threadId, body)`: insert post (status='published'), bump
      last_activity_at + øk reply_count. reply_count teller PUBLISHED svar utover
      åpningsinnlegget (autoritativ for «tom tråd»-sjekk).
- [ ] 4.3 `editOwnPost(postId, body)`: `where author_id = user.id`, updated_at
- [ ] 4.4 `moveOwnThread(threadId, newRoomId)`: `where author_id = user.id`,
      bytt room_id (slug/URL uendret)
- [ ] 4.5 `deleteOwnThread(threadId)`: kun hvis `author_id = user.id` OG
      `reply_count = 0` (tom); ellers nekt

## 5. Blogg-kobling (lazy, race-sikret) — RØRER E2
- [ ] 5.1 «Diskuter i Stua»-flyt: `getThreadBySourceSlug(bloggSlug)` →
      finnes: redirect `/stua/t/[slug]`; ellers → «start diskusjonen»-skjema
      (forhåndsutfylt trådtittel = posttittel)
- [ ] 5.2 `startBlogThread(bloggSlug, title, body)`: `INSERT ... ON CONFLICT
      (source_slug) DO NOTHING` + re-select vinnende tråd (race-sikret), legg i
      Blogg-rommet, skriv åpningsinnlegg
- [ ] 5.3 E2-endring: bygg om «Diskuter i Stua»-lenken i blog-motoren til
      source_slug-oppslag; utlogget → `/logg-inn?next=`
- [ ] 5.4 E2-endring: fjern `stua_thread` fra frontmatter-zod-skjema + fra
      `hello-world.mdx`; verifiser at bloggen fortsatt bygger

## 6. Admin-moderering (`/admin/stua`, isAdmin() FØR hver skriving)
- [ ] 6.1 `admin.stua`-locale + `/admin/stua/page.tsx` (guardet via /admin/layout),
      lister rom → tråder (skjulte/pending synlige for admin)
- [ ] 6.2 Admin-actions: hideThread/showThread, hidePost/showPost (soft),
      deleteThread (også besvart, cascade), editThreadOrPost, moveThread.
      Presiser: hidePost/deletePost på et PUBLISHED svar → dekrementer
      reply_count (så «tom tråd»-sjekk forblir korrekt). moveThread bytter KUN
      room_id — rører IKKE last_activity_at (ellers hopper gamle tråder til topp
      i nytt rom) og IKKE slug/URL.
- [ ] 6.3 anonymizePost: `author_id = NULL` (→ stormtrooper-fallback), evt. rediger body
- [ ] 6.4 Lenke fra /admin-landingsside til /admin/stua

## 7. Forside StuaPreview (ingen lekkasje)
- [ ] 7.1 `getStuaPublicStats()` (kun antall rom/tråder) + `getStuaRecentThreads()`
      (titler, kun kalt innlogget)
- [ ] 7.2 Koble `StuaPreview`: utlogget → antall + «logg inn for å se»; innlogget
      → nyeste tråder. Aldri titler til utloggede

## 8. (Identitet — slått sammen inn i 3.2; klikkbart navn/profilrute = Stua 1.1)

## 9. Verifisering
- [ ] 9.1 `npx tsc --noEmit` rent
- [ ] 9.2 `npm run lint` rent
- [ ] 9.3 `npm run build` grønt
- [ ] 9.4 RLS: anon PostgREST → 0 rader; authenticated → kun published
- [ ] 9.5 Bypass: Drizzle server ser hidden (verify-bypass-mønster)
- [ ] 9.6 Manuell: lukket tilgang (utlogget → logg-inn?next); start tråd →
      synlig; svar → tråd stiger; flytt egen tråd → URL består; slett tom tråd
      ok / besvart nektes; admin skjul tråd → hele tråden borte; anonymiser →
      stormtrooper
- [ ] 9.7 Manuell: «Diskuter i Stua» lazy — uten tråd → skjema → tråd fødes;
      med tråd → dit; utlogget → logg-inn?next; bloggen bygger uten stua_thread

## 10. OpenSpec + merge
- [ ] 10.1 `openspec validate e6-stua --strict` grønt
- [ ] 10.2 PR mot master, Geirs review
- [ ] 10.3 Etter merge: `openspec archive e6-stua --yes`
