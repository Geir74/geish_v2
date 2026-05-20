/*
 * FooterRow — 3-kolonners footer: VisitorCounter / WebringWidget (card) / UC-banner.
 * Bruker kun shared-komponenter — denne komponenten er en ren layout-wrapper.
 */
import {
  UnderConstructionBanner,
  VisitorCounter,
  WebringWidget,
} from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./FooterRow.module.css";

export interface FooterRowProps {}

export function FooterRow(_props: FooterRowProps = {}) {
  const C = t();
  return (
    <div className={styles.row}>
      <div className={styles.left}>
        <VisitorCounter
          count={C.meta.visitors}
          label={C.meta.visitors_label}
          size="sm"
        />
      </div>
      <div className={styles.center}>
        <WebringWidget variant="card" />
      </div>
      <div className={styles.right}>
        <UnderConstructionBanner />
      </div>
    </div>
  );
}
