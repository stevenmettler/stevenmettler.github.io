import { timingSafeEqual } from "node:crypto";

/**
 * Shared-secret auth for endpoints called by machines rather than browsers,
 * currently the iOS Shortcut that drives the goal timer.
 *
 * Session auth cannot be used there: a Shortcut's HTTP request carries none of
 * Safari's cookies. This is a single-user secret, not an identity system, so
 * anything holding the token is treated as the owner.
 */
export function hasValidApiToken(request: Request): boolean {
  const expected = process.env.GOALS_API_TOKEN;

  // Fail closed. A missing or blank secret must never mean an open endpoint,
  // which is exactly what would happen on a deploy where the env var was
  // forgotten.
  if (!expected) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  // Read from the header only, never a query string, so the secret stays out
  // of access logs, browser history, and referrer headers.
  return safeEqual(header.slice("Bearer ".length), expected);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on length mismatch, and the lengths themselves are
  // not secret, so compare them first.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
