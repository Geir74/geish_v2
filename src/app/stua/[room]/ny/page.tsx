/*
 * /stua/[room]/ny — skjema for ny tråd i et rom (E6). Bak innloggings-guard.
 * Ukjent rom → notFound.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { t } from "@/content/i18n";
import { getRoomBySlug } from "@/lib/stua/queries";
import { NewThreadForm } from "./NewThreadForm";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ny tråd — Stua — geish.no",
  robots: { index: false, follow: false },
};

export default async function NyTradPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room: roomSlug } = await params;
  const C = t();
  const S = C.stuaForum;

  const room = await getRoomBySlug(roomSlug);
  if (!room) notFound();

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <Link href="/stua">STUA</Link>
        <span className={styles.sep}>/</span>
        <Link href={`/stua/${room.slug}`}>{room.name.toUpperCase()}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{S.newThread.toUpperCase()}</span>
      </div>

      <h1 className={styles.h1}>
        {S.newThread}
        <span className={styles.acc}>.</span>
      </h1>

      <NewThreadForm roomSlug={room.slug} />
    </main>
  );
}
