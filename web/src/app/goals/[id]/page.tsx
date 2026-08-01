import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteGoal,
  deleteSession,
  updateGoal,
  updateSession,
} from "../actions";
import { GoalCard } from "../goal-card";
import { GoalsShell } from "../shell";
import styles from "../goals.module.css";
import {
  computeProgress,
  formatDuration,
  formatHours,
  todayInZone,
} from "@/lib/goal-progress";
import {
  getGoalById,
  getRecentTotalsByGoal,
  getRunningSession,
  getSessions,
} from "@/lib/goals";

export const dynamic = "force-dynamic";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const goal = await getGoalById(id);
  if (!goal) notFound();

  const now = new Date();
  const [sessions, running, recentTotals] = await Promise.all([
    getSessions({ goalId: id, limit: 500 }),
    getRunningSession(),
    getRecentTotalsByGoal(now),
  ]);

  const today = todayInZone(now);
  const progress = computeProgress({
    targetSeconds: goal.targetSeconds,
    loggedSeconds: goal.loggedSeconds,
    startsOn: goal.startsOn,
    endsOn: goal.endsOn,
    now,
  });

  return (
    <GoalsShell
      title={goal.name}
      note={`${goal.startsOn} to ${goal.endsOn}`}
      breadcrumb={<Link href="/goals">goals</Link>}
    >
      <section className={styles.block}>
        <GoalCard
          goal={goal}
          progress={progress}
          recent={recentTotals.get(goal.id)}
          today={today}
          canStartTimer={!running}
          linkToDetail={false}
        />
      </section>

      <section className={styles.block}>
        <div className={styles.blockHead}>
          <p className={styles.blockLabel}>Entries ({sessions.length})</p>
          {sessions.length > 0 ? (
            <div className={styles.exports}>
              <a href={`/goals/export?goal=${goal.id}`} download>
                these entries .csv
              </a>
            </div>
          ) : null}
        </div>
        {sessions.length === 0 ? (
          <p className={styles.empty}>Nothing logged against this goal yet.</p>
        ) : (
          <div className={styles.entries}>
            {sessions.map(({ session }) => (
              <div key={session.id} className={styles.entry}>
                <form action={updateSession} className={styles.entryForm}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="goalId" value={goal.id} />
                  <span className={styles.entryDuration}>
                    <input
                      type="text"
                      name="duration"
                      defaultValue={formatDuration(session.durationSeconds ?? 0)}
                      aria-label="duration"
                      required
                    />
                  </span>
                  <input
                    type="date"
                    name="day"
                    defaultValue={todayInZone(session.startedAt)}
                    aria-label="date"
                  />
                  <span className={styles.entryNote}>
                    <input
                      type="text"
                      name="note"
                      defaultValue={session.note ?? ""}
                      placeholder="note"
                      maxLength={280}
                      aria-label="note"
                    />
                  </span>
                  {session.source === "manual" ? (
                    <span className={styles.tag}>manual</span>
                  ) : null}
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonSmall}`}
                  >
                    save
                  </button>
                </form>
                <form action={deleteSession}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="goalId" value={goal.id} />
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                  >
                    delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.block}>
        <details>
          <summary className={styles.disclosure}>Edit goal</summary>
          <div className={styles.disclosureBody}>
            <form action={updateGoal} className={styles.form}>
              <input type="hidden" name="goalId" value={goal.id} />
              <label className={`${styles.field} ${styles.fieldWide}`}>
                name
                <input
                  type="text"
                  name="name"
                  defaultValue={goal.name}
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
                  defaultValue={formatHours(goal.targetSeconds)}
                  required
                  size={8}
                />
              </label>
              <label className={styles.field}>
                from
                <input
                  type="date"
                  name="startsOn"
                  defaultValue={goal.startsOn}
                  required
                />
              </label>
              <label className={styles.field}>
                to
                <input
                  type="date"
                  name="endsOn"
                  defaultValue={goal.endsOn}
                  required
                />
              </label>
              <label className={`${styles.field} ${styles.fieldInline}`}>
                archived
                <input
                  type="checkbox"
                  name="archived"
                  defaultChecked={goal.archived}
                />
              </label>
              <button type="submit" className={styles.button}>
                save
              </button>
            </form>

            <form action={deleteGoal} className={styles.formSeparated}>
              <input type="hidden" name="goalId" value={goal.id} />
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonDanger}`}
              >
                delete goal and all {sessions.length} entries
              </button>
            </form>
          </div>
        </details>
      </section>
    </GoalsShell>
  );
}
