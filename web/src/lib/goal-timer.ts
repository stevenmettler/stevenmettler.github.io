// Stopwatch mutations for /goals, kept free of redirects and framework
// concerns so both the web UI's server actions and the token-authenticated
// API for iOS Shortcuts can share one implementation. Reads live in ./goals.

import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { goals, goalSessions, type Goal } from "@/db/schema";

export type TimerResult =
  | { state: "running"; goal: Goal }
  /** A timer was already running, so nothing was started. */
  | { state: "busy"; goal: Goal }
  | { state: "stopped"; goal: Goal; loggedSeconds: number }
  /** A different goal was running: it was logged and this one started. */
  | { state: "switched"; goal: Goal; stoppedGoal: Goal; loggedSeconds: number }
  /** Nothing was running when a stop was asked for. */
  | { state: "idle" }
  | { state: "no-goal" };

export type RunningTimer = { session: typeof goalSessions.$inferSelect; goal: Goal };

/** The running stopwatch and its goal, or null. Newest wins. */
export async function getRunning(): Promise<RunningTimer | null> {
  const [row] = await db
    .select({ session: goalSessions, goal: goals })
    .from(goalSessions)
    .innerJoin(goals, eq(goals.id, goalSessions.goalId))
    .where(isNull(goalSessions.endedAt))
    .orderBy(desc(goalSessions.startedAt))
    .limit(1);

  return row ?? null;
}

/**
 * The featured goal as a full row, for server-side callers that need its id.
 *
 * Deliberately separate from `getFeaturedGoal()` in ./goals, which is the one
 * goals query reachable without signing in and returns only a name and a
 * percentage. Widening that one would leak hours onto the public homepage.
 */
export async function getFeaturedGoalRow(): Promise<Goal | null> {
  const [row] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.featured, true), eq(goals.archived, false)))
    .limit(1);

  return row ?? null;
}

async function getGoal(goalId: number): Promise<Goal | null> {
  const [row] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  return row ?? null;
}

/** Active goals, oldest first. Used to name what a caller can time. */
export async function getActiveGoals(): Promise<Goal[]> {
  return db
    .select()
    .from(goals)
    .where(eq(goals.archived, false))
    .orderBy(asc(goals.id));
}

export type GoalLookup =
  | { found: Goal }
  | { found: null; reason: "missing" | "ambiguous" };

/**
 * Resolve a goal by name for the per-goal Home Screen buttons, so a shortcut
 * carries a readable name instead of a numeric id nobody can remember.
 *
 * Matching is case-insensitive but exact: no prefix or fuzzy matching, because
 * guessing wrong would silently log time against the wrong goal. Names are not
 * unique in the schema, so a tie is reported rather than resolved arbitrarily.
 */
export async function findGoalByName(name: string): Promise<GoalLookup> {
  const rows = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.archived, false),
        sql`lower(${goals.name}) = lower(${name.trim()})`
      )
    )
    .orderBy(asc(goals.id));

  if (rows.length === 1) return { found: rows[0] };
  return { found: null, reason: rows.length === 0 ? "missing" : "ambiguous" };
}

export async function startTimer(goalId: number): Promise<TimerResult> {
  const running = await getRunning();
  // Reachable from a stale page or a second device: something else may have
  // started a timer since this caller last looked. Recoverable, not an error.
  if (running) return { state: "busy", goal: running.goal };

  const goal = await getGoal(goalId);
  if (!goal) return { state: "no-goal" };

  await db.insert(goalSessions).values({
    goalId,
    startedAt: new Date(),
    source: "timer",
  });

  return { state: "running", goal };
}

export async function stopTimer(): Promise<TimerResult> {
  const running = await getRunning();
  if (!running) return { state: "idle" };

  const endedAt = new Date();
  // Elapsed time is measured server-side from the stored start, so a wrong
  // clock on the caller's device can never write a wrong duration.
  const loggedSeconds = Math.max(
    1,
    Math.round((endedAt.getTime() - running.session.startedAt.getTime()) / 1000)
  );

  await db
    .update(goalSessions)
    .set({ endedAt, durationSeconds: loggedSeconds, updatedAt: endedAt })
    .where(eq(goalSessions.id, running.session.id));

  return { state: "stopped", goal: running.goal, loggedSeconds };
}

/**
 * What a Home Screen button does.
 *
 * With no goal named, it is the single generic button: stop whatever is
 * running, otherwise start the featured goal.
 *
 * With a goal named, it is that goal's own button. Tapping it while the same
 * goal runs stops it. Tapping it while a *different* goal runs logs that one
 * and starts this one, because reaching for the Creating button mid-workout
 * means "I am doing this now", and refusing would leave a timer running on
 * the wrong goal. Nothing is lost either way: the switch logs the previous
 * session and says so.
 */
export async function toggleTimer(goalId?: number): Promise<TimerResult> {
  const running = await getRunning();

  // Generic button with nothing named: a running timer just stops.
  if (running && goalId === undefined) return stopTimer();

  const target =
    goalId !== undefined ? await getGoal(goalId) : await getFeaturedGoalRow();
  if (!target || target.archived) return { state: "no-goal" };

  if (!running) return startTimer(target.id);

  // Same goal: this is a plain stop.
  if (running.goal.id === target.id) return stopTimer();

  const stopped = await stopTimer();
  const started = await startTimer(target.id);
  if (started.state !== "running" || stopped.state !== "stopped") return started;

  return {
    state: "switched",
    goal: started.goal,
    stoppedGoal: stopped.goal,
    loggedSeconds: stopped.loggedSeconds,
  };
}

/** Throw the running timer away without logging it. */
export async function discardTimer(): Promise<void> {
  await db.delete(goalSessions).where(isNull(goalSessions.endedAt));
}
