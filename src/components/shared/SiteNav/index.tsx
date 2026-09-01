/*
 * SiteNav — global navigasjon (mandate-global-nav).
 *
 * Én samlet client-komponent montert i rot-layouten: rom-lenker («avrevne
 * papirlapper») + innlogget-tilstand. Absorberer tidligere AuthNav (D1).
 *
 * STATISK RENDER (D4 / e3-auth D5): "use client" + useUser() henter auth i
 * nettleseren, aldri server-side cookies → forside/blogg forblir statiske.
 * Mens useUser() laster: auth-lappen holder reservert plass (ingen
 * layout-shift, ingen "LOGG INN"-blink for innloggede).
 *
 * Kun lenker til rom som finnes (D2) — Stua/Gjestebok legges til ved E5/E6.
 * Mobil: lappene flex-wrapper, ingen hamburger (D5).
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/content/i18n";
import { useUser } from "@/lib/auth/use-user";
import styles from "./SiteNav.module.css";

export function SiteNav() {
  const C = t();
  const pathname = usePathname();
  const { user, loading } = useUser();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className={styles.nav} data-site-nav aria-label="Hovednavigasjon">
      <ul className={styles.links}>
        {C.nav.links.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className={styles.item}>
              <Link
                href={item.href}
                className={`${styles.scrap} ${active ? styles.active : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Auth-lapp — reservert plass mens useUser() laster. */}
      <div className={styles.auth} data-auth-nav>
        {loading ? (
          <span className={styles.authPlaceholder} aria-hidden="true" />
        ) : user ? (
          <>
            <Link
              href="/konto"
              className={`${styles.scrap} ${
                isActive("/konto") ? styles.active : ""
              }`}
              aria-current={isActive("/konto") ? "page" : undefined}
            >
              {C.nav.konto}
            </Link>
            <form
              method="post"
              action="/auth/logg-ut"
              className={styles.logoutForm}
            >
              <button type="submit" className={styles.logout}>
                {C.nav.logout}
              </button>
            </form>
          </>
        ) : (
          <Link href="/logg-inn" className={styles.scrap}>
            {C.nav.login}
          </Link>
        )}
      </div>
    </nav>
  );
}
