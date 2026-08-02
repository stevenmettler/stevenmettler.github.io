import { hasValidApiToken } from "@/lib/api-token";
import {
  formatDuration,
  formatHours,
  computeProgress,
} from "@/lib/goal-progress";
import { getGoalById } from "@/lib/goals";
import {
  findGoalByName,
  getActiveGoals,
  getFeaturedGoalRow,
  getRunning,
  startTimer,
  stopTimer,
  toggleTimer,
  type TimerResult,
} from "@/lib/goal-timer";

export const dynamic = "force-dynamic";

/**
 * Timer control for the iOS Shortcut on the Home Screen.
 *
 *   POST  /api/goals/timer          toggle the featured goal's timer
 *   POST  { "action": "start" }     with optional { "goalId": n }
 *   POST  { "action": "stop" }
 *   GET   /api/goals/timer          status, changes nothing
 *
 * Every response carries a `message` written for a human, so the Shortcut can
 * be one HTTP action plus a notification with no branching of its own.
 *
 * A bad or missing token gets a 404 rather than a 401, matching how /goals and
 * /goals/export already hide their existence from anyone who is not the owner.
 */
export async function POST(request: Request) {
  if (!hasValidApiToken(request)) return notFound();

  const body = await readJsonBody(request);
  const action = body.action ?? "toggle";
  if (action !== "toggle" && action !== "start" && action !== "stop") {
    return Response.json(
      { ok: false, message: `Unknown action "${action}".` },
      { status: 400 }
    );
  }

  // `goal` is a name, which is what the per-goal Home Screen buttons send.
  // `goalId` still works for anything that already knows the id.
  let goalId = typeof body.goalId === "number" ? body.goalId : undefined;
  if (typeof body.goal === "string" && body.goal.trim()) {
    const lookup = await findGoalByName(body.goal);
    if (!lookup.found) {
      const names = (await getActiveGoals()).map((g) => g.name);
      return Response.json(
        {
          ok: false,
          state: "no-goal",
          message:
            lookup.reason === "ambiguous"
              ? `More than one goal is named "${body.goal}". Rename one at /goals.`
              : `No goal named "${body.goal}". Try: ${names.join(", ")}.`,
          goals: names,
        },
        { status: 404 }
      );
    }
    goalId = lookup.found.id;
  }

  let result: TimerResult;
  if (action === "stop") {
    result = await stopTimer();
  } else if (action === "start") {
    const target = goalId ?? (await getFeaturedGoalRow())?.id;
    result = target === undefined ? { state: "no-goal" } : await startTimer(target);
  } else {
    result = await toggleTimer(goalId);
  }

  return Response.json(await describe(result));
}

export async function GET(request: Request) {
  if (!hasValidApiToken(request)) return notFound();

  const running = await getRunning();
  if (running) {
    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - running.session.startedAt.getTime()) / 1000)
    );
    return Response.json({
      ok: true,
      state: "running",
      goal: running.goal.name,
      elapsedSeconds,
      message: `${running.goal.name} running for ${formatDuration(elapsedSeconds)}`,
    });
  }

  const featured = await getFeaturedGoalRow();
  if (!featured) {
    return Response.json({
      ok: true,
      state: "idle",
      message: "No timer running. No goal is featured.",
    });
  }

  return Response.json({
    ok: true,
    state: "idle",
    goal: featured.name,
    message: `No timer running. ${await progressLine(featured.id)}`,
  });
}

/** Turn a timer result into the JSON the Shortcut reads. */
async function describe(result: TimerResult) {
  switch (result.state) {
    case "running":
      return {
        ok: true,
        state: "running",
        goal: result.goal.name,
        message: `Started ${result.goal.name}`,
      };

    case "stopped":
      return {
        ok: true,
        state: "stopped",
        goal: result.goal.name,
        loggedSeconds: result.loggedSeconds,
        message: `Logged ${formatDuration(result.loggedSeconds)} to ${
          result.goal.name
        }. ${await progressLine(result.goal.id)}`,
      };

    case "switched":
      return {
        ok: true,
        state: "switched",
        goal: result.goal.name,
        stoppedGoal: result.stoppedGoal.name,
        loggedSeconds: result.loggedSeconds,
        message: `Logged ${formatDuration(result.loggedSeconds)} to ${
          result.stoppedGoal.name
        }, started ${result.goal.name}`,
      };

    case "busy":
      return {
        ok: false,
        state: "busy",
        goal: result.goal.name,
        message: `${result.goal.name} is already running. Tap again to stop it.`,
      };

    case "idle":
      return {
        ok: false,
        state: "idle",
        message: "No timer was running.",
      };

    case "no-goal":
      return {
        ok: false,
        state: "no-goal",
        message:
          "No goal to time. Pick one with show on homepage at /goals.",
      };
  }
}

/** "3.3h of 75h." Reads the goal fresh so the total includes what just landed. */
async function progressLine(goalId: number): Promise<string> {
  const goal = await getGoalById(goalId);
  if (!goal) return "";

  const progress = computeProgress({
    targetSeconds: goal.targetSeconds,
    loggedSeconds: goal.loggedSeconds,
    startsOn: goal.startsOn,
    endsOn: goal.endsOn,
  });

  return progress.isComplete
    ? `${formatHours(goal.targetSeconds)}h done, goal complete.`
    : `${formatHours(goal.loggedSeconds)}h of ${formatHours(goal.targetSeconds)}h.`;
}

async function readJsonBody(
  request: Request
): Promise<{ action?: string; goalId?: number; goal?: string }> {
  // An empty body is the common case: the Shortcut's simplest form is a bare
  // POST, which should just toggle.
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}
