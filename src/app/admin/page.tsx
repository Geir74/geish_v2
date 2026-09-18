/*
 * /admin — nesten tom landingsside i fanzine-stil (E4.5, gjennomgang A→i).
 *
 * Guarden bor i layout.tsx (arves av alle /admin/*). Denne siden er BEVISST
 * nesten tom: overskrift + tom-tilstand. Ingen panel-seksjoner bygges for
 * E5/E6 (ikke kart før landskap) — de lander sine paneler under /admin/* når
 * flatene faktisk finnes.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/content/i18n";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Admin — geish.no",
  description: "Administrasjon.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  const A = t().admin;
  return (
    <main className={styles.page}>
      <nav className={styles.crumb} aria-label="Sti">
        <Link href="/">geish.no</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{A.crumb}</span>
      </nav>
      <div className={styles.wrap}>
        <h1 className={styles.h1}>
          {A.heading}
          <span className={styles.acc}>.</span>
        </h1>
        <p className={styles.lede}>{A.lede}</p>
        <ul className={styles.panels}>
          <li>
            <Link href="/admin/gjestebok" className={styles.panelLink}>
              {A.gjestebok.navLabel}
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
