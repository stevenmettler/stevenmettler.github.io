import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";

export async function getApprovedGuestbookEntries() {
  return db
    .select()
    .from(guestbookEntries)
    .where(eq(guestbookEntries.approved, true))
    .orderBy(desc(guestbookEntries.createdAt));
}

export async function getAllGuestbookEntries() {
  return db
    .select()
    .from(guestbookEntries)
    .orderBy(desc(guestbookEntries.createdAt));
}
