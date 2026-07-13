import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPublishedPostBySlug } from "@/lib/posts";

export const alt = "steven mettler blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const fragmentMono = await readFile(
    join(process.cwd(), "assets/FragmentMono-Regular.ttf")
  );

  const title = post?.title ?? "steven mettler";
  const date = post?.date.replaceAll("-", "·") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1b1a17",
          color: "#e2dccd",
          fontFamily: "Fragment Mono",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8f8878",
          }}
        >
          steven mettler
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 56,
              textTransform: "uppercase",
              letterSpacing: 4,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, color: "#767061", marginTop: 20 }}>
            {date}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Fragment Mono",
          data: fragmentMono,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
