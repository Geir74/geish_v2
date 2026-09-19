/*
 * StuaPreview — preview av diskusjonsforumet (E6 bolk 7). Rotert -0.8°.
 * Photo-tape sentrert på toppen.
 *
 * PERSONVERN + YTELSE (bolk 7): trådtitler er innhold BAK DØRA. Server rendrer
 * KUN det trygge (aggregerte antall + «logg inn»-CTA) → havner i den statiske
 * ISR-HTML-en, ingen titler lekker til utloggede, og forsiden består som ISR
 * (ikke gjort dynamisk av auth-cookies).
 *
 * Innloggede lesere: en liten client-boundary (StuaPreviewLive) sjekker sesjon
 * i browseren (useUser, kosmetisk) og henter nyeste trådtitler fra en dynamisk
 * route handler — først da vises titlene, aldri i statisk HTML.
 */
import { t } from "@/content/i18n";
import { getStuaPublicStats } from "@/lib/stua/queries";
import { StuaPreviewLive } from "./StuaPreviewLive";
import styles from "./StuaPreview.module.css";

export async function StuaPreview(): Promise<React.ReactElement> {
  const C = t();
  const stats = await getStuaPublicStats();

  return (
    <div className={styles.box}>
      <span className={styles.tape} aria-hidden />
      <h3 className={styles.h3}>Stua → akkurat nå</h3>
      {/*
       * Statisk, trygt for alle: kun antall. Client-boundaryen erstatter dette
       * med nyeste trådtitler NÅR (og bare når) leseren er innlogget.
       */}
      <StuaPreviewLive
        statsFallback={
          <>
            <div className={styles.stats}>
              {stats.threadCount} {C.stua.preview.threadsWord} ·{" "}
              {stats.roomCount} {C.stua.preview.roomsWord}
            </div>
            <div className={styles.thread}>{C.stua.preview.locked}</div>
          </>
        }
      />
    </div>
  );
}
