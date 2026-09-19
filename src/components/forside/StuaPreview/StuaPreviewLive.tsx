"use client";

/*
 * StuaPreviewLive — client-boundary for forside-Stua-previewen (E6 bolk 7).
 *
 * PERSONVERN: viser server-rendret `statsFallback` (kun antall + login-CTA) helt
 * til useUser() bekrefter innlogget sesjon. FØRST da hentes nyeste trådtitler
 * fra /api/stua/recent (dynamisk, auth-guardet route handler). Titler når derfor
 * ALDRI statisk HTML eller utloggede lesere.
 *
 * useUser er kosmetisk (styrer visning), ikke tilgangskontroll — selve titlene
 * beskyttes server-side i route handleren (getUser før query).
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { t } from "@/content/i18n";
import { useUser } from "@/lib/auth/use-user";
import styles from "./StuaPreview.module.css";

type RecentThread = { slug: string; title: string; replyCount: number };

export function StuaPreviewLive({
  statsFallback,
}: {
  statsFallback: ReactNode;
}) {
  const C = t();
  const { user, loading } = useUser();
  const [threads, setThreads] = useState<RecentThread[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      // Ingen sesjon: ikke hent, og la neste render vise trygt fallback.
      // (Ingen setState her — render-grenen under styrer visningen fra `user`.)
      return;
    }
    fetch("/api/stua/recent", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { threads: [] }))
      .then((data: { threads?: RecentThread[] }) => {
        if (!cancelled) setThreads(data.threads ?? []);
      })
      .catch(() => {
        if (!cancelled) setThreads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Utlogget (eller mens vi avgjør): trygt server-fallback + login-CTA.
  if (loading || !user) {
    return (
      <>
        {statsFallback}
        <div className={styles.more}>
          <Link href="/logg-inn?next=/stua">→ {C.stua.preview.loginCta}</Link>
        </div>
      </>
    );
  }

  // Innlogget, henter fortsatt: behold fallback (unngår layout-hopp).
  if (threads === null) {
    return (
      <>
        {statsFallback}
        <div className={styles.more}>
          <Link href="/stua">→ {C.stua.preview.enterCta}</Link>
        </div>
      </>
    );
  }

  if (threads.length === 0) {
    return (
      <>
        <div className={styles.thread}>{C.stua.empty}</div>
        <div className={styles.more}>
          <Link href="/stua">→ {C.stua.preview.enterCta}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      {threads.map((th) => (
        <Link
          href={`/stua/t/${th.slug}`}
          className={styles.thread}
          key={th.slug}
        >
          › {th.title}
          <div className={styles.meta}>
            {th.replyCount} {C.stua.preview.threadsReplies}
          </div>
        </Link>
      ))}
      <div className={styles.more}>
        <Link href="/stua">→ {C.stua.preview.enterCta}</Link>
      </div>
    </>
  );
}
