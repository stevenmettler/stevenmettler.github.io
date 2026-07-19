import net from "node:net";

// Rejects hostnames that are literal loopback/private/link-local addresses
// (or "localhost"), so the reader tool can't be pointed at internal
// infrastructure. This only catches literal IPs/hostnames typed directly
// into the URL — it does NOT resolve DNS to check whether a normal-looking
// hostname resolves to a private IP (DNS rebinding), and fetch() follows
// redirects by default without re-validating the redirect target. Both are
// accepted residual risks for a single-user personal tool.
export function isDisallowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (host === "localhost" || host.endsWith(".localhost")) return true;

  const ipType = net.isIP(host);
  if (ipType === 4) return isPrivateIPv4(host);
  if (ipType === 6) return isPrivateIPv6(host);

  return false;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;

  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 0) return true; // 0.0.0.0/8

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fe80:")) return true; // fe80::/10 link-local
  if (/^f[c-d][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique-local

  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4 address too.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return false;
}
