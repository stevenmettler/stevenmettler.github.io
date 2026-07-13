"use client";

import { useLayoutEffect, useRef } from "react";

function labelFor(theme: string | null) {
  return theme === "dark" ? "☾ dark" : "☀ light";
}

export function ThemeToggle() {
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.textContent = labelFor(
        document.documentElement.getAttribute("data-theme")
      );
    }
  }, []);

  function toggle() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sm-theme", next);
    } catch {}
    if (ref.current) ref.current.textContent = labelFor(next);
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={toggle}
      className="sm-theme-toggle"
      title="light / dark"
    >
      ☀ light
    </button>
  );
}
