"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";
import { requireAdmin } from "../actions";

export async function approveGuestbookEntry(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  await db
    .update(guestbookEntries)
    .set({ approved: true })
    .where(eq(guestbookEntries.id, id));

  redirect("/admin/guestbook");
}

export async function deleteGuestbookEntry(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  await db.delete(guestbookEntries).where(eq(guestbookEntries.id, id));

  redirect("/admin/guestbook");
}
