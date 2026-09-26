"use client";

/*
 * EntryRow — én rad i admin-gjestebok-panelet (E5, task 4.2/4.3b).
 *
 * Handlinger: vis / skjul / slett (server actions) + inline rediger (navn+hilsen,
 * rører ALDRI status — D4). Slett bekreftes. Alle actions guardes av isAdmin()
 * på server-siden; denne komponenten er kun UI.
 */
import { useState, useTransition } from "react";
import { t } from "@/content/i18n";
import {
  deleteEntry,
  editEntry,
  hideEntry,
  showEntry,
} from "./actions";
import styles from "./page.module.css";

type Entry = {
  id: string;
  authorName: string;
  body: string;
  status: "pending" | "published" | "hidden";
  createdAt: string; // ISO
};

export function EntryRow({ entry }: { entry: Entry }) {
  const G = t().admin.gjestebok;
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const statusLabel =
    entry.status === "pending"
      ? G.statusPending
      : entry.status === "published"
        ? G.statusPublished
        : G.statusHidden;

  function run(action: () => Promise<unknown>) {
    startTransition(() => {
      void action();
    });
  }

  function handleDelete() {
    if (window.confirm(G.confirmDelete)) {
      run(() => deleteEntry(entry.id));
    }
  }

  function handleEditSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await editEntry(formData);
      if (res.ok) setEditing(false);
    });
  }

  return (
    <li
      className={`${styles.row} ${entry.status === "pending" ? styles.rowPending : ""}`}
    >
      <div className={styles.rowHead}>
        <span className={`${styles.badge} ${styles["badge_" + entry.status]}`}>
          {statusLabel}
        </span>
        <span className={styles.rowName}>{entry.authorName}</span>
        <time className={styles.rowDate} dateTime={entry.createdAt}>
          {new Date(entry.createdAt).toLocaleDateString("nb-NO")}
        </time>
      </div>

      {editing ? (
        <form action={handleEditSubmit} className={styles.editForm}>
          <input type="hidden" name="id" value={entry.id} />
          <p className={styles.editNote}>{G.editNote}</p>
          <label className={styles.editField}>
            <span>{G.editNameLabel}</span>
            <input
              type="text"
              name="author_name"
              defaultValue={entry.authorName}
              maxLength={60}
              required
              className={styles.editInput}
            />
          </label>
          <label className={styles.editField}>
            <span>{G.editBodyLabel}</span>
            <textarea
              name="body"
              defaultValue={entry.body}
              maxLength={2000}
              rows={4}
              required
              className={styles.editTextarea}
            />
          </label>
          <div className={styles.actions}>
            <button type="submit" disabled={pending} className={styles.btn}>
              {G.save}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={pending}
              className={styles.btnGhost}
            >
              {G.cancel}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className={styles.rowBody}>{entry.body}</p>
          <div className={styles.actions}>
            {entry.status !== "published" && (
              <button
                type="button"
                onClick={() => run(() => showEntry(entry.id))}
                disabled={pending}
                className={styles.btn}
              >
                {G.show}
              </button>
            )}
            {entry.status !== "hidden" && (
              <button
                type="button"
                onClick={() => run(() => hideEntry(entry.id))}
                disabled={pending}
                className={styles.btnGhost}
              >
                {G.hide}
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
              className={styles.btnGhost}
            >
              {G.edit}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className={styles.btnDanger}
            >
              {G.delete}
            </button>
          </div>
        </>
      )}
    </li>
  );
}
