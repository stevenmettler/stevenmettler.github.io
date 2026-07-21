import { getLeaderboard } from "@/lib/game";

export const dynamic = "force-dynamic";

// Public top-runs leaderboard, read from the game_runs audit log.
export async function GET() {
  const entries = await getLeaderboard(20);
  return Response.json({ entries });
}
