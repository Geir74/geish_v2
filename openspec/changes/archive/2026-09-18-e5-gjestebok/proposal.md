# E5 – Gjestebok

## Hvorfor

geish.no trenger en lavterskel måte for besøkende å legge igjen en hilsen –
gjesteboka (E5) er neste epic etter at auth (E3), profiler (E4) og admin-taket
(E4.5) er på plass. E4.5 ble bevisst bygget FØR denne fordi anonyme innlegg
trenger en modereringsflate; moderering-mønster-kravet ble utelatt fra E4.5 og
utledes her fra det første faktiske panelet (jf. admin-spec, beslutning B).

## Beslutninger (Geir, 2026-09-12)

- **D1 – Innlogging kreves IKKE, men avgjør publiseringsvei.** Vi stoler på
  innloggede. Innlogget → innlegget publiseres UMIDDELBART (synlig). Ikke
  innlogget → innlegget legges i kø og MÅ godkjennes i `/admin` før det vises.
- **D2 – Felter:** `navn` (PÅKREVD, fritekst – man kan skrive hva man vil, ingen
  identitetsvalidering) + `melding` (påkrevd). INGEN e-post lagres eller
  etterspørres (personvern-regelen: ingen persondata å søle med).
- **D3 – Honeypot** (usynlig felt) som spam-vern på skrivestien, uavhengig av
  innloggingsstatus. Bot fyller feltet → innlegget forkastes stille (ikke lagret,
  ser ut som suksess for boten).
- **D4 – Admin ser ALT og rydder i etterkant.** Admin-panelet lister ALLE innlegg
  uansett status (pending/published/hidden), pending fremhevet. Actions per rad:
  vis / skjul / slett / rediger. **Rediger er bevisst avgrenset** til å rette
  skrivefeil og fjerne sensitiv info — aldri endre meningen i det en gjest skrev.
  Innlogget-innlegg publiseres uten kø; anonyme venter på godkjenning.

## Hva endres

- **Ny `guestbook_entries`-tabell** (Drizzle) med `status`-felt
  (`pending`/`published`/`hidden`), `author_name`, `body`, tidsstempler. RLS:
  alle leser KUN `published`, admin-stien (Drizzle server, omgår RLS) ser alt.
- **Offentlig `/gjestebok`-side:** liste over publiserte innlegg (nyest først) +
  skjema. Innsending via server action: honeypot-sjekk → innlogget?
  `published` : `pending`. Ingen e-post.
- **Admin-moderering under `/admin/gjestebok`:** liste over ALLE innlegg (pending
  fremhevet). Actions: vis (`→published`), skjul (`→hidden`), slett, rediger
  (rett skrivefeil / fjern sensitiv info, rører ikke status). Dette ETABLERER
  moderering-mønsteret E4.5 utsatt.
- **Admin-spec får moderering-mønster-kravet** (delta), nå med en faktisk bruker.

## Ikke i scope (bevisst)

- Redigering av EGNE innlegg fra gjeste-siden (kun admin kan redigere, og kun
  for retting/sensitiv-info), svar/tråder, reaksjoner (→ evt. E6 «Stua»/forum).
- Rate-limiting utover honeypot (vurderes hvis spam faktisk blir et problem).
- E-postvarsling til admin ved nytt `pending`-innlegg (kan komme senere).
