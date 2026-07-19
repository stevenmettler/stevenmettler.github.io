const HN_SEARCH_TIMEOUT_MS = 5_000;

// Host + path only (no protocol, query string, or fragment), so trivial
// differences like http/https, tracking params, or a trailing slash
// don't cause false negatives. Also doubles as the Algolia query string:
// searching with the protocol included returns zero hits even for URLs
// that are indexed, so the same normalized value is used for both.
function normalizeForCompare(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`;
  } catch {
    return rawUrl.toLowerCase();
  }
}

interface AlgoliaHNHit {
  url?: string;
}

interface AlgoliaHNResponse {
  hits: AlgoliaHNHit[];
}

// Verifies a URL was actually submitted to Hacker News as a story (not
// just pasted into a comment, which anyone can do without moderation).
// HN's own moderation removes inappropriate submissions essentially
// immediately, so "was this indexed by HN" is a strong, self-maintaining
// safety signal in place of a hand-maintained domain blocklist.
//
// Throws on network/timeout failure so the caller can distinguish
// "verified absent from HN" from "couldn't verify" and fail closed
// with an honest message either way.
export async function isSubmittedToHN(url: URL): Promise<boolean> {
  const target = normalizeForCompare(url.toString());

  const searchUrl = new URL("https://hn.algolia.com/api/v1/search");
  searchUrl.searchParams.set("query", target);
  searchUrl.searchParams.set("restrictSearchableAttributes", "url");
  searchUrl.searchParams.set("tags", "story");
  searchUrl.searchParams.set("hitsPerPage", "50");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HN_SEARCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(searchUrl.toString(), { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`HN search failed with status ${res.status}`);
  }

  const data = (await res.json()) as AlgoliaHNResponse;
  return data.hits.some((hit) => hit.url && normalizeForCompare(hit.url) === target);
}
