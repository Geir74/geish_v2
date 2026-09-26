/*
 * SiteNav — global navigasjon (avrevne papirlapper). Client component montert
 * i rot-layouten: hydreres oppå statisk HTML og leser auth-tilstand i
 * nettleseren via useUser() — statiske ruter forblir statiske (e3-auth D5).
 *
 * Absorberer tidligere AuthNav: logg inn / min side / logg ut.
 *
 * Rom-stiene ligger som STATISK array her (ikke i i18n) — kun rom som faktisk
 * finnes lenkes. Labels hentes fra i18n (nav.*). Aktiv rute via usePathname().
 *
 * Loading-tilstand: reservert placeholder med fast dimensjon (ikke null), så
 * auth-delen ikke forskyver rom-lenkene når den hydreres (ingen layout-shift).
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { t } from "@/content/i18n";
import { useUser } from "@/lib/auth/use-user";
import styles from "./SiteNav.module.css";

export function SiteNav() {
  const C = t();
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Rom som faktisk finnes (D2). Rekkefølge = D6.
  const rooms: ReadonlyArray<{ href: string; label: string }> = [
    { href: "/", label: C.nav.hjem },
    { href: "/blogg", label: C.nav.blogg },
    { href: "/surdeig", label: C.nav.surdeig },
    { href: "/gjestebok", label: C.nav.gjestebok },
    { href: "/manifest", label: C.nav.manifest },
  ];

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className={styles.siteNav} aria-label="Hovednavigasjon" data-site-nav>
      <ul className={styles.rooms}>
        {rooms.map((room) => (
          <li key={room.href}>
            <Link
              href={room.href}
              className={`${styles.tab} ${isActive(room.href) ? styles.active : ""}`}
              aria-current={isActive(room.href) ? "page" : undefined}
            >
              {room.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Auth-del: reservert plass mens loading (ingen layout-shift/blink). */}
      <div className={styles.auth} data-auth-slot>
        {loading ? (
          <span className={styles.authPlaceholder} aria-hidden="true" />
        ) : user ? (
          <>
            <Link href="/konto" className={styles.tab}>
              {C.auth.nav.konto}
            </Link>
            <form
              method="post"
              action="/auth/logg-ut"
              className={styles.logoutForm}
            >
              <button type="submit" className={styles.logout}>
                {C.auth.nav.logout}
              </button>
            </form>
          </>
        ) : (
          <Link href="/logg-inn" className={styles.tab}>
            {C.auth.nav.login}
          </Link>
        )}
      </div>
    </nav>
  );
}
