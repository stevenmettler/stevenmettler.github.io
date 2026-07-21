import { auth } from "@/auth";
import { accountFromSession, getOrCreatePlayerId, getProfile } from "@/lib/game";

export const dynamic = "force-dynamic";

// Returns the signed-in player's bones + unlocks, or an unauthenticated shape
// (still 200 — anonymous play is the common case, not an error).
export async function GET() {
  const session = await auth();
  const account = accountFromSession(session);

  if (!account) {
    return Response.json({ authenticated: false, bones: 0, unlocks: [] });
  }

  const playerId = await getOrCreatePlayerId(account);
  const profile = await getProfile(playerId);

  return Response.json({
    authenticated: true,
    displayName: session?.user?.displayName ?? null,
    bones: profile.bones,
    unlocks: profile.unlocks,
  });
}
