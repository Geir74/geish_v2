/*
 * ProjectsRow — 5 prosjekt-cards i en rad. Vekslende rotasjon ±0.6°.
 * Lenke per card avhenger av p.href:
 *   - http(s)://… → ekstern <a>
 *   - intern path (starter med /) → <Link>
 *   - null → ingen lenke-wrapper, kun <div>
 * Returnerer null hvis ingen prosjekter.
 */
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { StatusBadge, type Status } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./ProjectsRow.module.css";

export interface ProjectsRowProps {}

interface ProjectCardData {
  name: string;
  href: string | null;
  desc: string;
  status: string;
  tag: string;
}

function CardInner({ p }: { p: ProjectCardData }): ReactElement {
  return (
    <>
      <div className={styles.nm}>{p.name}</div>
      <div className={styles.ds}>{p.desc}</div>
      <div className={styles.row}>
        <span className={styles.tag}>{p.tag}</span>
        <StatusBadge status={p.status as Status} />
      </div>
    </>
  );
}

function ProjectCard({
  p,
  idx,
}: {
  p: ProjectCardData;
  idx: number;
}): ReactElement {
  const inner: ReactNode = <CardInner p={p} />;
  if (!p.href) {
    return (
      <div className={styles.card} data-idx={idx}>
        {inner}
      </div>
    );
  }
  if (p.href.startsWith("http")) {
    return (
      <a
        href={p.href}
        className={styles.card}
        data-idx={idx}
        rel="noopener noreferrer"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={p.href} className={styles.card} data-idx={idx}>
      {inner}
    </Link>
  );
}

export function ProjectsRow(_props: ProjectsRowProps = {}): ReactElement | null {
  const C = t();
  const projects = C.projects.slice(0, 5);
  if (projects.length === 0) return null;
  return (
    <div className={styles.box}>
      <div className={styles.head}>
        <h3 className={styles.h3}>Prosjekter</h3>
        <span className={styles.sub}>Subdomener · *.geish.no</span>
      </div>
      <div className={styles.grid5}>
        {projects.map((p, i) => (
          <ProjectCard key={p.name} p={p as ProjectCardData} idx={i} />
        ))}
      </div>
    </div>
  );
}
