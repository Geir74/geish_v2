/*
 * AuthNav — global innlogget-tilstand i nav (design D5 i e3-auth).
 * Client component montert i rot-layouten: hydreres oppå statisk HTML og
 * henter tilstanden i nettleseren via useUser() — statiske sider forblir
 * statiske. Mens loading: tom placeholder med reservert plass (ingen
 * "LOGG INN"-blink for innloggede, ingen layout-shift).
 */
"use client";

import Link from "next/link";
import { t } from "@/content/i18n";
import { useUser } from "@/lib/auth/use-user";
import styles from "./AuthNav.module.css";

export function AuthNav() {
  const C = t();
  const { user, loading } = useUser();

  return (
    <div className={styles.authNav} data-auth-nav>
      {loading ? null : user ? (
        <>
          <Link href="/konto" className={styles.link}>
            {C.auth.nav.konto}
          </Link>
          <span className={styles.sep}>/</span>
          <form method="post" action="/auth/logg-ut" className={styles.form}>
            <button type="submit" className={styles.logout}>
              {C.auth.nav.logout}
            </button>
          </form>
        </>
      ) : (
        <Link href="/logg-inn" className={styles.link}>
          {C.auth.nav.login}
        </Link>
      )}
    </div>
  );
}
