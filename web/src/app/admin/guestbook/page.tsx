import Link from "next/link";
import { getAllGuestbookEntries } from "@/lib/guestbook";
import { approveGuestbookEntry, deleteGuestbookEntry } from "./actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminGuestbookPage() {
  const entries = await getAllGuestbookEntries();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>guestbook</h1>
        <Link href="/admin">&larr; back</Link>
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>No entries yet.</p>
      ) : (
        <div>
          {entries.map((entry) => (
            <div key={entry.id} className={styles.row}>
              <div className={styles.rowTitle}>
                <div className={styles.entryMessage}>
                  <div>{entry.message}</div>
                  <div style={{ color: "#999", fontSize: 12 }}>
                    &mdash; {entry.name}
                  </div>
                </div>
                {!entry.approved && (
                  <span className={styles.draftTag}>pending</span>
                )}
              </div>
              <div className={styles.rowActions}>
                {!entry.approved && (
                  <form action={approveGuestbookEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button type="submit" className={styles.approveBtn}>
                      approve
                    </button>
                  </form>
                )}
                <form action={deleteGuestbookEntry}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button type="submit" className={styles.deleteBtn}>
                    delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
