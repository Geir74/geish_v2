# Design: E5 — Gjestebok

Designbeslutninger bak gjesteboka. Spec-en sier HVA som skal gjelde; her står
HVORFOR — avveininger, motforestillinger og oppgraderingsveier.

## D1: Innlogging avgjør publiseringsvei (ikke tilgang)

**Valg:** Alle kan sende inn. Innlogget → `published` umiddelbart. Anonym →
`pending`, må godkjennes i `/admin`.

**Hvorfor:** Vi stoler på innloggede (de har passert magic link — en reell
terskel), så friksjonsfri publisering er riktig for dem. Anonyme er den åpne
angrepsflaten; der er en godkjenningskø rett medisin. Modellen gjenbruker E4.5-
admin-taket presist for delen som faktisk trenger moderering, uten å straffe de
betrodde.

**Motforestilling vurdert:** «Krev innlogging for alle» ville fjernet køen helt.
Forkastet — en gjestebok skal ha lav terskel; å tvinge innlogging på en som bare
vil si «gratulerer» dreper hele poenget. Den anonyme køen er prisen for
åpenheten, og admin-taket bærer den allerede.

## D2: Ingen e-post, navn er fritekst

**Valg:** Skjemaet har `navn` (påkrevd) + `melding`. Ingen e-post lagres eller
etterspørres. Navn er fri tekst uten identitetsvalidering.

**Hvorfor:** Personvern-regelen — ingen persondata vi ikke trenger. En gjestebok
krever ikke e-post for å fungere; å samle den ville vært innsamling uten formål.
Navn som fritekst betyr at «Anonym», kallenavn eller ekte navn alle er gyldige —
gjesten bestemmer selv hvor mye hen avslører. Ingenting kobles til en reell
identitet med mindre gjesten er innlogget (da settes `author_id`, men e-posten
vises aldri).

**Konsekvens:** `author_id` er den eneste koblingen til en person, og kun for
innloggede. Slettes brukeren → `ON DELETE SET NULL` (innlegget består anonymt,
ikke slettes — det er gjesteboka, ikke brukerens eiendom alene).

## D3: Honeypot som spam-vern (ikke CAPTCHA / rate-limit)

**Valg:** Ett usynlig felt. Utfylt → forkast STILLE (ikke lagre, returner
suksess).

**Hvorfor:** Honeypot er null-friksjon for mennesker (de ser aldri feltet) og
fanger de fleste dumme bots. CAPTCHA er friksjon + tredjepart + persondata (mot
D2/personvern). Rate-limiting er infrastruktur vi ikke trenger før spam faktisk
er et problem (YAGNI). Stille forkasting er viktig: sier vi «avvist», lærer boten
å omgå — later vi som det gikk bra, kaster den bort innsatsen.

**Oppgraderingsvei:** Blir honeypot utilstrekkelig → legg til rate-limiting per
IP eller et lettvekts proof-of-work FØR vi vurderer CAPTCHA. Anonym-køen er
uansett en sikkerhetsventil: spam som slipper forbi honeypot havner i `pending`,
ikke rett på siden.

## D4: All skriving via Drizzle server-laget, RLS er dybde-forsvar

**Valg:** Ingen klient-INSERT/UPDATE/DELETE-policy. RLS SELECT = kun
`published`. All skriving (innsending + moderering) via Drizzle server actions.

**Hvorfor:** Samme mønster som profiles (E4) og admin (E4.5) — den autoritative
muren bor der handlingen skjer (server action med `getUser()`/`isAdmin()`), ikke
i RLS. RLS er dybde-forsvar for PostgREST/anon-stien: selv om noe skulle lekke
anon-nøkkelen, ser den kun publiserte innlegg og kan ikke skrive. Konsistent med
project-foundation-regelen (domenedata via Drizzle, aldri Supabase JS).

## D5: Admin ser ALT, rediger er et rette-verktøy

**Valg:** Admin-panelet lister alle statuser (pending fremhevet), med
vis/skjul/slett/rediger. Rediger er BEVISST avgrenset til å rette skrivefeil og
fjerne sensitiv info — ikke endre mening.

**Hvorfor:** Full oversikt i én flate slår en ren pending-kø — Geir vil se
helheten, ikke bare det som venter. Skjul (ikke bare slett) bevarer historikk:
et upassende innlegg kan gjemmes uten å slettes, i tilfelle det trengs senere.

**Motforestilling vurdert (rediger):** Å redigere andres ord er følsomt — det
kan brukes til å legge ord i munnen på folk. Derfor er formålet snevret inn i
spec-en (SHALL NOT endre mening) og status røres ikke ved redigering. På en
gjestebok Geir eier er retting av skrivefeil og fjerning av et telefonnummer en
legitim vertsoppgave; omskrivning er det ikke. Grensen er dokumentert som intern
regel, ikke teknisk håndhevet — tillit til admin (Geir) er forutsetningen.

## D6: /gjestebok er offentlig og statisk-vennlig, skjema er client

**Valg:** Sidevisningen er en server component som leser `published` via Drizzle
(nyest først). Skjemaet er en liten client component som poster til server
action.

**Hvorfor:** Konsistent med resten av siten — server components for data, client
kun der interaktivitet kreves (skjema-state, honeypot). Ingen e-post/persondata i
DOM-en. Copy fra `t()` (`gjestebok`-slice) som alt annet.
