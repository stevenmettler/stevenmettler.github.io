"use client";

import { useActionState, useEffect, useRef, useState, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { extractArticle, type ExtractState } from "./actions";
import type { ArticleBlock } from "@/lib/extract-blocks";
import styles from "./reader.module.css";

const initialState: ExtractState = { status: "idle" };

// Renders extracted blocks as literal text children (never
// dangerouslySetInnerHTML), so nothing but plain text can ever appear
// here regardless of what was on the source page. Consecutive list
// items are grouped into a single <ul> for valid, readable markup.
function renderBlocks(blocks: ArticleBlock[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === "listitem") {
      const items: string[] = [];
      while (i < blocks.length && blocks[i].type === "listitem") {
        items.push((blocks[i] as { type: "listitem"; text: string }).text);
        i++;
      }
      nodes.push(
        <ul key={`list-${i}`} className={styles.list}>
          {items.map((text, idx) => (
            <li key={idx}>{text}</li>
          ))}
        </ul>
      );
      continue;
    }

    switch (block.type) {
      case "heading":
        nodes.push(
          <h3 key={i} className={styles.heading}>
            {block.text}
          </h3>
        );
        break;
      case "quote":
        nodes.push(
          <blockquote key={i} className={styles.quote}>
            {block.text}
          </blockquote>
        );
        break;
      case "code":
        nodes.push(
          <pre key={i} className={styles.code}>
            {block.text}
          </pre>
        );
        break;
      default:
        nodes.push(<p key={i}>{block.text}</p>);
    }
    i++;
  }

  return nodes;
}

function ReaderForm() {
  const [state, formAction, pending] = useActionState(extractArticle, initialState);
  const searchParams = useSearchParams();
  const sharedUrl = searchParams.get("url") ?? "";
  const formRef = useRef<HTMLFormElement>(null);
  const hasAutoSubmitted = useRef(false);
  const [inputValue] = useState(sharedUrl);

  // Lets a URL arrive via ?url=... (e.g. from an iOS Shortcut) and read
  // immediately, without requiring a manual paste + tap.
  useEffect(() => {
    if (sharedUrl && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      formRef.current?.requestSubmit();
    }
  }, [sharedUrl]);

  return (
    <div className={styles.page}>
      <h1>reader</h1>
      <p className={styles.hint}>
        Paste an article link to get back the text only — no images, no video.
      </p>

      <form ref={formRef} action={formAction} className={styles.form}>
        <input
          type="url"
          name="url"
          required
          placeholder="https://..."
          defaultValue={inputValue}
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
          {state.title && <h2 className={styles.title}>{state.title}</h2>}
          {state.byline && <p className={styles.byline}>{state.byline}</p>}
          <div className={styles.body}>{renderBlocks(state.blocks)}</div>
        </article>
      )}
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Loading…</div>}>
      <ReaderForm />
    </Suspense>
  );
}
