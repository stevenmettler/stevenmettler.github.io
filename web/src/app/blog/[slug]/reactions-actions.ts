"use server";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { postReactions } from "@/db/schema";
import { REACTION_EMOJI } from "@/lib/reaction-emoji";

export async function reactToPost(postId: number, emoji: string) {
  if (!REACTION_EMOJI.includes(emoji as (typeof REACTION_EMOJI)[number])) {
    throw new Error("Invalid reaction");
  }

  await db
    .insert(postReactions)
    .values({ postId, emoji, count: 1 })
    .onConflictDoUpdate({
      target: [postReactions.postId, postReactions.emoji],
      set: { count: sql`${postReactions.count} + 1` },
    });
}
