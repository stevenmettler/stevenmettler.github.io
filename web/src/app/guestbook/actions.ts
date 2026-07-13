"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { guestbookEntries } from "@/db/schema";

export async function submitGuestbookEntry(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const message = String(formData.get("message") ?? "").trim().slice(0, 500);

  if (!name || !message) {
    throw new Error("Name and message are required");
  }

  await db.insert(guestbookEntries).values({ name, message });

  redirect("/guestbook?submitted=1");
}
