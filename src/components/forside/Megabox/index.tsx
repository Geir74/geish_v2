/*
 * Megabox — hero-seksjonen. Sort boks med plakat-headline i Bungee:
 * "STAY / GROUNDED, / CREATE SHIT." der "CREATE" har LED-oransje aksent.
 * HalftoneBlock-dekor stikker bevisst ut av kanten (overflow: hidden klipper).
 */
import { HalftoneBlock } from "@/components/shared";
import { t } from "@/content/i18n";
import styles from "./Megabox.module.css";

export interface MegaboxProps {}

export function Megabox(_props: MegaboxProps = {}) {
  const C = t();
  return (
    <div className={styles.box}>
      <div className={styles.super}>
        {C.brand.name} · {C.brand.estd} · {C.brand.location.toUpperCase()}
      </div>
      <h1 className={styles.h1}>
        {C.hero.credo_lines.l1}
        <br />
        {C.hero.credo_lines.l2}
        <br />
        <span className={styles.acc}>{C.hero.credo_lines.l3a}</span>{" "}
        {C.hero.credo_lines.l3b}
      </h1>
      <div className={styles.sub}>{C.hero.intro_short}</div>
      <div className={styles.deco} aria-hidden>
        <HalftoneBlock w={220} h={220} density={0.55} color="oklch(85% 0.08 80)" />
      </div>
    </div>
  );
}
