import Link from "next/link";
import { featureGoal, startTimer, unfeatureGoal } from "./actions";
import styles from "./goals.module.css";
import {
  daysBetween,
  formatDuration,
  formatHours,
  formatSignedDuration,
  type GoalProgress,
} from "@/lib/goal-progress";
import type { GoalWithTotal, RecentTotals } from "@/lib/goals";

export function GoalCard({
  goal,
  progress,
  recent,
  today,
  canStartTimer,
  linkToDetail = true,
}: {
  goal: GoalWithTotal;
  progress: GoalProgress;
  recent?: RecentTotals;
  today: string;
  canStartTimer: boolean;
  linkToDetail?: boolean;
}) {
  const pacePercent = progress.targetSeconds
    ? Math.min(100, (progress.expectedSeconds / progress.targetSeconds) * 100)
    : 100;

  return (
    <article
      className={`${styles.goal} ${goal.archived ? styles.goalArchived : ""}`}
    >
      <div className={styles.goalTop}>
        {linkToDetail ? (
          <Link href={`/goals/${goal.id}`} className={styles.goalName}>
            {goal.name}
          </Link>
        ) : (
          <span className={styles.goalName}>{goal.name}</span>
        )}

        <span className={styles.goalTotal}>
          <b>{formatHours(goal.loggedSeconds)}h</b> /{" "}
          {formatHours(goal.targetSeconds)}h
        </span>
      </div>

      <div className={styles.bar}>
        <div
          className={styles.barFill}
          style={{ width: `${progress.percentComplete}%` }}
        />
        {progress.status === "active" ? (
          <div className={styles.barPace} style={{ left: `${pacePercent}%` }} />
        ) : null}
      </div>

      <div className={styles.stats}>
        {progress.isComplete ? (
          <span className={styles.done}>goal complete</span>
        ) : (
          <span>{formatHours(progress.remainingSeconds)}h left</span>
        )}
        <span>{progress.percentComplete.toFixed(1)}%</span>
        <span>{windowLabel(goal, progress, today)}</span>
        {progress.status === "active" && !progress.isComplete ? (
          <>
            <span
              className={progress.deltaSeconds >= 0 ? styles.ahead : styles.behind}
            >
              {formatSignedDuration(progress.deltaSeconds)}{" "}
              {progress.deltaSeconds >= 0 ? "ahead of pace" : "behind pace"}
            </span>
            <span>{formatHours(progress.requiredPerWeekSeconds)}h/wk to finish</span>
          </>
        ) : null}
        {recent?.today ? <span>{formatDuration(recent.today)} today</span> : null}
        {recent?.last7Days ? (
          <span>{formatDuration(recent.last7Days)} past 7d</span>
        ) : null}
      </div>

      {goal.archived ? null : (
        <div className={styles.cardActions}>
          {canStartTimer ? (
            <form action={startTimer}>
              <input type="hidden" name="goalId" value={goal.id} />
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonSmall}`}
              >
                start timer
              </button>
            </form>
          ) : null}

          <form action={goal.featured ? unfeatureGoal : featureGoal}>
            <input type="hidden" name="goalId" value={goal.id} />
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonSmall} ${
                goal.featured ? styles.buttonOn : styles.buttonQuiet
              }`}
              title={
                goal.featured
                  ? "Currently shown on your homepage"
                  : "Show this goal on your homepage"
              }
            >
              {goal.featured ? "on homepage" : "show on homepage"}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function windowLabel(
  goal: GoalWithTotal,
  progress: GoalProgress,
  today: string
): string {
  if (progress.status === "upcoming") {
    const days = daysBetween(today, goal.startsOn);
    return days === 1 ? "starts tomorrow" : `starts in ${days} days`;
  }
  if (progress.status === "ended") return "window closed";

  const days = progress.daysRemaining;
  return days === 1 ? "last day" : `${days} days left`;
}
