/*
 * Forsiden — minimal placeholder. Selve Cut & Paste Zine-forsiden bygges i
 * `e1-forside`-mandatet. Designsystemet ligger på /styleguide.
 */
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.inner}>
        <h1 className={styles.title}>geish v2</h1>
        <p className={styles.note}>
          Forsiden bygges i e1-forside-mandatet. Designsystemet ligger på{" "}
          <a href="/styleguide">/styleguide</a>.
        </p>
      </div>
    </main>
  );
}
