import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "steven mettler ~ freefall",
};

export default function FreefallPage() {
  return (
    <iframe
      src="/games/freefall.html"
      title="Freefall"
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
