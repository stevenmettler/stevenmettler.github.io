"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/lib/goal-progress";

/**
 * The ticking display for a running stopwatch.
 *
 * It counts up from the elapsed time the server measured at render, plus time
 * since mount, so a browser clock that disagrees with the server cannot skew
 * the reading. Nothing here is authoritative: the duration that gets saved is
 * computed on the server when the timer is stopped.
 */
export function LiveTimer({
  startedAt,
  initialElapsedSeconds,
}: {
  startedAt: string;
  initialElapsedSeconds: number;
}) {
  const [elapsed, setElapsed] = useState(initialElapsedSeconds);

  useEffect(() => {
    const mountedAt = Date.now();
    const tick = () =>
      setElapsed(initialElapsedSeconds + (Date.now() - mountedAt) / 1000);

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [initialElapsedSeconds]);

  // The server and the browser render a moment apart, so the first paint can
  // legitimately differ by a second.
  return (
    <time dateTime={startedAt} suppressHydrationWarning>
      {formatClock(elapsed)}
    </time>
  );
}
