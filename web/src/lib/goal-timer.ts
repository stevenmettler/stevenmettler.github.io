// Stopwatch mutations for /goals, kept free of redirects and framework
// concerns so both the web UI's server actions and the token-authenticated
// API for iOS Shortcuts can share one implementation. Reads live in ./goals.

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { goals, goalSessions, type Goal } from "@/db/schema";

export type TimerResult =
  | { state: "running"; goal: Goal }
  /** A timer was already running, so nothing was started. */
  | { state: "busy"; goal: Goal }
  | { state: "stopped"; goal: Goal; loggedSeconds: number }
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
 * Stop whatever is running, otherwise start `goalId` (defaulting to the
 * featured goal). This is what the single Home Screen button calls.
 */
export async function toggleTimer(goalId?: number): Promise<TimerResult> {
  if (await getRunning()) return stopTimer();

  const target = goalId !== undefined ? await getGoal(goalId) : await getFeaturedGoalRow();
  if (!target || target.archived) return { state: "no-goal" };

  return startTimer(target.id);
}

/** Throw the running timer away without logging it. */
export async function discardTimer(): Promise<void> {
  await db.delete(goalSessions).where(isNull(goalSessions.endedAt));
}
