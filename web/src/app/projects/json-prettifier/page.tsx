"use client";

import { useRef, useState } from "react";
import styles from "./page.module.css";

export default function JsonPrettifierPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const outputRef = useRef<HTMLPreElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function formatJSON(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setOutput("");
      setIsError(false);
      return;
    }

    try {
      const cleanInput = trimmed
        .replace(/[\n\r\t]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const parsed = JSON.parse(cleanInput);
      setOutput(JSON.stringify(parsed, null, 4));
      setIsError(false);
    } catch (error) {
      setOutput(`Error: ${(error as Error).message}`);
      setIsError(true);
    }
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => formatJSON(value), 300);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }

  function handleOutputKeyDown(e: React.KeyboardEvent<HTMLPreElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "a") {
      e.preventDefault();
      const el = outputRef.current;
      if (!el) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.section}>
          <h2>Input JSON</h2>
          <textarea
            className={styles.textarea}
            placeholder="Paste your JSON here..."
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                formatJSON(input);
              }
            }}
          />
          <button className={styles.formatBtn} onClick={() => formatJSON(input)}>
            Format JSON
          </button>
        </div>
        <div className={styles.section}>
          <h2>Formatted JSON</h2>
          <pre
            ref={outputRef}
            className={styles.output}
            style={{ color: isError ? "#dc3545" : "#333" }}
            tabIndex={0}
            onKeyDown={handleOutputKeyDown}
          >
            {output}
          </pre>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
