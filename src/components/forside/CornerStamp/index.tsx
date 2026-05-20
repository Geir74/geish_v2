/*
 * CornerStamp — stort rødt gummistempel i hjørnet av forsiden. Rotert -7°.
 * Skiller seg fra shared `<Stamp>` ved å være kraftigere (4px double border)
 * og inneholde en sub-linje med små bokstaver. Custom modul, ikke shared.
 */
import styles from "./CornerStamp.module.css";

export interface CornerStampProps {}

export function CornerStamp(_props: CornerStampProps = {}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.stamp}>
        Privat·Eid
        <span className={styles.small}>no ads · no algorithm · no tracking</span>
      </div>
    </div>
  );
}
