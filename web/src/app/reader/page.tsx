"use client";

import { useActionState } from "react";
import { extractArticle, type ExtractState } from "./actions";
import styles from "./reader.module.css";

const initialState: ExtractState = { status: "idle" };

export default function ReaderPage() {
  const [state, formAction, pending] = useActionState(extractArticle, initialState);

  return (
    <div className={styles.page}>
      <h1>reader</h1>
      <p className={styles.hint}>
        Paste an article link to get back the text only — no images, no video.
      </p>

      <form action={formAction} className={styles.form}>
        <input
          type="url"
          name="url"
          required
          placeholder="https://..."
          className={styles.urlInput}
          disabled={pending}
        />
        <button type="submit" className={styles.submitBtn} disabled={pending}>
          {pending ? "reading..." : "read"}
        </button>
      </form>

      {state.status === "error" && <p className={styles.error}>{state.message}</p>}

      {state.status === "success" && (
        <article className={styles.result}>
          {state.title && <h2>{state.title}</h2>}
          {state.byline && <p className={styles.byline}>{state.byline}</p>}
          <div className={styles.body}>
            {state.text.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
