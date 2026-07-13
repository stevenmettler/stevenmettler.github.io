import Link from "next/link";
import { getAllPostsForAdmin } from "@/lib/posts";
import { deletePost, signOutAction } from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>admin</h1>
        <div className={styles.actions}>
          <Link href="/admin/new">+ new post</Link>
          <form action={signOutAction}>
            <button type="submit" className={styles.signOutBtn}>
              sign out
            </button>
          </form>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className={styles.empty}>No posts yet.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} className={styles.row}>
              <div className={styles.rowTitle}>
                <span>{post.title}</span>
                {!post.published && <span className={styles.draftTag}>draft</span>}
                <span style={{ color: "#999", fontSize: 12 }}>{post.date}</span>
              </div>
              <div className={styles.rowActions}>
                <Link href={`/admin/${post.id}/edit`}>edit</Link>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={post.id} />
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
