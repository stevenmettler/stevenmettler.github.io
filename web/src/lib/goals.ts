import { and, asc, desc, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { goals, goalSessions, type Goal, type GoalSession } from "@/db/schema";
import { addDays, todayInZone } from "./goal-progress";

export type GoalWithTotal = Goal & { loggedSeconds: number };

/**
 * Every goal with its total logged time. Running sessions are excluded because
 * their duration is not known until the timer stops.
 */
export async function getGoalsWithTotals(): Promise<GoalWithTotal[]> {
  const rows = await db
    .select({
      goal: goals,
      loggedSeconds: sql<number>`coalesce(sum(${goalSessions.durationSeconds}), 0)`.mapWith(
        Number
      ),
    })
    .from(goals)
    .leftJoin(
      goalSessions,
      and(eq(goalSessions.goalId, goals.id), isNotNull(goalSessions.endedAt))
    )
    .groupBy(goals.id)
    .orderBy(asc(goals.archived), asc(goals.endsOn), asc(goals.id));

  return rows.map(({ goal, loggedSeconds }) => ({ ...goal, loggedSeconds }));
}

export async function getGoalById(id: number): Promise<GoalWithTotal | null> {
  const [row] = await db
    .select({
      goal: goals,
      loggedSeconds: sql<number>`coalesce(sum(${goalSessions.durationSeconds}), 0)`.mapWith(
        Number
      ),
    })
    .from(goals)
    .leftJoin(
      goalSessions,
      and(eq(goalSessions.goalId, goals.id), isNotNull(goalSessions.endedAt))
    )
    .where(eq(goals.id, id))
    .groupBy(goals.id);

  return row ? { ...row.goal, loggedSeconds: row.loggedSeconds } : null;
}

export type FeaturedGoal = { name: string; percentComplete: number };

/**
 * The goal shown publicly on the homepage, or null if none is featured.
 *
 * This is the only goals query reachable without signing in, so it returns a
 * name and a rounded percentage and nothing else. Hours logged, the target,
 * the date window, and pace stay private even if this result is passed
 * somewhere careless later.
 */
export async function getFeaturedGoal(): Promise<FeaturedGoal | null> {
  const [row] = await db
    .select({
      name: goals.name,
      targetSeconds: goals.targetSeconds,
      loggedSeconds: sql<number>`coalesce(sum(${goalSessions.durationSeconds}), 0)`.mapWith(
        Number
      ),
    })
    .from(goals)
    .leftJoin(
      goalSessions,
      and(eq(goalSessions.goalId, goals.id), isNotNull(goalSessions.endedAt))
    )
    .where(and(eq(goals.featured, true), eq(goals.archived, false)))
    .groupBy(goals.id)
    .orderBy(asc(goals.id))
    .limit(1);

  if (!row) return null;

  const percent =
    row.targetSeconds === 0
      ? 100
      : Math.min(100, (row.loggedSeconds / row.targetSeconds) * 100);

  return { name: row.name, percentComplete: Math.round(percent * 10) / 10 };
}

export type RunningSession = { session: GoalSession; goal: Goal };

/**
 * The stopwatch that is currently running, if any. The actions only ever allow
 * one at a time, so the newest row wins if that rule is ever bypassed.
 */
export async function getRunningSession(): Promise<RunningSession | null> {
  const [row] = await db
    .select({ session: goalSessions, goal: goals })
    .from(goalSessions)
    .innerJoin(goals, eq(goals.id, goalSessions.goalId))
    .where(isNull(goalSessions.endedAt))
    .orderBy(desc(goalSessions.startedAt))
    .limit(1);

  return row ?? null;
}

export type SessionWithGoal = { session: GoalSession; goalName: string };

/**
 * Completed entries, newest first, optionally narrowed to one goal.
 * Omitting `limit` returns every entry, which is what the CSV export wants.
 */
export async function getSessions({
  goalId,
  limit,
}: { goalId?: number; limit?: number } = {}): Promise<SessionWithGoal[]> {
  const filters = [isNotNull(goalSessions.endedAt)];
  if (goalId !== undefined) filters.push(eq(goalSessions.goalId, goalId));

  const query = db
    .select({ session: goalSessions, goalName: goals.name })
    .from(goalSessions)
    .innerJoin(goals, eq(goals.id, goalSessions.goalId))
    .where(and(...filters))
    .orderBy(desc(goalSessions.startedAt), desc(goalSessions.id));

  return limit === undefined ? query : query.limit(limit);
}

export type RecentTotals = { today: number; last7Days: number };

/**
 * Per-goal totals for today and the trailing seven days, keyed by goal id.
 *
 * Buckets are assigned in JS from each entry's calendar day in GOAL_TIMEZONE,
 * which keeps timezone handling in one place instead of spreading it into SQL.
 */
export async function getRecentTotalsByGoal(
  now: Date = new Date()
): Promise<Map<number, RecentTotals>> {
  // Eight days of slack covers the widest UTC-to-Eastern boundary shift.
  const since = new Date(now.getTime() - 8 * 86_400_000);
  const rows = await db
    .select({
      goalId: goalSessions.goalId,
      startedAt: goalSessions.startedAt,
      durationSeconds: goalSessions.durationSeconds,
    })
    .from(goalSessions)
    .where(and(isNotNull(goalSessions.endedAt), gte(goalSessions.startedAt, since)));

  const today = todayInZone(now);
  const weekStart = addDays(today, -6);
  const totals = new Map<number, RecentTotals>();

  for (const row of rows) {
    const day = todayInZone(row.startedAt);
    if (day < weekStart) continue;

    const bucket = totals.get(row.goalId) ?? { today: 0, last7Days: 0 };
    const seconds = row.durationSeconds ?? 0;
    bucket.last7Days += seconds;
    if (day === today) bucket.today += seconds;
    totals.set(row.goalId, bucket);
  }

  return totals;
}
