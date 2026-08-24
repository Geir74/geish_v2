/*
 * ProfileForm — client-komponent for å redigere eget visningsnavn + bio.
 *
 * Progressiv: `<form action={formAction}>` funker uten JS (server action).
 * Client-laget legger kun tegnteller + inline status oppå. Matcher E3s
 * «funker uten JS»-linje.
 *
 * All copy fra profil-slicen i no.ts (utkast, Geir godkjenner).
 */
"use client";

import { useActionState, useState } from "react";
import { t } from "@/content/i18n";
import { updateProfile, type ProfileFormState } from "./actions";
import styles from "./page.module.css";

const BIO_MAX = 300;

type Props = {
  displayName: string | null;
  bio: string | null;
};

const initialState: ProfileFormState = { status: "idle" };

export function ProfileForm({ displayName, bio }: Props) {
  const C = t().profil;
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );
  const [bioLen, setBioLen] = useState((bio ?? "").length);

  const statusText = messageFor(state, C);

  return (
    <form action={formAction} className={styles.form}>
      <label className={styles.field}>
        <span className={styles.label}>{C.displayNameLabel}</span>
        <input
          type="text"
          name="display_name"
          defaultValue={displayName ?? ""}
          placeholder={C.displayNamePlaceholder}
          minLength={2}
          maxLength={40}
          className={styles.input}
          autoComplete="off"
        />
        <span className={styles.hint}>{C.displayNameHint}</span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>{C.bioLabel}</span>
        <textarea
          name="bio"
          defaultValue={bio ?? ""}
          placeholder={C.bioPlaceholder}
          maxLength={BIO_MAX}
          rows={4}
          className={styles.textarea}
          onChange={(e) => setBioLen(e.target.value.length)}
        />
        <span className={styles.hint}>
          {BIO_MAX - bioLen} {C.charsLeft}
        </span>
      </label>

      <p className={styles.notice}>{C.publicNotice}</p>

      <div className={styles.actions}>
        <button type="submit" className={styles.save} disabled={pending}>
          {pending ? C.saving : C.save}
        </button>
        {statusText ? (
          <span
            className={
              state.status === "error" ? styles.statusErr : styles.statusOk
            }
            role="status"
          >
            {statusText}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function messageFor(
  state: ProfileFormState,
  C: ReturnType<typeof t>["profil"],
): string | null {
  if (state.status === "idle" || !state.message) {
    return null;
  }
  switch (state.message) {
    case "saved":
      return C.saved;
    case "nameInUse":
      return C.nameInUse;
    case "unauthenticated":
      return C.errorUnauthenticated;
    case "displayNameTooShort":
      return C.errorNameTooShort;
    case "displayNameTooLong":
      return C.errorNameTooLong;
    case "bioTooLong":
      return C.errorBioTooLong;
    default:
      return null;
  }
}
