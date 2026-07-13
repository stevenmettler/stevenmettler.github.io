import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Prettifier",
};

export default function JsonPrettifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
