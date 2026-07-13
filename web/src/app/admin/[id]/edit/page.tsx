import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/posts";
import { deletePost, updatePost } from "../../actions";
import styles from "../../admin.module.css";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  const post = await getPostById(postId);

  if (!post) notFound();

  const updatePostWithId = updatePost.bind(null, postId);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>edit post</h1>
        <Link href="/admin">&larr; back</Link>
      </div>

      <form action={updatePostWithId} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" defaultValue={post.title} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="slug">Slug</label>
          <input type="text" id="slug" name="slug" defaultValue={post.slug} />
        </div>

        <div className={styles.field}>
          <label htmlFor="bodyMarkdown">Body (Markdown)</label>
          <textarea
            id="bodyMarkdown"
            name="bodyMarkdown"
            className={styles.textarea}
            defaultValue={post.bodyMarkdown}
          />
        </div>

        <label className={styles.checkboxRow}>
          <input type="checkbox" name="published" defaultChecked={post.published} />
          Published
        </label>

        <div className={styles.actions}>
          <button type="submit" className={styles.submitBtn}>
            Save
          </button>
        </div>
      </form>

      <form action={deletePost} style={{ marginTop: 32 }}>
        <input type="hidden" name="id" value={post.id} />
        <button type="submit" className={styles.deleteBtn}>
          Delete this post
        </button>
      </form>
    </div>
  );
}
