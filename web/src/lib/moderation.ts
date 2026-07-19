const MODERATION_TIMEOUT_MS = 10_000;
const MAX_MODERATION_INPUT_CHARS = 15_000;

interface ModerationCategories {
  sexual?: boolean;
  "sexual/minors"?: boolean;
  [key: string]: boolean | undefined;
}

interface ModerationResponse {
  results: { categories: ModerationCategories }[];
}

// Checks the actual extracted article text for sexual content via
// OpenAI's moderation endpoint — a second, independent safety layer
// on top of the HN-submission gate, since a URL/domain check can never
// catch bad content hosted on an otherwise-fine domain. Scoped to the
// sexual-content categories specifically (not the broader "flagged"
// field) so ordinary HN articles on unrelated heavy topics aren't
// needlessly rejected.
//
// Throws on API/network failure so the caller fails closed.
export async function isTextSafe(text: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MODERATION_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text.slice(0, MAX_MODERATION_INPUT_CHARS),
      }),
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Moderation request failed with status ${res.status}: ${body}`);
  }

  const data = (await res.json()) as ModerationResponse;
  const categories = data.results[0]?.categories;
  if (!categories) throw new Error("Moderation response missing results");

  return !categories.sexual && !categories["sexual/minors"];
}
