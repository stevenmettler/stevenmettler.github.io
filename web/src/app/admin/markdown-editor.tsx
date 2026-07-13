"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function MarkdownEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div data-color-mode="light">
      <MDEditor value={value} onChange={(v) => setValue(v ?? "")} height={400} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
