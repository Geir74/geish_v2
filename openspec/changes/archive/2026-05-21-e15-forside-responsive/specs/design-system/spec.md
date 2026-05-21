## MODIFIED Requirements

### Requirement: Shared-komponenter forblir lesbare på 380px

`src/components/shared/` SHALL ikke ha komponenter som sprenger horisontal scroll eller blir uleselige på 380px viewport. Komponenter som hardkoder bredder/størrelser SHALL inspiseres; fix gjøres kun der det faktisk knekker (ikke proaktiv refaktorering av komponenter som allerede flyter).

`WebringWidget` bar-variant SHALL bruke `flex-wrap: wrap` for å unngå horisontal scroll når lenkene + members-tellingen ikke får plass på én linje.

`UnderConstructionBanner` `.full` SHALL bruke `flex-wrap: wrap` for samme grunn — banneret er en flex-rad med tre elementer (`▲` + lang uppercase tekst + `▲`) som blir ~430px+ wide og sprengte horisontal scroll på viewports under ~310px før denne fixen.

Andre shared-komponenter er allerede fleksible (padding-basert, flex/grid med auto-fit) og krever ingen endring.

#### Scenario: WebringWidget bar wrapper
- **WHEN** `<WebringWidget variant="bar">` rendres på 380px viewport
- **THEN** komponenten forårsaker ikke horisontal scroll; innholdet wrapper til ny linje hvis nødvendig

#### Scenario: UnderConstructionBanner full wrapper
- **WHEN** `<UnderConstructionBanner />` (full variant) rendres på 292px viewport
- **THEN** komponenten forårsaker ikke horisontal scroll; tekst og glyfer wrapper til ny linje

#### Scenario: ingen shared-komponent forårsaker scroll
- **WHEN** `/styleguide` eller `/` rendres på 292px viewport (Chrome DevTools device-emulering)
- **THEN** body har ikke horisontal scroll
