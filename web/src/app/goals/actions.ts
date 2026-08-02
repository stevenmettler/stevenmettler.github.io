"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, isOwnerSession } from "@/auth";
import { db } from "@/db";
import { goals, goalSessions } from "@/db/schema";
import {
  daysBetween,
  instantForDay,
  parseDuration,
  todayInZone,
} from "@/lib/goal-progress";
import * as timer from "@/lib/goal-timer";

// The layout already gates the route, but every action re-checks: an action is
// a public endpoint, not something only reachable through its own page.
async function requireOwner() {
  const session = await auth();
  if (!isOwnerSession(session)) throw new Error("Unauthorized");
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function readDay(formData: FormData, field: string, fallback: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) return fallback;
  if (!ISO_DAY.test(value)) throw new Error(`Invalid date: ${value}`);
  return value;
}

function readId(formData: FormData, field: string): number {
  const id = Number(formData.get(field));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid id");
  return id;
}

function readNote(formData: FormData): string | null {
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 280);
  return note || null;
}

function readGoalFields(formData: FormData) {
  const name = String(formData.get("name") ?? "")
    .trim()
    .slice(0, 80);
  const targetHours = Number(formData.get("targetHours"));
  const startsOn = readDay(formData, "startsOn", "");
  const endsOn = readDay(formData, "endsOn", "");

  if (!name) throw new Error("Name is required");
  if (!Number.isFinite(targetHours) || targetHours <= 0) {
    throw new Error("Target hours must be greater than zero");
  }
  if (!startsOn || !endsOn) throw new Error("Both dates are required");
  if (daysBetween(startsOn, endsOn) < 0) {
    throw new Error("The end date must not precede the start date");
  }

  return {
    name,
    targetSeconds: Math.round(targetHours * 3600),
    startsOn,
    endsOn,
  };
}

// --- Goals ---------------------------------------------------------------

export async function createGoal(formData: FormData) {
  await requireOwner();
  await db.insert(goals).values(readGoalFields(formData));
  redirect("/goals");
}

export async function updateGoal(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "goalId");
  const archived = formData.get("archived") === "on";
  await db
    .update(goals)
    .set({
      ...readGoalFields(formData),
      archived,
      // An archived goal is not shown publicly, so drop the flag rather than
      // leave it set on something invisible.
      ...(archived ? { featured: false } : {}),
      updatedAt: new Date(),
    })
    .where(eq(goals.id, id));

  redirect(`/goals/${id}`);
}

export async function deleteGoal(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "goalId");
  await db.delete(goals).where(eq(goals.id, id));

  redirect("/goals");
}

/**
 * Feature a goal on the public homepage, replacing whatever was featured
 * before. Both writes share a transaction so there is never a moment where
 * two goals are public or none is.
 */
export async function featureGoal(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "goalId");
  await db.transaction(async (tx) => {
    await tx
      .update(goals)
      .set({ featured: false, updatedAt: new Date() })
      .where(eq(goals.featured, true));
    await tx
      .update(goals)
      .set({ featured: true, updatedAt: new Date() })
      .where(eq(goals.id, id));
  });

  redirect("/goals");
}

export async function unfeatureGoal(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "goalId");
  await db
    .update(goals)
    .set({ featured: false, updatedAt: new Date() })
    .where(eq(goals.id, id));

  redirect("/goals");
}

// --- Stopwatch -----------------------------------------------------------

// The stopwatch itself lives in @/lib/goal-timer so the iOS Shortcuts API can
// share it. These wrappers only add the owner check and the redirect.

export async function startTimer(formData: FormData) {
  await requireOwner();

  const result = await timer.startTimer(readId(formData, "goalId"));
  // Something else started a timer since this page rendered. Send them back to
  // where the running timer is visible rather than erroring.
  if (result.state === "busy") redirect("/goals?busy=1");

  redirect("/goals");
}

export async function stopTimer() {
  await requireOwner();
  await timer.stopTimer();
  redirect("/goals");
}

export async function discardTimer() {
  await requireOwner();
  await timer.discardTimer();
  redirect("/goals");
}

// --- Entries -------------------------------------------------------------

export async function logSession(formData: FormData) {
  await requireOwner();

  const goalId = readId(formData, "goalId");
  const seconds = parseDuration(String(formData.get("duration") ?? ""));
  if (seconds === null || seconds <= 0) {
    throw new Error("Enter a duration like 45m, 1h30m or 1:30");
  }

  const day = readDay(formData, "day", todayInZone());
  const startedAt = instantForDay(day);

  await db.insert(goalSessions).values({
    goalId,
    startedAt,
    endedAt: new Date(startedAt.getTime() + seconds * 1000),
    durationSeconds: seconds,
    note: readNote(formData),
    source: "manual",
  });

  redirect(`/goals/${goalId}`);
}

export async function updateSession(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "sessionId");
  const goalId = readId(formData, "goalId");
  const seconds = parseDuration(String(formData.get("duration") ?? ""));
  if (seconds === null || seconds <= 0) {
    throw new Error("Enter a duration like 45m, 1h30m or 1:30");
  }

  const [existing] = await db
    .select()
    .from(goalSessions)
    .where(eq(goalSessions.id, id))
    .limit(1);
  if (!existing) throw new Error("Entry not found");

  // Moving an entry to another day keeps its time of day; only the date shifts.
  const day = readDay(formData, "day", todayInZone(existing.startedAt));
  const dayDelta = daysBetween(todayInZone(existing.startedAt), day);
  const startedAt = new Date(existing.startedAt.getTime() + dayDelta * 86_400_000);

  await db
    .update(goalSessions)
    .set({
      startedAt,
      endedAt: new Date(startedAt.getTime() + seconds * 1000),
      durationSeconds: seconds,
      note: readNote(formData),
      updatedAt: new Date(),
    })
    .where(eq(goalSessions.id, id));

  redirect(`/goals/${goalId}`);
}

export async function deleteSession(formData: FormData) {
  await requireOwner();

  const id = readId(formData, "sessionId");
  const goalId = readId(formData, "goalId");
  await db.delete(goalSessions).where(eq(goalSessions.id, id));

  redirect(`/goals/${goalId}`);
}
