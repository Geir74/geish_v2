/*
 * /logg-inn — innloggingsside (design D6 i e3-auth). Server component som
 * redirecter allerede-innloggede til /konto, ellers rendrer LoginForm
 * (client). Dynamisk rute (leser cookies via getUser) — det er meningen.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { t } from "@/content/i18n";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Logg inn — geish.no",
  description: "Passordløs innlogging med magisk lenke på e-post.",
};

export default async function LoggInnPage() {
  const C = t();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/konto");
  }

  return (
    <main className={`${styles.page} paper`}>
      <div className={styles.crumb}>
        <span>{C.brand.name.toUpperCase()}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>LOGG INN</span>
      </div>

      <div className={styles.wrap}>
        <h1 className={styles.h1}>
          {C.auth.login.heading.replace(".", "")}
          <span className={styles.acc}>.</span>
        </h1>
        <p className={styles.deck}>{C.auth.login.deck}</p>
        <LoginForm />
      </div>
    </main>
  );
}
