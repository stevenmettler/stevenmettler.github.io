import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "steven mettler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fragmentMono = await readFile(
    join(process.cwd(), "assets/FragmentMono-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#1b1a17",
          color: "#e2dccd",
          fontFamily: "Fragment Mono",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            letterSpacing: 12,
            textTransform: "uppercase",
          }}
        >
          Steven Mettler
        </div>
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8f8878",
            marginTop: 24,
          }}
        >
          Senior Software Engineer
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
