import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { posts } from "@/db/schema";

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
};

export type Post = PostSummary & {
  id: number;
  bodyMarkdown: string;
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    date: formatDate(row.createdAt),
  }));
}

export async function getPublishedPostsFull(): Promise<Post[]> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: formatDate(row.createdAt),
    bodyMarkdown: row.bodyMarkdown,
  }));
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.published, true)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: formatDate(row.createdAt),
    bodyMarkdown: row.bodyMarkdown,
  };
}

export type AdminPostSummary = {
  id: number;
  slug: string;
  title: string;
  published: boolean;
  date: string;
};

export async function getAllPostsForAdmin(): Promise<AdminPostSummary[]> {
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      published: posts.published,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    published: row.published,
    date: formatDate(row.createdAt),
  }));
}

export async function getPostById(id: number) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}
