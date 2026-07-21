import { pgTable, serial, text, boolean, timestamp, integer, unique } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  published: boolean("published").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export const guestbookEntries = pgTable("guestbook_entries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GuestbookEntry = typeof guestbookEntries.$inferSelect;
export type NewGuestbookEntry = typeof guestbookEntries.$inferInsert;

export const postReactions = pgTable(
  "post_reactions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [unique().on(table.postId, table.emoji)]
);

export type PostReaction = typeof postReactions.$inferSelect;

// --- Catacombs game: accounts + meta-progression -------------------------

// One row per signed-in player, keyed on the provider-agnostic OAuth identity
// so a GitHub user and a Google user each get a distinct row. Populated lazily
// on the first authenticated /api/game/* request.
export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.provider, table.providerAccountId)]
);

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

// Persistent per-player wallet. Bones are earned every run and spent between
// runs on permanent unlocks.
export const gameProfiles = pgTable("game_profiles", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .unique()
    .references(() => players.id, { onDelete: "cascade" }),
  bones: integer("bones").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GameProfile = typeof gameProfiles.$inferSelect;

// One row per purchased unlock. `unlock_key` references the in-code catalog,
// e.g. "class:mage" or "skill:crit_1".
export const gameUnlocks = pgTable(
  "game_unlocks",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    unlockKey: text("unlock_key").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.playerId, table.unlockKey)]
);

export type GameUnlock = typeof gameUnlocks.$inferSelect;

// One row per completed run. Doubles as the anti-cheat audit log and the
// future leaderboard source.
export const gameRuns = pgTable("game_runs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  classKey: text("class_key"),
  depth: integer("depth").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  gold: integer("gold").notNull().default(0),
  turns: integer("turns").notNull().default(0),
  bonesAwarded: integer("bones_awarded").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GameRun = typeof gameRuns.$inferSelect;
