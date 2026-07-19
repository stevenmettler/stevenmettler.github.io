// Small, deliberately non-comprehensive blocklist of known text-based
// erotica/pornography sites. This is a SECONDARY safeguard only — the
// primary safety property of the reader tool is that it extracts and
// renders plain text alone, never images/video, regardless of source.
// Add hostnames below as needed; matching also covers subdomains.
export const BLOCKED_DOMAINS: readonly string[] = [
  "literotica.com",
  "asstr.org",
  "nifty.org",
  "storiesonline.net",
  "sexstories.com",
];

export function isBlockedDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
