## ADDED Requirements

### Requirement: Åpen surdeigskalkulator-rute uten innlogging

geish.no SHALL tilby en surdeigskalkulator på ruten `/surdeig` som er
tilgjengelig **uten innlogging**. Ruten MUST fungere uten Supabase-,
auth- eller databasekall, og MUST kunne brukes fullt ut av anonyme besøkende.

#### Scenario: Anonym besøkende bruker kalkulatoren

- **WHEN** en besøkende uten konto åpner `/surdeig`
- **THEN** vises kalkulatoren og alle beregninger fungerer uten at innlogging
  kreves eller etterspørres

#### Scenario: Ingen databaseavhengighet

- **WHEN** `/surdeig` lastes og brukes
- **THEN** gjøres ingen kall mot Supabase eller annen backend; all logikk
  kjører i klienten

### Requirement: Baker's percentage med flere meltyper

Kalkulatoren SHALL bruke baker's percentages der **total mel = 100 %** som
basis. Brukeren MUST kunne legge til én eller flere meltyper, der hver meltype
har en andel av total mel og andelene summerer til 100 %. Vann, salt og
surdeigsstarter angis som prosent av total mel.

#### Scenario: Én meltype

- **WHEN** brukeren angir 1000 g tilsatt mel og 2 % salt (ingen starter)
- **THEN** vises 20 g salt (2 % av 1000 g total mel)

#### Scenario: Flere meltyper summerer til total mel

- **WHEN** brukeren angir to meltyper (70 % hvete, 30 % rug) med total mel
  1000 g
- **THEN** vises 700 g hvete og 300 g rug, og øvrige ingredienser regnes mot
  1000 g total mel

### Requirement: True hydration som styrende input, ikke bare visning

Kalkulatoren MUST behandle hydrering som **true hydration** (totalt vann /
totalt mel, der begge inkluderer melet og vannet i surdeigsstarteren).
Hydreringsverdien brukeren angir MUST tolkes som ønsket **true hydration**, og
kalkulatoren SHALL regne bakover hvor mye vann som faktisk skal tilsettes
(«tilsatt vann») etter at starterens vannbidrag er trukket fra. Kalkulatoren er
et planleggingsverktøy: bruker sikter mot en true hydration, verktøyet sier hvor
mye vann som skal i bollen.

Brukeren SHALL kunne angi starterens egen hydrering (default 100 %). Starterens
mel og vann beregnes som `starterMel = starterVekt / (1 + h/100)` og
`starterVann = starterVekt - starterMel`, der `h` er starterhydrering i prosent.

**Definisjoner (MUST følges):**
- `totalMel = tilsattMel + starterMel`
- `totalVann = tilsattVann + starterVann`
- `trueHydration = totalVann / totalMel`
- Gitt ønsket true hydration `H`: `totalVann = totalMel * H/100`, og
  `tilsattVann = totalVann - starterVann` (det brukeren heller i bollen).

#### Scenario: Bruker angir ønsket true hydration, verktøyet gir tilsatt vann

- **WHEN** brukeren angir 1000 g tilsatt mel, 200 g starter ved 100 % hydrering
  (100 g mel + 100 g vann) og ønsket true hydration 75 %
- **THEN** er totalMel = 1100 g, totalVann = 1100 × 0,75 = 825 g, og tilsatt
  vann som skal helles i bollen = 825 − 100 = **725 g**

#### Scenario: True hydration vises korrekt, ikke naiv verdi

- **WHEN** en oppskrift har 1000 g tilsatt mel, 200 g starter ved 100 %
  hydrering, og 725 g tilsatt vann
- **THEN** vises true hydration som (725 + 100) / (1000 + 100) = 825/1100 =
  **75 %**, ikke naiv 725/1000 = 72,5 %

#### Scenario: Starterhydrering kan endres

- **WHEN** brukeren endrer starterens hydrering til en annen verdi enn 100 %
- **THEN** reberegnes utskilt starterMel/starterVann, og tilsatt vann justeres
  slik at ønsket true hydration fortsatt treffes

### Requirement: Toveis-beregning mellom melmengde og deigvekt

Kalkulatoren SHALL støtte to moduser: (a) `fromFlour` — bruker angir total
melmengde og øvrige ingredienser avledes, og (b) `fromTotalWeight` — bruker
angir ønsket ferdig deigvekt og melmengden løses bakover. Begge moduser MUST
skrive til samme interne base (uavrundet total mel), slik at de er to
innganger til samme tilstand.

#### Scenario: Fra deigvekt til ingredienser

- **WHEN** brukeren velger `fromTotalWeight` og angir ønsket deigvekt
- **THEN** løses melmengden som deigvekt delt på (1 + sum av alle prosenter),
  og øvrige ingredienser avledes fra dette

#### Scenario: Bytte modus bevarer oppskriften

- **WHEN** brukeren bytter mellom `fromFlour` og `fromTotalWeight`
- **THEN** forblir oppskriftens prosenter og forhold uendret; kun inngangen
  brukeren styrer endres

### Requirement: Én uavrundet source of truth uten sirkulære oppdateringer

Klientens tilstand MUST holde én uavrundet base (`baseFlourWeight`, full
presisjon). Alle viste gram-verdier SHALL være avledede visninger av denne
basen og prosent-settet. Ingen visningskomponent SHALL oppdatere en annen
visning direkte (ingen sirkulær/reaktiv løkke); brukerinput MUST gå gjennom
eksplisitte transform-funksjoner som oppdaterer basen.

#### Scenario: Endring oppdaterer kun basen

- **WHEN** brukeren endrer en verdi (totalvekt, en prosent eller en meltypes
  gram)
- **THEN** oppdateres den uavrundede basen (eller prosent-settet) via en
  eksplisitt transform, og alle visninger reberegnes fra basen uten
  gjensidige oppdateringer mellom komponenter

### Requirement: Avrundingsavvik absorberes i vannet

Når avrunding til hele gram gjør at summen av ingredienser ikke treffer ønsket
totalvekt eksakt, SHALL differansen legges til eller trekkes fra **vannet**.
Salt og mel MUST avrundes korrekt og forbli uendret av avrundingskorreksjonen.

#### Scenario: Sum bommer på totalvekt etter avrunding

- **WHEN** brukeren låser en totalvekt og avrundede poster summerer til et
  annet tall enn ønsket totalvekt
- **THEN** justeres kun vann-verdien med differansen, slik at summen treffer
  ønsket totalvekt, mens mel og salt står urørt

### Requirement: Skalering av oppskrift

Kalkulatoren SHALL la brukeren skalere oppskriften ved å endre totalvekt eller
melmengde, slik at øvrige ingredienser følger proporsjonalt basert på
prosentene.

#### Scenario: Skaler opp via melmengde

- **WHEN** brukeren dobler melmengden
- **THEN** dobles vann, salt og starter tilsvarende, og prosentene forblir
  uendret

### Requirement: Salt og tørre tilsetninger regnes mot total mel

Saltprosenten (og eventuelle andre tørre tilsetninger angitt i baker's %) MUST
regnes mot **total mel = tilsatt mel + mel i starteren**, ikke kun mot tilsatt
mel. Dette sikrer konsistent saltkonsentrasjon i det ferdige brødet uavhengig av
hvor stor starter-andelen er.

#### Scenario: Salt regnes mot total mel inkludert starter-mel

- **WHEN** brukeren angir 1000 g tilsatt mel, 200 g starter ved 100 % hydrering
  (100 g mel), og 2 % salt
- **THEN** beregnes salt som 2 % av total mel (1100 g) = **22 g**, ikke 2 % av
  1000 g = 20 g
