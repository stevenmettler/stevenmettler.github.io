import { eq } from "drizzle-orm";
import { db } from "@/db";
import { postReactions } from "@/db/schema";

export async function getReactionsForPost(postId: number) {
  const rows = await db
    .select({ emoji: postReactions.emoji, count: postReactions.count })
    .from(postReactions)
    .where(eq(postReactions.postId, postId));

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.emoji] = row.count;
  }
  return counts;
}
