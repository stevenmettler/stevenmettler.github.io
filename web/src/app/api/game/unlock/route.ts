import { auth } from "@/auth";
import {
  accountFromSession,
  getOrCreatePlayerId,
  purchaseUnlock,
} from "@/lib/game";

export const dynamic = "force-dynamic";

// Spends bones on a permanent unlock. Cost is checked against balance inside a
// DB transaction so rapid double-clicks can't double-spend.
export async function POST(request: Request) {
  const session = await auth();
  const account = accountFromSession(session);

  if (!account) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const unlockKey = (body as { unlockKey?: unknown })?.unlockKey;
  if (typeof unlockKey !== "string") {
    return Response.json({ error: "missing unlockKey" }, { status: 400 });
  }

  const playerId = await getOrCreatePlayerId(account);
  const outcome = await purchaseUnlock(playerId, unlockKey);

  if (!outcome.ok) {
    return Response.json({ ok: false, reason: outcome.reason, bones: outcome.bones }, { status: 409 });
  }

  return Response.json({ ok: true, bones: outcome.bones, unlocks: outcome.unlocks });
}
