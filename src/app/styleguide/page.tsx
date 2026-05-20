/*
 * Styleguide — review-flaten for designsystemet.
 * Permanent men ulinket fra forsiden. Direkte URL: /styleguide.
 * Tre seksjoner: tokens, komponenter, mønstre.
 */
import type { ReactNode } from "react";
import {
  GuestbookSnippet,
  HalftoneBlock,
  ImagePlaceholder,
  Stamp,
  StatusBadge,
  UnderConstructionBanner,
  VisitorCounter,
  WebringWidget,
} from "@/components/shared";
import styles from "./styleguide.module.css";

export const metadata = {
  title: "Styleguide — geish.no",
};

// Helper for å vise en token-svømmer med oklch-verdi og bruk-tekst.
function Swatch({
  name,
  value,
  use,
  bg,
}: {
  name: string;
  value: string;
  use: string;
  bg: string;
}) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchChip} style={{ background: bg }} />
      <div className={styles.swatchMeta}>
        <code className={styles.swatchName}>{name}</code>
        <code className={styles.swatchValue}>{value}</code>
        <div className={styles.swatchUse}>{use}</div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} id={id}>
      <h2 className={styles.h2}>{title}</h2>
      {children}
    </section>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.demo}>
      <div className={styles.demoLabel}>{label}</div>
      <div className={styles.demoBox}>{children}</div>
    </div>
  );
}

export default function StyleguidePage() {
  return (
    <main className={`${styles.page} paper`}>
      <header className={styles.intro}>
        <h1 className={styles.h1}>styleguide</h1>
        <p className={styles.lead}>
          Cut &amp; Paste Zine — fundamentet alt UI på geish.no bygger på. Denne
          siden er review-flaten for designsystemet og er ulinket fra forsiden.
        </p>
        <nav className={styles.toc}>
          <a href="#tokens">1. Tokens</a>
          <span>·</span>
          <a href="#komponenter">2. Komponenter</a>
          <span>·</span>
          <a href="#monstre">3. Mønstre</a>
        </nav>
      </header>

      {/* ── 1. TOKENS ─────────────────────────────────────────── */}
      <Section id="tokens" title="1. Tokens">
        <h3 className={styles.h3}>1.1 Papir &amp; blekk</h3>
        <div className={styles.swatchGrid}>
          <Swatch name="--paper" value="oklch(94% 0.018 80)" use="Hovedbakgrunn, papiret" bg="oklch(94% 0.018 80)" />
          <Swatch name="--paper-warm" value="oklch(91% 0.022 75)" use="Boks-bakgrunner" bg="oklch(91% 0.022 75)" />
          <Swatch name="--paper-edge" value="oklch(86% 0.030 75)" use="Kanter, folder, striper" bg="oklch(86% 0.030 75)" />
          <Swatch name="--paper-dark" value="oklch(78% 0.035 70)" use="Dypt brunt papir (sjelden)" bg="oklch(78% 0.035 70)" />
          <Swatch name="--ink" value="oklch(20% 0.015 60)" use="Hovedtekst, kanter, sort fyll" bg="oklch(20% 0.015 60)" />
          <Swatch name="--ink-soft" value="oklch(35% 0.012 60)" use="Dempet brødtekst" bg="oklch(35% 0.012 60)" />
          <Swatch name="--ink-fade" value="oklch(55% 0.010 60)" use="Meta, sekundær info" bg="oklch(55% 0.010 60)" />
        </div>

        <h3 className={styles.h3}>1.2 Aksent &amp; spesial</h3>
        <div className={styles.swatchGrid}>
          <Swatch name="--stamp" value="oklch(48% 0.19 25)" use="Stempel-rødt, kall-til-handling" bg="oklch(48% 0.19 25)" />
          <Swatch name="--stamp-fade" value="oklch(58% 0.14 25)" use="Falmet stempel" bg="oklch(58% 0.14 25)" />
          <Swatch name="--highlight" value="oklch(86% 0.16 95)" use="Gul tusj-marker, UC-stripemønster" bg="oklch(86% 0.16 95)" />
        </div>

        <h3 className={styles.h3}>1.3 Status-farger</h3>
        <div className={styles.swatchGrid}>
          <Swatch name="status: live" value="oklch(45% 0.16 145)" use="LIVE-badges" bg="oklch(45% 0.16 145)" />
          <Swatch name="status: wip" value="oklch(60% 0.16 75)" use="WIP-badges" bg="oklch(60% 0.16 75)" />
          <Swatch name="status: idea" value="var(--ink-fade)" use="IDÉ-badges" bg="oklch(55% 0.010 60)" />
        </div>

        <h3 className={styles.h3}>1.4 Type-roller</h3>
        <ul className={styles.typeList}>
          <li>
            <code>--font-display</code>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--t-h2)" }}>Archivo Black</span>
            <span className={styles.typeNote}>Plakat-overskrifter (h1/h2/h3)</span>
          </li>
          <li>
            <code>--font-poster</code>
            <span style={{ fontFamily: "var(--font-poster)", fontSize: "var(--t-h3)" }}>Bungee</span>
            <span className={styles.typeNote}>Stencil-typografi (sjelden)</span>
          </li>
          <li>
            <code>--font-typewriter</code>
            <span style={{ fontFamily: "var(--font-typewriter)", fontSize: "var(--t-body)" }}>Special Elite — brødtekst</span>
            <span className={styles.typeNote}>Default body</span>
          </li>
          <li>
            <code>--font-mono</code>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-body)" }}>JetBrains Mono 01234</span>
            <span className={styles.typeNote}>Meta, datoer, kode, badges</span>
          </li>
          <li>
            <code>--font-serif</code>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "var(--t-lead)" }}>Newsreader — for langform</span>
            <span className={styles.typeNote}>Manifest, blogg</span>
          </li>
        </ul>

        <h3 className={styles.h3}>1.5 Type-skala</h3>
        <div className={styles.typeScale}>
          <div style={{ fontSize: "var(--t-meta)" }}><code>--t-meta</code> 11px — meta-tekst, datoer</div>
          <div style={{ fontSize: "var(--t-small)" }}><code>--t-small</code> 13px — sekundær</div>
          <div style={{ fontSize: "var(--t-body)" }}><code>--t-body</code> 16px — brødtekst</div>
          <div style={{ fontSize: "var(--t-lead)" }}><code>--t-lead</code> 20px — lead-paragraf</div>
          <div style={{ fontSize: "var(--t-h3)", fontFamily: "var(--font-display)" }}>--t-h3 28px</div>
          <div style={{ fontSize: "var(--t-h2)", fontFamily: "var(--font-display)" }}>--t-h2 48px</div>
          <div style={{ fontSize: "var(--t-h1)", fontFamily: "var(--font-display)", lineHeight: 1 }}>--t-h1 88px</div>
          <div style={{ fontSize: "var(--t-mega)", fontFamily: "var(--font-display)", lineHeight: 1, letterSpacing: "-0.025em" }}>mega 144</div>
        </div>

        <h3 className={styles.h3}>1.6 Spacing-stige</h3>
        <div className={styles.spacingStack}>
          {[
            ["--sp-1", "4px"],
            ["--sp-2", "8px"],
            ["--sp-3", "12px"],
            ["--sp-4", "16px"],
            ["--sp-5", "24px"],
            ["--sp-6", "32px"],
            ["--sp-7", "40px"],
            ["--sp-8", "48px"],
            ["--sp-9", "56px"],
            ["--sp-10", "64px"],
            ["--sp-12", "96px"],
            ["--sp-16", "128px"],
          ].map(([name, value]) => (
            <div key={name} className={styles.spacingRow}>
              <code className={styles.spacingLabel}>{name}</code>
              <div className={styles.spacingBar} style={{ width: value }} />
              <span className={styles.spacingValue}>{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 2. KOMPONENTER ────────────────────────────────────── */}
      <Section id="komponenter" title="2. Komponenter">
        <h3 className={styles.h3}>VisitorCounter</h3>
        <p className={styles.cdesc}>Sort boks, oransje LED-siffer. Tre størrelser.</p>
        <div className={styles.cdemo}>
          <VisitorCounter count="01337" label="besøkende i dag" size="sm" />
          <VisitorCounter count="01337" label="besøkende i dag" size="md" />
          <VisitorCounter count="01337" label="besøkende i dag" size="lg" />
        </div>

        <h3 className={styles.h3}>UnderConstructionBanner</h3>
        <p className={styles.cdesc}>Blinkende banner, full og compact. Permanent — ikke en feilmelding.</p>
        <div className={styles.cstack}>
          <UnderConstructionBanner />
          <UnderConstructionBanner compact />
        </div>

        <h3 className={styles.h3}>WebringWidget</h3>
        <p className={styles.cdesc}>Tre varianter: bar (default), card (zine-kort med tape), stamp (kompakt). 🔗-emoji byttet til ◉-glyf — forbudslisten gjelder.</p>
        <div className={styles.cstack}>
          <WebringWidget variant="bar" />
          <WebringWidget variant="card" />
          <WebringWidget variant="stamp" />
        </div>

        <h3 className={styles.h3}>GuestbookSnippet</h3>
        <p className={styles.cdesc}>Siste gjestebok-innlegg. List eller cards (cards bruker --chaos for rotasjon).</p>
        <div className={styles.cstack}>
          <div>
            <div className={styles.cVariantLabel}>style: list</div>
            <GuestbookSnippet style="list" />
          </div>
          <div>
            <div className={styles.cVariantLabel}>style: cards</div>
            <GuestbookSnippet style="cards" />
          </div>
        </div>

        <h3 className={styles.h3}>StatusBadge</h3>
        <p className={styles.cdesc}>LIVE / WIP / IDÉ — alltid tekst, aldri emoji.</p>
        <div className={styles.cdemo}>
          <StatusBadge status="live" />
          <StatusBadge status="wip" />
          <StatusBadge status="idea" />
        </div>

        <h3 className={styles.h3}>Stamp</h3>
        <p className={styles.cdesc}>Rødt gummistempel. Rotate i grader, --chaos multipliserer.</p>
        <div className={styles.cdemo}>
          <Stamp>Godkjent</Stamp>
          <Stamp rotate={3}>WIP</Stamp>
          <Stamp rotate={-7} size={18}>STAY GROUNDED</Stamp>
        </div>

        <h3 className={styles.h3}>ImagePlaceholder</h3>
        <p className={styles.cdesc}>Stripet placeholder med klammeparentes-label. Tape og rotasjon valgfritt.</p>
        <div className={styles.cdemo}>
          <ImagePlaceholder label="HUND.JPG" w={180} h={120} />
          <ImagePlaceholder label="MANIFEST.PNG" w={180} h={120} tape />
          <ImagePlaceholder label="ARKIV.GIF" w={180} h={120} tape rotate={-2} />
        </div>

        <h3 className={styles.h3}>HalftoneBlock</h3>
        <p className={styles.cdesc}>SVG-prikkmønster, density styrer prikkstørrelse. Dekor, ikke innhold.</p>
        <div className={styles.cdemo}>
          <HalftoneBlock density={0.3} />
          <HalftoneBlock density={0.6} />
          <HalftoneBlock density={1} />
        </div>
      </Section>

      {/* ── 3. MØNSTRE ────────────────────────────────────────── */}
      <Section id="monstre" title="3. Mønstre">
        <Demo label="Photo-tape — semitransparent gul stripe på toppen av klippede elementer">
          <div className={styles.tapeDemoBox}>
            <span className={styles.tapeDemoTape} />
            <div className={styles.tapeDemoInner}>klippet og festet</div>
          </div>
        </Demo>

        <Demo label="Flat sort skygge — box-shadow: 5px 5px 0 var(--ink). Aldri blur.">
          <div className={styles.shadowDemo}>boks som ligger på papiret</div>
        </Demo>

        <Demo label="Stripet placeholder-bakgrunn — for bilder og tomme felt">
          <div className={styles.stripedDemo}>repeating-linear-gradient</div>
        </Demo>

        <Demo label="Marker-highlight (gul) — bak korte tekstsnutter med ekstra vekt">
          <p className={styles.markerDemo}>
            mest av sidene er <span className={styles.markerSpan}>vanlig zine-papir</span>,
            men noen utdrag får marker.
          </p>
        </Demo>
      </Section>
    </main>
  );
}
