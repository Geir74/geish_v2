/*
 * IntroNote — gul "lapp" rotert +1.2°. Geirs personlige intro med lenke til
 * manifestet. Box-shadow gir den "festet på papiret"-følelsen.
 */
import Link from "next/link";
import { t } from "@/content/i18n";
import styles from "./IntroNote.module.css";

export interface IntroNoteProps {}

export function IntroNote(_props: IntroNoteProps = {}) {
  const C = t();
  return (
    <div className={styles.note}>
      <h2 className={styles.hello}>Hei. Jeg heter Geir.</h2>
      <div className={styles.body}>{C.hero.intro_long}</div>
      <div className={styles.more}>
        <Link href="/manifest">→ Les manifestet</Link>
      </div>
    </div>
  );
}
