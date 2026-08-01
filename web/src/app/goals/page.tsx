import Link from "next/link";
import { createGoal, discardTimer, logSession, stopTimer } from "./actions";
import { GoalCard } from "./goal-card";
import { LiveTimer } from "./live-timer";
import { GoalsShell } from "./shell";
import styles from "./goals.module.css";
import {
  computeProgress,
  formatDuration,
  todayInZone,
} from "@/lib/goal-progress";
import {
  getGoalsWithTotals,
  getRecentTotalsByGoal,
  getRunningSession,
  getSessions,
} from "@/lib/goals";

export const dynamic = "force-dynamic";

export const metadata = { title: "goals" };

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ busy?: string }>;
}) {
  const { busy } = await searchParams;
  const now = new Date();
  const [allGoals, running, recentTotals, recentSessions] = await Promise.all([
    getGoalsWithTotals(),
    getRunningSession(),
    getRecentTotalsByGoal(now),
    getSessions({ limit: 12 }),
  ]);

  const today = todayInZone(now);
  const activeGoals = allGoals.filter((goal) => !goal.archived);
  const archivedGoals = allGoals.filter((goal) => goal.archived);

  return (
    <GoalsShell title="Goals" note={`${today} · eastern`}>
      {busy ? (
        <p className={styles.notice}>
          A timer was already running, so nothing new was started.
        </p>
      ) : null}

      {running ? (
        <section className={styles.running}>
          <div className={styles.runningMain}>
            <span className={styles.runningClock}>
              <LiveTimer
                startedAt={running.session.startedAt.toISOString()}
                initialElapsedSeconds={
                  (now.getTime() - running.session.startedAt.getTime()) / 1000
                }
              />
            </span>
            <span className={styles.runningGoal}>{running.goal.name}</span>
          </div>
          <div className={styles.runningActions}>
            <form action={stopTimer}>
              <button type="submit" className={styles.button}>
                stop &amp; log
              </button>
            </form>
            <form action={discardTimer}>
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonQuiet}`}
              >
                discard
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className={styles.block}>
        <p className={styles.blockLabel}>Active</p>
        {activeGoals.length === 0 ? (
          <p className={styles.empty}>
            No goals yet. Add one below to start tracking hours.
          </p>
        ) : (
          <div className={styles.goals}>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={computeProgress({
                  targetSeconds: goal.targetSeconds,
                  loggedSeconds: goal.loggedSeconds,
                  startsOn: goal.startsOn,
                  endsOn: goal.endsOn,
                  now,
                })}
                recent={recentTotals.get(goal.id)}
                today={today}
                canStartTimer={!running}
              />
            ))}
          </div>
        )}
      </section>

      {activeGoals.length > 0 ? (
        <section className={styles.block}>
          <p className={styles.blockLabel}>Log time by hand</p>
          <form action={logSession} className={styles.form}>
            <label className={styles.field}>
              goal
              <select name="goalId" defaultValue={activeGoals[0].id}>
                {activeGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              duration
              <input
                type="text"
                name="duration"
                placeholder="1h30m"
                required
                size={10}
              />
            </label>
            <label className={styles.field}>
              date
              <input type="date" name="day" defaultValue={today} />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              note
              <input type="text" name="note" placeholder="optional" maxLength={280} />
            </label>
            <button type="submit" className={styles.button}>
              log
            </button>
          </form>
          <p className={styles.hint}>
            Durations accept 45m, 1h30m, 1:30, 1.5h, or a bare number of minutes.
          </p>
        </section>
      ) : null}

      <section className={styles.block}>
        <details>
          <summary className={styles.disclosure}>New goal</summary>
          <div className={styles.disclosureBody}>
            <form action={createGoal} className={styles.form}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                name
                <input
                  type="text"
                  name="name"
                  placeholder="work out"
                  maxLength={80}
                  required
                />
              </label>
              <label className={styles.field}>
                target hours
                <input
                  type="number"
                  name="targetHours"
                  min="0.25"
                  step="0.25"
                  placeholder="1000"
                  required
                  size={8}
                />
              </label>
              <label className={styles.field}>
                from
                <input
                  type="date"
                  name="startsOn"
                  defaultValue={startOfYear(today)}
                  required
                />
              </label>
              <label className={styles.field}>
                to
                <input
                  type="date"
                  name="endsOn"
                  defaultValue={endOfYear(today)}
                  required
                />
              </label>
              <button type="submit" className={styles.button}>
                create
              </button>
            </form>
          </div>
        </details>
      </section>

      {recentSessions.length > 0 ? (
        <section className={styles.block}>
          <p className={styles.blockLabel}>Recent entries</p>
          <div className={styles.entries}>
            {recentSessions.map(({ session, goalName }) => (
              <div key={session.id} className={styles.entry}>
                <span className={styles.entryDuration}>
                  {formatDuration(session.durationSeconds ?? 0)}
                </span>
                <span className={styles.entryMeta}>
                  <Link href={`/goals/${session.goalId}`}>{goalName}</Link>
                  <span>{todayInZone(session.startedAt)}</span>
                  {session.note ? <span>{session.note}</span> : null}
                  {session.source === "manual" ? (
                    <span className={styles.tag}>manual</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {archivedGoals.length > 0 ? (
        <section className={styles.block}>
          <p className={styles.blockLabel}>Archived</p>
          <div className={styles.goals}>
            {archivedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={computeProgress({
                  targetSeconds: goal.targetSeconds,
                  loggedSeconds: goal.loggedSeconds,
                  startsOn: goal.startsOn,
                  endsOn: goal.endsOn,
                  now,
                })}
                today={today}
                canStartTimer={false}
              />
            ))}
          </div>
        </section>
      ) : null}
    </GoalsShell>
  );
}

function startOfYear(today: string): string {
  return `${today.slice(0, 4)}-01-01`;
}

function endOfYear(today: string): string {
  return `${today.slice(0, 4)}-12-31`;
}
