/*
 * /stua — romoversikt (E6, task 3.4). Bak innloggings-guard (layout).
 * Lister de fem rommene i admin-definert rekkefølge.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/content/i18n";
import { getRooms } from "@/lib/stua/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stua — geish.no",
  description: "Lukket forum for prosjektene.",
  robots: { index: false, follow: false },
};

export default async function StuaPage() {
  const C = t();
  const S = C.stuaForum;
  const rooms = await getRooms();

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>STUA</span>
      </div>

      <h1 className={styles.h1}>
        {S.title}
        <span className={styles.acc}>.</span>
      </h1>
      <p className={styles.intro}>{S.intro}</p>

      <section className={styles.rooms}>
        <h2 className={styles.roomsHeading}>{S.roomsHeading}</h2>
        <ul className={styles.roomList}>
          {rooms.map((room) => (
            <li key={room.id} className={styles.room}>
              <Link href={`/stua/${room.slug}`} className={styles.roomLink}>
                <span className={styles.roomName}>{room.name}</span>
                {room.description ? (
                  <span className={styles.roomDesc}>{room.description}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
