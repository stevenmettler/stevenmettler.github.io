"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { posts } from "@/db/schema";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function createPost(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const published = formData.get("published") === "on";
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || title);

  if (!title || !slug) {
    throw new Error("Title is required");
  }

  await db.insert(posts).values({ title, slug, bodyMarkdown, published });

  redirect("/admin");
}

export async function updatePost(id: number, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const bodyMarkdown = String(formData.get("bodyMarkdown") ?? "");
  const published = formData.get("published") === "on";
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || title);

  if (!title || !slug) {
    throw new Error("Title is required");
  }

  await db
    .update(posts)
    .set({ title, slug, bodyMarkdown, published, updatedAt: new Date() })
    .where(eq(posts.id, id));

  redirect("/admin");
}

export async function deletePost(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  await db.delete(posts).where(eq(posts.id, id));

  redirect("/admin");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
