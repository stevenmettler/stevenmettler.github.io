"use client";

import { useEffect, useRef, useState } from "react";
import { reactToPost } from "./reactions-actions";
import { REACTION_EMOJI } from "@/lib/reaction-emoji";

export function Reactions({
  postId,
  initialCounts,
}: {
  postId: number;
  initialCounts: Record<string, number>;
}) {
  const [counts, setCounts] = useState(initialCounts);
  const reactedRef = useRef<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stored: string[] = [];
    try {
      const raw = localStorage.getItem(`sm-reacted-${postId}`);
      stored = raw ? JSON.parse(raw) : [];
    } catch {}

    reactedRef.current = new Set(stored);
    const container = containerRef.current;
    if (container) {
      for (const emoji of stored) {
        const btn = container.querySelector<HTMLButtonElement>(
          `[data-emoji="${emoji}"]`
        );
        if (btn) btn.disabled = true;
      }
    }
  }, [postId]);

  async function handleReact(emoji: string, button: HTMLButtonElement) {
    if (reactedRef.current.has(emoji)) return;

    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    reactedRef.current.add(emoji);
    button.disabled = true;

    try {
      localStorage.setItem(
        `sm-reacted-${postId}`,
        JSON.stringify([...reactedRef.current])
      );
    } catch {}

    try {
      await reactToPost(postId, emoji);
    } catch {
      // best-effort — a failed increment just means the count may be
      // slightly stale until the next reload
    }
  }

  return (
    <div className="sm-reactions" ref={containerRef}>
      {REACTION_EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          data-emoji={emoji}
          className="sm-reaction-btn"
          onClick={(e) => handleReact(emoji, e.currentTarget)}
        >
          <span>{emoji}</span>
          <span className="sm-reaction-count">{counts[emoji] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
