## MODIFIED Requirements

### Requirement: MDX-komponenter eksponert til posts

`src/lib/blog/mdx-components.tsx` SHALL eksportere et `mdxComponents`-objekt som passes til `<MDXRemote components={...}>`. Det MUST inneholde:

- `Stamp` (re-eksport fra `@/components/shared`).
- `HalftoneBlock` (re-eksport fra `@/components/shared`).
- `Pullquote` (re-eksport fra `@/components/shared`). Var opprinnelig i `src/lib/blog/Pullquote/`, flyttet til shared i `e2-manifest` siden to ruter (blog enkeltposter + manifest) bruker den.

Prose-styling for HTML-elementer (`h2`, `h3`, `h4`, `p`, `a`, `blockquote`, `code`, `pre`, `ul`, `ol`, `li`) skjer via `.prose`-klassen på MDXRemote-wrapperen i [slug]-page, ikke via direkte komponentmapping i `mdxComponents`. CSS Module-en `src/lib/blog/prose.module.css` er kilden.

Andre shared-komponenter (`GuestbookSnippet`, `WebringWidget`, `VisitorCounter`, `UnderConstructionBanner`, `ImagePlaceholder`, `StatusBadge`) eksponeres IKKE til MDX — de hører ikke hjemme i brødtekst.

#### Scenario: Pullquote importeres fra shared
- **WHEN** `src/lib/blog/mdx-components.tsx` inspiseres
- **THEN** Pullquote-importen kommer fra `@/components/shared`, ikke fra `./Pullquote`

#### Scenario: Stamp brukbar i MDX
- **WHEN** en post inneholder `<Stamp>Ferdig</Stamp>`
- **THEN** elementet rendres som en rød double-border stempel

#### Scenario: Pullquote brukbar i MDX
- **WHEN** en post inneholder `<Pullquote>Sitat-tekst</Pullquote>`
- **THEN** elementet rendres som et sentrert Archivo Black sitat med stempel-rød kant

#### Scenario: blockquote stylet med dashed border
- **WHEN** en post inneholder vanlig Markdown blockquote (`> tekst`)
- **THEN** elementet rendres med venstre dashed border og Newsreader italic (via `.prose`-stylingen i `prose.module.css`)
