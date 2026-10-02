"use client";

/*
 * ThreadOwnerControls — flytt eller slett EGEN tråd (E6 bolk 11.1).
 *
 * Flytting endrer kun room_id; slug og URL består (F1). Sletting tillates
 * KUN mens tråden er tom (replyCount === 0) — besvarte tråder må admin ta.
 * Begge begrensninger håndheves server-side i actionene; dette er visning.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/content/i18n";
import { deleteOwnThread, moveOwnThread } from "../../actions";
import styles from "../../page.module.css";

export function ThreadOwnerControls({
  threadId,
  currentRoomSlug,
  replyCount,
  rooms,
}: {
  threadId: string;
  currentRoomSlug: string;
  replyCount: number;
  rooms: { slug: string; name: string }[];
}) {
  const S = t().stuaForum;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleMove(formData: FormData) {
    const target = String(formData.get("roomSlug") ?? "");
    if (!target || target === currentRoomSlug) return;
    setPending(true);
    setError(null);
    const res = await moveOwnThread(threadId, target);
    setPending(false);
    if (res.ok) router.refresh();
    else setError(res.message);
  }

  async function handleDelete() {
    if (!window.confirm(S.owner.deleteConfirm)) return;
    setPending(true);
    setError(null);
    const res = await deleteOwnThread(threadId);
    setPending(false);
    if (res.ok) router.push("/stua");
    else setError(res.message);
  }

  return (
    <section className={styles.ownerPanel}>
      <form action={handleMove} className={styles.ownerRow}>
        <label className={styles.field}>
          <span className={styles.label}>{S.owner.moveHeading}</span>
          <select
            name="roomSlug"
            defaultValue={currentRoomSlug}
            className={styles.ownerSelect}
          >
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? S.form.submitting : S.owner.moveSubmit}
        </button>
      </form>

      {replyCount === 0 ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className={styles.ownerDanger}
        >
          {S.owner.deleteSubmit}
        </button>
      ) : (
        <p className={styles.ownerNote}>{S.owner.deleteOnlyEmpty}</p>
      )}

      {error ? (
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      ) : null}
    </section>
  );
}
