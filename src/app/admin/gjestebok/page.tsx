/*
 * /admin/gjestebok — moderering av gjesteboka (E5, task 4.2).
 *
 * Guard arves fra /admin/layout.tsx (isAdmin, fail closed, 404 for ikke-admin).
 * Leser ALLE innlegg via Drizzle (server-connection omgår RLS — bevist i
 * scripts/verify-bypass.mjs). Nyeste øverst, PENDING fremhevet og sortert først
 * så det som venter godkjenning er lett å se (D4).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";
import { t } from "@/content/i18n";
import { EntryRow } from "./EntryRow";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gjestebok — Admin — geish.no",
  description: "Moderering.",
  robots: { index: false, follow: false },
};

// Pending først (venter godkjenning), deretter nyeste øverst.
function pendingRank(status: string): number {
  return status === "pending" ? 0 : 1;
}

export default async function AdminGjestebokPage() {
  const A = t().admin;
  const G = A.gjestebok;

  const rows = await db
    .select({
      id: guestbookEntries.id,
      authorName: guestbookEntries.authorName,
      body: guestbookEntries.body,
      status: guestbookEntries.status,
      createdAt: guestbookEntries.createdAt,
    })
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.createdAt));

  const entries = [...rows].sort(
    (a, b) => pendingRank(a.status) - pendingRank(b.status),
  );

  return (
    <main className={styles.page}>
      <nav className={styles.crumb} aria-label="Sti">
        <Link href="/">geish.no</Link>
        <span className={styles.sep}>/</span>
        <Link href="/admin">{A.crumb}</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{G.crumb}</span>
      </nav>

      <div className={styles.wrap}>
        <h1 className={styles.h1}>
          {G.heading}
          <span className={styles.acc}>.</span>
        </h1>
        <p className={styles.lede}>{G.lede}</p>

        {entries.length === 0 ? (
          <div className={styles.empty}>{G.empty}</div>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={{
                  id: entry.id,
                  authorName: entry.authorName,
                  body: entry.body,
                  status: entry.status as "pending" | "published" | "hidden",
                  createdAt: entry.createdAt.toISOString(),
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
