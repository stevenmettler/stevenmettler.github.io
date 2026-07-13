import Link from "next/link";
import { createPost } from "../actions";
import styles from "../admin.module.css";

export default function NewPostPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>new post</h1>
        <Link href="/admin">&larr; back</Link>
      </div>

      <form action={createPost} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug (optional — derived from title if left blank)</label>
          <input type="text" id="slug" name="slug" />
        </div>

        <div className={styles.field}>
          <label htmlFor="bodyMarkdown">Body (Markdown)</label>
          <textarea
            id="bodyMarkdown"
            name="bodyMarkdown"
            className={styles.textarea}
          />
        </div>

        <label className={styles.checkboxRow}>
          <input type="checkbox" name="published" />
          Published
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
