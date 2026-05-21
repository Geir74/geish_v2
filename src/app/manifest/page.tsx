/*
 * /manifest — den fulle manifest-siden "Stay Grounded, and Create Shit".
 * Avis-strukturen: brødsmule → splash (kicker, h1, deck, stempelrad) →
 * TL;DR-boks → MDX-brødtekst → end-blokk (credo, CTA, sign-off, webring).
 *
 * Splash/TL;DR/end-blokk er JSX-komponenter her (designkontroll).
 * Midt-teksten lever i src/content/manifest.mdx og rendres via MDXRemote
 * (Geir redigerer prosaen der, ikke i kodefiler).
 *
 * CTA-lenkene (/starter-kit, /ring/join, /manifest.pdf) 404-er inntil
 * senere mandater fyller dem inn — ingen stub-ruter per RESPONSIVE.md.
 */
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Stamp, WebringWidget } from "@/components/shared";
import { t } from "@/content/i18n";
import { getManifest } from "@/lib/manifest/content";
import { manifestMdxComponents } from "@/lib/manifest/mdx-components";
import styles from "./page.module.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Manifestet — Stay Grounded, and Create Shit — geish.no",
  description:
    "Et manifest fra geish.no. Eller: hvorfor jeg droppet Facebook og lagde min egen hjemmeside i 2026.",
};

// TL;DR-punkter fra manifestets "Noen sannheter vi har glemt"-liste.
// Holdes som const for å holde MDX-brødteksten ren prosa.
const TLDR_POINTS = [
  "Du trenger ikke 500 venner. Du trenger 15 som faktisk leser det du skriver.",
  "En gjestebok med tre innlegg er mer verdt enn tusen likes fra folk du aldri har møtt.",
  "Nettet ble bygd for å koble folk sammen. Ikke for å selge dem ting.",
  "Det finnes ingen algoritme som vet bedre enn deg hva du vil se.",
  "AI som du styrer er et verktøy. AI som styrer deg er et produkt. Kjenn forskjellen.",
  "Under Construction er en livsstil, ikke en feilmelding.",
] as const;

function formatNorwegianDate(iso: string): string {
  const months = ["jan", "feb", "mars", "apr", "mai", "juni", "juli", "aug", "sep", "okt", "nov", "des"];
  const [year, month, day] = iso.split("-");
  return `${Number(day)}. ${months[Number(month) - 1]} ${year}`;
}

export default async function ManifestPage() {
  const C = t();
  const { lastUpdated, readTimeMin, mdxSource } = await getManifest();

  return (
    <main className={`${styles.page} paper`}>
      {/* ── BRØDSMULE ─────────────────────────────────────────── */}
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>MANIFESTET</span>
        <span className={styles.right}>
          {readTimeMin} MIN LESETID · SIST ENDRET {formatNorwegianDate(lastUpdated)}
        </span>
      </div>

      {/* ── SPLASH ────────────────────────────────────────────── */}
      <section className={styles.splash}>
        <div className={styles.kicker}>— Et manifest fra {C.brand.name} —</div>
        <h1 className={styles.h1}>
          Stay Grounded,
          <br />
          and <span className={styles.acc}>Create Shit</span>
        </h1>
        <p className={styles.deck}>
          Eller: hvorfor jeg droppet Facebook og lagde min egen hjemmeside i 2026.
        </p>
        <div className={styles.stamprow}>
          <Stamp rotate={-4}>Punk·standup</Stamp>
          <Stamp rotate={3}>Anti·plattform</Stamp>
          <Stamp rotate={-2}>Pro·eierskap</Stamp>
        </div>
      </section>

      {/* ── BODY: TL;DR + MDX-brødtekst ──────────────────────── */}
      <div className={styles.body}>
        <aside className={styles.tldr}>
          <div className={styles.tldrLabel}>
            TL;DR — i tilfelle du bare scroller
          </div>
          <ul className={styles.tldrList}>
            {TLDR_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </aside>

        <article className={styles.prose}>
          <MDXRemote source={mdxSource} components={manifestMdxComponents} />
        </article>
      </div>

      {/* ── END-BLOKK ─────────────────────────────────────────── */}
      <section className={styles.end}>
        <h2 className={styles.credo}>
          Stay Grounded,
          <br />
          and <span className={styles.acc}>Create Shit.</span>
        </h2>
        <p className={styles.endLead}>
          Start en hjemmeside. Skriv noe. Del det med folk du kjenner.
          <br />
          Bli med i webringen. Eller bare begynn å tenke på det.
        </p>
        <div className={styles.cta}>
          <a href="/starter-kit">→ Klon starter-kitet</a>
          <span className={styles.ctaSep}>·</span>
          <a href="/ring/join">→ Bli med i webringen</a>
          <span className={styles.ctaSep}>·</span>
          <a href="/manifest.pdf">→ Last ned som zine (PDF)</a>
        </div>
        <p className={styles.signoff}>
          <em>
            Skrevet av en fyr som ble lei av å scrolle. Med litt hjelp av en AI som gjør det han ber den om.
          </em>
          <br />
          <em>
            Publisert på min egen server. Ingen sporing. Ingen reklame. Ingen algoritme.
          </em>
          <br />
          <br />
          🚧 Denne siden er under construction. Alltid.
        </p>
        <div className={styles.endRing}>
          <WebringWidget variant="bar" />
        </div>
      </section>
    </main>
  );
}
