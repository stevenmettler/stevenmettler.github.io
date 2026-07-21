import { auth } from "@/auth";
import {
  accountFromSession,
  getOrCreatePlayerId,
  recordRun,
  sanitizeRun,
} from "@/lib/game";

export const dynamic = "force-dynamic";

// Records a completed run and credits server-computed bones. The client's
// stats are clamped and the bones amount is computed here — a client-submitted
// amount is never trusted.
export async function POST(request: Request) {
  const session = await auth();
  const account = accountFromSession(session);

  if (!account) {
    // Anonymous runs simply aren't persisted; not an error for the client.
    return Response.json({ authenticated: false, bonesAwarded: 0, bones: 0, unlocks: [] });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const stats = sanitizeRun(body);
  const playerId = await getOrCreatePlayerId(account);
  const result = await recordRun(playerId, stats);

  return Response.json({ authenticated: true, ...result });
}
