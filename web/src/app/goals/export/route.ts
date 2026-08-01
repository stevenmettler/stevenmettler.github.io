import { auth, isOwnerSession } from "@/auth";
import { entriesToCsv, goalsToCsv } from "@/lib/goals-csv";
import { todayInZone } from "@/lib/goal-progress";
import { getGoalById, getGoalsWithTotals, getSessions } from "@/lib/goals";

export const dynamic = "force-dynamic";

/**
 * CSV export of the time log or the goal summary.
 *
 * A route handler sits outside the layout that gates the rest of /goals, so it
 * repeats the owner check itself. Non-owners get a 404 rather than a 401, so
 * the endpoint gives away no more than the pages do.
 *
 *   /goals/export                  every entry
 *   /goals/export?goal=3           one goal's entries
 *   /goals/export?type=goals       the goal summary
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!isOwnerSession(session)) {
    return new Response("Not found", { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const now = new Date();
  const today = todayInZone(now);

  if (params.get("type") === "goals") {
    const goals = await getGoalsWithTotals();
    return csvResponse(goalsToCsv(goals, now), `goals-summary-${today}.csv`);
  }

  const goalParam = params.get("goal");
  const goalId = goalParam === null ? undefined : Number(goalParam);
  if (goalId !== undefined && !Number.isInteger(goalId)) {
    return new Response("Invalid goal", { status: 400 });
  }

  // Name the per-goal file after the goal, and 404 on an id that is not real
  // rather than handing back an empty file that looks like "no time logged".
  let slug = "all";
  if (goalId !== undefined) {
    const goal = await getGoalById(goalId);
    if (!goal) return new Response("Not found", { status: 404 });
    slug = goal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || String(goalId);
  }

  const entries = await getSessions({ goalId });
  return csvResponse(entriesToCsv(entries), `goals-${slug}-${today}.csv`);
}

function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
