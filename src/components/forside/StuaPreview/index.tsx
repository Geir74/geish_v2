/*
 * StuaPreview — preview av diskusjonsforumet. Rotert -0.8°. Photo-tape
 * sentrert på toppen. Gul ukens-spørsmål-kort, 4 første tråder med › og meta.
 * Returnerer null hvis hverken ukens-spørsmål eller tråder finnes.
 */
import Link from "next/link";
import { t } from "@/content/i18n";
import styles from "./StuaPreview.module.css";

export function StuaPreview(): React.ReactElement | null {
  const C = t();
  const threads = C.stua.threads.slice(0, 4);
  if (!C.stua.week_question && threads.length === 0) return null;
  return (
    <div className={styles.box}>
      <span className={styles.tape} aria-hidden />
      <h3 className={styles.h3}>Stua → akkurat nå</h3>
      {C.stua.week_question ? (
        <div className={styles.qcard}>
          <strong>UKENS SPØRSMÅL</strong>
          {C.stua.week_question}
        </div>
      ) : null}
      {threads.map((th, i) => (
        <div className={styles.thread} key={i}>
          › {th.title}
          <div className={styles.meta}>
            {th.who} · {th.replies} svar · {th.last}
          </div>
        </div>
      ))}
      <div className={styles.more}>
        <Link href="/stua">→ Logg inn</Link>
      </div>
    </div>
  );
}
