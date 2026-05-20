/*
 * Forsiden (/) — Cut & Paste Zine.
 *
 * 12-kolonners CSS-grid med 13 seksjoner per 02-PAGES.md Side 1.
 * Hver seksjon er en isolert komponent under src/components/forside/.
 * Grid-plassering ligger her (page.module.css), ikke i seksjons-modulene.
 * All copy hentes fra src/content/i18n.ts — ingen hardkodet tekst.
 */
import {
  AboutRow,
  BlogStrip,
  CornerStamp,
  FooterRow,
  GuestbookGrid,
  IntroNote,
  ManifestCut,
  Megabox,
  ProjectsRow,
  PullquoteBand,
  StuaPreview,
  Trio,
} from "@/components/forside";
import { t } from "@/content/i18n";
import styles from "./page.module.css";

export default function Home() {
  const C = t();
  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.grid}>
        <section className={styles.megabox}>
          <Megabox />
        </section>

        <section className={styles.cornerStamp}>
          <CornerStamp />
        </section>

        <section className={styles.introNote}>
          <IntroNote />
        </section>

        <section className={styles.manifestCut}>
          <ManifestCut />
        </section>

        <section className={styles.stuaPreview}>
          <StuaPreview />
        </section>

        <section className={styles.guestbookGrid}>
          <GuestbookGrid />
        </section>

        <section className={styles.projectsRow}>
          <ProjectsRow />
        </section>

        <section className={styles.pullquoteBand}>
          <PullquoteBand />
        </section>

        <section className={styles.aboutRow}>
          <AboutRow />
        </section>

        <section className={styles.trio}>
          <Trio />
        </section>

        <section className={styles.blogStrip}>
          <BlogStrip />
        </section>

        <section className={styles.footerRow}>
          <FooterRow />
        </section>

        {/* Seksjon 13 — copyright-linja. Ren tekst, ingen logikk = inline. */}
        <div className={styles.copyright}>
          {C.meta.copyright} · {C.meta.server} · best viewed in any browser
        </div>
      </div>
    </main>
  );
}
