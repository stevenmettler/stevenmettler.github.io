"use server";

import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import { auth } from "@/auth";
import { isDisallowedHost } from "@/lib/url-safety";
import { isSubmittedToHN } from "@/lib/hn-gate";
import { isTextSafe } from "@/lib/moderation";
import { extractBlocks, type ArticleBlock } from "@/lib/extract-blocks";

export type ExtractState =
  | { status: "idle" }
  | { status: "success"; title: string; byline: string | null; blocks: ArticleBlock[] }
  | { status: "error"; message: string };

const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5_000_000;
const MIN_ARTICLE_LENGTH = 200;

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();

  const decoder = new TextDecoder();
  let received = 0;
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("RESPONSE_TOO_LARGE");
    }

    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}

export async function extractArticle(
  prevState: ExtractState,
  formData: FormData
): Promise<ExtractState> {
  await requireAuth();

  try {
    const raw = String(formData.get("url") ?? "").trim();
    if (!raw) {
      return { status: "error", message: "Please enter a URL." };
    }

    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return { status: "error", message: "That doesn't look like a valid URL." };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { status: "error", message: "That doesn't look like a valid URL." };
    }

    if (isDisallowedHost(url.hostname)) {
      return { status: "error", message: "That address isn't reachable from here." };
    }

    try {
      const submitted = await isSubmittedToHN(url);
      if (!submitted) {
        return {
          status: "error",
          message: "This link doesn't appear to have been submitted to Hacker News.",
        };
      }
    } catch (err) {
      console.error("HN gate check failed:", err);
      return {
        status: "error",
        message: "Couldn't verify that link right now — try again in a moment.",
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ReaderTool/1.0; +https://stevenmettler.com)",
        },
      });
    } catch {
      return {
        status: "error",
        message: "Couldn't reach that page (timed out or unreachable).",
      };
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `That page returned an error (status ${res.status}).`,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { status: "error", message: "That doesn't look like a webpage." };
    }

    let html: string;
    try {
      html = await readCapped(res, MAX_RESPONSE_BYTES);
    } catch {
      return { status: "error", message: "That page is too large to read." };
    }

    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document).parse();

    if (!article?.textContent || article.textContent.trim().length < MIN_ARTICLE_LENGTH) {
      return {
        status: "error",
        message:
          "Couldn't find article text on that page — it might be paywalled or need JavaScript to load.",
      };
    }

    const blocks = extractBlocks(article.content ?? "");
    const resolvedBlocks: ArticleBlock[] =
      blocks.length > 0
        ? blocks
        : article.textContent
            .trim()
            .split(/\n{2,}/)
            .map((text) => ({ type: "paragraph" as const, text: text.trim() }))
            .filter((block) => block.text);

    const title = article.title ?? "";
    const combinedText = [title, ...resolvedBlocks.map((b) => b.text)].join("\n\n");

    try {
      const safe = await isTextSafe(combinedText);
      if (!safe) {
        return { status: "error", message: "This content isn't available here." };
      }
    } catch (err) {
      console.error("Moderation check failed:", err);
      return {
        status: "error",
        message: "Couldn't verify that content — try again in a moment.",
      };
    }

    return {
      status: "success",
      title,
      byline: article.byline ?? null,
      blocks: resolvedBlocks,
    };
  } catch {
    return { status: "error", message: "Something went wrong reading that page." };
  }
}
