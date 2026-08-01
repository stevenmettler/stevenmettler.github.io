import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  date,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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

// --- Goal hour tracking (owner-only, /goals) -----------------------------

// A long-horizon time goal, e.g. "1000 hours of working out in 2026". The
// window is stored as plain dates rather than timestamps because a goal starts
// and ends on a calendar day, not at an instant. Single-tenant on purpose:
// there is no owner column because /goals is gated to the owner in one place.
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Seconds, not hours, so every duration in the feature shares one unit.
  targetSeconds: integer("target_seconds").notNull(),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  archived: boolean("archived").notNull().default(false),
  // The one goal shown publicly on the homepage. Kept to a single row by the
  // feature action, which clears the flag everywhere else in one transaction;
  // the public read takes the first match regardless, so a stray second row
  // would degrade rather than break.
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

// One row per logged block of time. A row with `ended_at IS NULL` is a
// stopwatch that is still running: keeping it here rather than in a separate
// table means stopping the timer is a single UPDATE, and a running timer
// survives a refresh or a move to another device because it lives in Postgres
// instead of browser state.
//
// `duration_seconds` is the source of truth for totals, not the difference
// between the timestamps, so hand-edited entries need no special casing.
export const goalSessions = pgTable(
  "goal_sessions",
  {
    id: serial("id").primaryKey(),
    goalId: integer("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    note: text("note"),
    source: text("source").notNull().default("timer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // At most one running timer per goal, enforced by the database. "At most
    // one running timer overall" is a product rule and lives in the actions.
    uniqueIndex("goal_sessions_one_running_per_goal")
      .on(table.goalId)
      .where(sql`ended_at is null`),
  ]
);

export type GoalSession = typeof goalSessions.$inferSelect;
export type NewGoalSession = typeof goalSessions.$inferInsert;
