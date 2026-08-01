// Pure duration/date math for the /goals hour tracker. Deliberately free of
// database and React imports so the arithmetic is easy to reason about on its
// own and can be used from both server and client components.

// Every day boundary in this feature ("today", pace, the date window) is
// evaluated in this zone rather than the server's UTC or the browser's local
// time, so the numbers stay stable no matter where they are computed.
export const GOAL_TIMEZONE = "America/New_York";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: GOAL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day in GOAL_TIMEZONE, as `YYYY-MM-DD`. */
export function todayInZone(now: Date = new Date()): string {
  return DAY_FORMATTER.format(now);
}

/** Whole days from `YYYY-MM-DD` `from` to `to`; negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return dayIndex(to) - dayIndex(from);
}

/** Days since the epoch, computed in UTC so DST never shifts the result. */
function dayIndex(isoDay: string): number {
  const [year, month, day] = isoDay.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** Shifts a `YYYY-MM-DD` day by a whole number of days. */
export function addDays(isoDay: string, delta: number): string {
  const [year, month, day] = isoDay.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  return shifted.toISOString().slice(0, 10);
}

const OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: GOAL_TIMEZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** How far GOAL_TIMEZONE is from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(instant: Date): number {
  const parts = OFFSET_FORMATTER.formatToParts(instant);
  const part = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asIfUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second")
  );
  return asIfUtc - instant.getTime();
}

/**
 * The instant corresponding to `hour` o'clock on `isoDay` in GOAL_TIMEZONE.
 * Manually logged entries land at midday so that neither end of the entry can
 * spill into an adjacent calendar day, whatever the duration or DST shift.
 */
export function instantForDay(isoDay: string, hour = 12): Date {
  const [year, month, day] = isoDay.split("-").map(Number);
  const naive = Date.UTC(year, month - 1, day, hour);
  return new Date(naive - zoneOffsetMs(new Date(naive)));
}

/** `"2h 15m"`, `"45m"`, `"30s"`. Used for every duration the page displays. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total}s`;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** `"+3h 10m"` / `"-3h 10m"`, for ahead-of/behind-pace figures. */
export function formatSignedDuration(seconds: number): string {
  const sign = seconds < 0 ? "-" : "+";
  return `${sign}${formatDuration(Math.abs(seconds))}`;
}

/** Hours to one decimal with a trailing `.0` trimmed, e.g. `"142.5"`, `"1000"`. */
export function formatHours(seconds: number): string {
  const hours = Math.max(0, seconds) / 3600;
  return hours.toFixed(1).replace(/\.0$/, "");
}

/** `"01:23:45"` for the live stopwatch. Hours are not capped at 24. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * Parses the durations typed into the manual-entry and edit forms.
 *
 * Accepts `"90"` (a bare number means minutes), `"1.5h"`, `"90m"`, `"1h30m"`,
 * `"1h 30m"`, `"2 hours"`, `"1:30"` and `"1:30:15"`. Returns seconds, or null
 * if the input cannot be understood.
 */
export function parseDuration(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  const clock = raw.match(/^(\d+):([0-5]?\d)(?::([0-5]?\d))?$/);
  if (clock) {
    return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3] ?? 0);
  }

  const unitPattern =
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)/g;
  let total = 0;
  let sawUnit = false;
  for (const match of raw.matchAll(unitPattern)) {
    sawUnit = true;
    const value = Number(match[1]);
    const scale = match[2][0] === "h" ? 3600 : match[2][0] === "m" ? 60 : 1;
    total += value * scale;
  }
  if (sawUnit) {
    // Anything left over after removing the units means the input was not
    // fully understood, e.g. "1h and a bit".
    const leftover = raw.replace(unitPattern, "").replace(/[\s,]/g, "");
    return leftover ? null : Math.round(total);
  }

  if (/^\d+(?:\.\d+)?$/.test(raw)) return Math.round(Number(raw) * 60);
  return null;
}

export type GoalWindowStatus = "upcoming" | "active" | "ended";

export type GoalProgress = {
  targetSeconds: number;
  loggedSeconds: number;
  remainingSeconds: number;
  percentComplete: number;
  isComplete: boolean;
  status: GoalWindowStatus;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  /** Where a perfectly even pace would have you by the end of today. */
  expectedSeconds: number;
  /** logged minus expected; positive means ahead of pace. */
  deltaSeconds: number;
  requiredPerDaySeconds: number;
  requiredPerWeekSeconds: number;
};

export function computeProgress({
  targetSeconds,
  loggedSeconds,
  startsOn,
  endsOn,
  now = new Date(),
}: {
  targetSeconds: number;
  loggedSeconds: number;
  startsOn: string;
  endsOn: string;
  now?: Date;
}): GoalProgress {
  const today = todayInZone(now);
  const daysTotal = Math.max(1, daysBetween(startsOn, endsOn) + 1);

  let status: GoalWindowStatus = "active";
  let daysElapsed: number;
  let daysRemaining: number;
  if (today < startsOn) {
    status = "upcoming";
    daysElapsed = 0;
    daysRemaining = daysTotal;
  } else if (today > endsOn) {
    status = "ended";
    daysElapsed = daysTotal;
    daysRemaining = 0;
  } else {
    // Today counts as both elapsed and remaining: its quota is already owed,
    // and it is still a day you can log against.
    daysElapsed = daysBetween(startsOn, today) + 1;
    daysRemaining = daysBetween(today, endsOn) + 1;
  }

  const remainingSeconds = Math.max(0, targetSeconds - loggedSeconds);
  const expectedSeconds = Math.min(
    targetSeconds,
    (targetSeconds * daysElapsed) / daysTotal
  );
  const requiredPerDaySeconds =
    remainingSeconds === 0 || daysRemaining === 0
      ? 0
      : remainingSeconds / daysRemaining;

  return {
    targetSeconds,
    loggedSeconds,
    remainingSeconds,
    percentComplete:
      targetSeconds === 0
        ? 100
        : Math.min(100, (loggedSeconds / targetSeconds) * 100),
    isComplete: loggedSeconds >= targetSeconds,
    status,
    daysTotal,
    daysElapsed,
    daysRemaining,
    expectedSeconds,
    deltaSeconds: loggedSeconds - expectedSeconds,
    requiredPerDaySeconds,
    requiredPerWeekSeconds: requiredPerDaySeconds * 7,
  };
}
