# E6 – Stua (forum)

## Hvorfor

geish.no trenger «Stua» — et lukket, innlogget forum. Todelt formål:
**support-/ønske-skranke** (brukere melder ønsker/bugs om Geirs prosjekter) OG
**community** (kjente + brukere snakker sammen om prosjektene). Ikke
kringkasting. Stua erstatter Facebook som sosial flate.

Bygges selv oppå eksisterende stack (Next + Supabase + Drizzle), gjenbruk av det
beviste E5-gjestebok-mønsteret (tabell + håndskrevet RLS + admin-moderering +
E4-profil-visning). Build-vs-buy avgjort i discovery (Tinget: bygg selv — se
GRIM `03 Projects/geish-no/discovery-e6-stua-2026-09-19.md` og
`mandate-e6-stua.md`).

Alle beslutninger under er Geirs egne svar fra discovery 2026-09-19 (grilling,
ikke gjetninger).

## Beslutninger (Geir, 2026-09-19)

- **D1 – Bygg selv.** Next + Supabase + Drizzle, gjenbruk E5-mønster. Ingen
  ekstern forum-programvare (SSO-smerte + fremmed DB + zine-estetikk-kamp).
- **D2 – HELT LUKKET.** Innlogging kreves for å LESE og SKRIVE. Utlogget ser
  ingenting av Stua-innhold. Utlogget som klikker inn → `/logg-inn?next=<sti>`.
- **D3 – Rom (admin-styrt), fem ved lansering:** Geish.no, Reik.no, Prat, Annet,
  Blogg. Brukere kan IKKE opprette rom. Struktur: Stua → rom → tråder → svar.
- **D4 – Brukere starter tråder** og svarer. Publiseres UMIDDELBART, ingen kø
  (innlogget = betrodd).
- **D5 – Tråd-URL er global og room-agnostisk:** `/stua/t/[slug]`. Slug er
  GLOBALT unik + immutabel. Flytting mellom rom brekker aldri lenker.
- **D6 – Blogg-rom med lazy auto-tråder.** Bloggposter får automatisk sin egen
  tråd i Blogg-rommet — men LAZY: tråden fødes først når noen faktisk skriver.
  «Diskuter i Stua →» (innlogget): finnes tråd? gå dit : «start diskusjonen»-
  skjema forhåndsutfylt med posttittel; tråden opprettes ved første innlegg.
  Auto-kobling via bloggpost-slug (`source_slug` på tråden). Race-sikret:
  `INSERT ... ON CONFLICT (source_slug) DO NOTHING` + re-select.
- **D7 – E6 RØRER E2:** den manuelle `stua_thread`-frontmatteren ERSTATTES av
  automatisk oppslag via `source_slug`. Feltet fjernes fra E2 frontmatter-skjema
  + hello-world.mdx («Diskuter i Stua»-lenken bygges om). Én-sannhetskilde,
  ingen døde felt.
- **D8 – Bruker kan** redigere + flytte EGNE tråder (mellom rom). Slette egen
  tråd KUN mens den er tom (0 svar).
- **D9 – Admin (Geir) kan alt:** moderere, slette (også besvarte tråder),
  redigere, flytte, anonymisere.
- **D10 – Anonymisering = author_id → NULL** → innlegget faller til stormtrooper-
  fallbacken (E4). Ingen eget «anonymisert navn»-felt.
- **D11 – Identitet:** klikkbart visningsnavn (E4-profil → profilside),
  stormtrooper-NNN hvis intet navn. Visningsnavn IKKE unikt — quirks godtas.
- **D12 – Trådliste-sortering:** nyeste AKTIVITET øverst (via `last_activity_at`).

## Hva endres

- **Tre Drizzle-tabeller** med håndskrevet RLS (E5-mønster): `stua_rooms`,
  `stua_threads`, `stua_posts`. Seed fem rom.
- **Tilgangsguard:** hele `/stua` bak innlogging (layout, E3-getUser-mønster).
- **Ruter (innlogget):** `/stua` (romoversikt), `/stua/[room]` (trådliste),
  `/stua/t/[slug]` (tråd + svar + svarskjema).
- **Skrive-server-actions:** opprett tråd, opprett svar, rediger eget innlegg,
  flytt egen tråd, slett egen tom tråd. Alle: getUser + Drizzle + oppdater
  `last_activity_at`.
- **Admin-moderering** `/admin/stua`: skjul/slett/rediger/flytt/anonymiser
  tråder+innlegg. `isAdmin()` fail closed FØR hver skriving.
- **Blogg↔Stua:** «Diskuter i Stua» bygges om til source_slug-oppslag (D6/D7).
- **Forside `StuaPreview`:** delt i to datafunksjoner — public (kun antall,
  trygt for utloggede) vs. member (trådtitler, kun innlogget). Ingen lekkasje.

## Ikke i scope (fase 2 — «Stua 1.1», kun ved behov)

- Sitering av innlegg (høyt ønsket, ikke avgjørende).
- @-nevning + varsel (navnekollisjon → begge varsles, godtatt quirk).
- Opt-inn e-postvarsel ved svar. PM. Avatarer ved innlegg (E4-utvidelse).
- Trådlås (vurderes 1.0 vs 1.1 i design). Fulltekstsøk, paginering,
  reaksjoner, rate-limiting utover innloggings-vern, brukergrupper, badges,
  brukeropprettede rom.
