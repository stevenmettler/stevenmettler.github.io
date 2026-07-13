import { marked } from "marked";
import { getPublishedPostsFull } from "@/lib/posts";

export const dynamic = "force-dynamic";

const SITE_URL = "https://stevenmettler.com";

export async function GET() {
  const posts = await getPublishedPostsFull();

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const html = marked.parse(post.bodyMarkdown, { async: false }) as string;
      const pubDate = new Date(`${post.date}T12:00:00Z`).toUTCString();

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${html}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>steven mettler</title>
    <link>${SITE_URL}</link>
    <description>Steven Mettler's blog</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
