import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "steven mettler ~ skullbreaker",
};

export default function SkullbreakerPage() {
  return (
    <iframe
      src="/games/skullbreaker.html"
      title="Skullbreaker"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        display: "block",
      }}
    />
  );
}
