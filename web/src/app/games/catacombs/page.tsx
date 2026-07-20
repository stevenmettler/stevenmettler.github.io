import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "steven mettler ~ catacombs",
};

export default function CatacombsPage() {
  return (
    <iframe
      src="/games/catacombs.html"
      title="Catacombs"
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
