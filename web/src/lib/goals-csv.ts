// CSV construction for the /goals export. Pure string work, no database or
// framework imports, so the escaping rules can be reasoned about on their own.

import {
  computeProgress,
  formatClock,
  todayInZone,
  type GoalProgress,
} from "./goal-progress";
import type { GoalWithTotal, SessionWithGoal } from "./goals";

export type CsvValue = string | number | null | undefined;

/**
 * Escapes one field per RFC 4180: wrap in quotes when the value contains a
 * comma, quote, or newline, and double any embedded quotes.
 */
export function csvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Joins rows into a CSV document.
 *
 * Leads with a byte order mark, without which Excel on Windows decodes the
 * file as the local codepage and mangles any non-ASCII note. Rows are
 * separated by CRLF, which is what RFC 4180 specifies.
 */
export function toCsv(rows: CsvValue[][]): string {
  const body = rows.map((row) => row.map(csvField).join(",")).join("\r\n");
  return `\uFEFF${body}\r\n`;
}

/** Seconds as decimal hours, e.g. 5400 becomes 1.5. Spreadsheet-summable. */
function decimalHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10_000) / 10_000;
}

export const ENTRY_COLUMNS = [
  "goal",
  "date",
  "started_at",
  "duration_hms",
  "duration_hours",
  "duration_seconds",
  "source",
  "note",
];

/** One row per logged entry: the raw time log. */
export function entriesToCsv(entries: SessionWithGoal[]): string {
  const rows: CsvValue[][] = [ENTRY_COLUMNS];

  for (const { session, goalName } of entries) {
    const seconds = session.durationSeconds ?? 0;
    rows.push([
      goalName,
      todayInZone(session.startedAt),
      session.startedAt.toISOString(),
      formatClock(seconds),
      decimalHours(seconds),
      seconds,
      session.source,
      session.note,
    ]);
  }

  return toCsv(rows);
}

export const GOAL_COLUMNS = [
  "goal",
  "target_hours",
  "logged_hours",
  "remaining_hours",
  "percent_complete",
  "starts_on",
  "ends_on",
  "status",
  "days_remaining",
  "hours_per_week_to_finish",
  "hours_ahead_of_pace",
  "archived",
];

/** One row per goal: the summary, with the same pace figures the page shows. */
export function goalsToCsv(goals: GoalWithTotal[], now = new Date()): string {
  const rows: CsvValue[][] = [GOAL_COLUMNS];

  for (const goal of goals) {
    const progress: GoalProgress = computeProgress({
      targetSeconds: goal.targetSeconds,
      loggedSeconds: goal.loggedSeconds,
      startsOn: goal.startsOn,
      endsOn: goal.endsOn,
      now,
    });

    rows.push([
      goal.name,
      decimalHours(goal.targetSeconds),
      decimalHours(goal.loggedSeconds),
      decimalHours(progress.remainingSeconds),
      Math.round(progress.percentComplete * 100) / 100,
      goal.startsOn,
      goal.endsOn,
      progress.status,
      progress.daysRemaining,
      decimalHours(progress.requiredPerWeekSeconds),
      decimalHours(progress.deltaSeconds),
      goal.archived ? "yes" : "no",
    ]);
  }

  return toCsv(rows);
}
