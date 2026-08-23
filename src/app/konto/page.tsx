/*
 * /konto — beskyttet review-flate (design D2 i e3-auth). Guarden bor HER,
 * ikke i middleware: getUser() validerer mot Supabase (autoritativt),
 * utlogget → redirect til /logg-inn. Eneste beskyttede rute i E3.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { t } from "@/content/i18n";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

// Eksplisitt dynamisk: uten denne prøver Next å prerendre siden ved build,
// og klientfabrikken kaster på manglende Supabase-env FØR cookies() rekker
// å markere ruten dynamisk (CI/Vercel bygger uten env-varene).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Konto — geish.no",
  description: "Din konto på geish.no.",
};

export default async function KontoPage() {
  const C = t();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logg-inn");
  }

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{C.auth.konto.crumb}</span>
      </div>

      <div className={styles.wrap}>
        <h1 className={styles.h1}>
          {C.auth.konto.heading.replace(/\.$/, "")}
          <span className={styles.acc}>.</span>
        </h1>

        <div className={styles.card}>
          <p className={styles.status}>
            <span className={styles.statusLabel}>{C.auth.konto.loggedInAs}</span>
            <span className={styles.email}>{user.email}</span>
          </p>
          <p className={styles.note}>{C.auth.konto.note}</p>
          <form method="post" action="/auth/logg-ut">
            <button type="submit" className={styles.logout}>
              {C.auth.konto.logout}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
