/*
 * StatusBadge — tekst-prikk, aldri emoji.
 * "Status med ord, ikke emoji" (§1.7). LIVE / WIP / IDÉ er kanon — ingen 🟢.
 */
import styles from "./StatusBadge.module.css";

export type Status = "live" | "wip" | "idea";

export interface StatusBadgeProps {
  status: Status;
}

const LABELS: Record<Status, string> = {
  live: "LIVE",
  wip: "WIP",
  idea: "IDÉ",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={styles.badge} data-status={status}>
      {LABELS[status]}
    </span>
  );
}
