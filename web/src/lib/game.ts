import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Session } from "next-auth";
import { db } from "@/db";
import { gameProfiles, gameRuns, gameUnlocks, players } from "@/db/schema";

// --- Unlock catalog ------------------------------------------------------
//
// The authoritative price + validity list for everything bones can buy. The
// gameplay *effects* of each key live in the client (catacombs.html); the
// server only needs to know a key exists and what it costs, so new nodes can
// be added on the client + here without a migration. Keep the keys in sync
// with the CATALOG object in catacombs.html.

export interface UnlockDef {
  cost: number;
  kind: "class" | "skill";
  name: string;
}

export const UNLOCK_CATALOG: Record<string, UnlockDef> = {
  // Classes — each pre-grants one existing level-up path at run start.
  "class:warrior": { cost: 40, kind: "class", name: "Warrior" },
  "class:tank": { cost: 40, kind: "class", name: "Tank" },
  "class:mage": { cost: 60, kind: "class", name: "Mage" },
  "class:ranger": { cost: 60, kind: "class", name: "Ranger" },
  // Skill-tree nodes — permanent bumps applied to every run, any class.
  "skill:vitality_1": { cost: 20, kind: "skill", name: "Hardy I (+2 max HP)" },
  "skill:vitality_2": { cost: 45, kind: "skill", name: "Hardy II (+4 max HP)" },
  "skill:might_1": { cost: 30, kind: "skill", name: "Strong Arm (+1 attack)" },
  "skill:fortune_1": { cost: 25, kind: "skill", name: "Coin Pouch (+15 gold)" },
  "skill:fortune_2": { cost: 55, kind: "skill", name: "Deep Pockets (+35 gold)" },
  "skill:arcane_1": { cost: 20, kind: "skill", name: "Focus (+5 max MP)" },
  "skill:efficient_magic": { cost: 50, kind: "skill", name: "Efficient Magic (Fireball -1 MP)" },
  "skill:marksman_1": { cost: 35, kind: "skill", name: "Marksman (+2 shot damage)" },
  "skill:swift": { cost: 60, kind: "skill", name: "Swift (start with Dash)" },
  "skill:endure": { cost: 40, kind: "skill", name: "Endure (+5 max HP & +5 max MP)" },
};

export function isValidUnlockKey(key: string): key is keyof typeof UNLOCK_CATALOG {
  return Object.prototype.hasOwnProperty.call(UNLOCK_CATALOG, key);
}

// --- Bones formula + validation -----------------------------------------

export interface RunStats {
  classKey: string | null;
  depth: number;
  kills: number;
  gold: number;
  turns: number;
}

// Hobby-proportional sanity ceilings. Anything outside these is a bad/hostile
// client; we clamp rather than trust.
const LIMITS = {
  depth: 500,
  kills: 100_000,
  gold: 10_000_000,
  turns: 100_000_000,
};

// Max bones a single player can bank per calendar day, as a cheap abuse cap.
export const DAILY_BONES_CAP = 2_000;

function clampInt(value: unknown, max: number): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function sanitizeRun(body: unknown): RunStats {
  const b = (body ?? {}) as Record<string, unknown>;
  const classKey =
    typeof b.classKey === "string" && isValidUnlockKey(b.classKey)
      ? b.classKey
      : typeof b.classKey === "string" && b.classKey === "class:adventurer"
      ? "class:adventurer"
      : null;
  return {
    classKey,
    depth: clampInt(b.depth, LIMITS.depth),
    kills: clampInt(b.kills, LIMITS.kills),
    gold: clampInt(b.gold, LIMITS.gold),
    turns: clampInt(b.turns, LIMITS.turns),
  };
}

// Fixed server-side formula, derived from the in-game score. Never trusts a
// client-submitted amount.
export function computeBones(stats: RunStats): number {
  // A run implausibly short for the depth reached (fewer than ~1 turn per
  // floor descended) earns nothing, but the run is still logged.
  if (stats.depth > 1 && stats.turns < stats.depth - 1) return 0;
  const bones =
    stats.depth * 2 + Math.floor(stats.kills / 2) + Math.floor(stats.gold / 10);
  return Math.max(0, bones);
}

// --- Session → account helper -------------------------------------------

export interface Account {
  provider: string;
  providerAccountId: string;
  displayName: string | null;
}

export function accountFromSession(session: Session | null): Account | null {
  const user = session?.user;
  if (!user?.provider || !user.accountId) return null;
  const providerAccountId = user.accountId.slice(user.provider.length + 1);
  if (!providerAccountId) return null;
  return {
    provider: user.provider,
    providerAccountId,
    displayName: user.displayName ?? null,
  };
}

// --- Player + profile access --------------------------------------------

// Upsert the player row and ensure a game_profiles row exists. Returns the
// player id. Lazily populated on the first authenticated /api/game/* call.
export async function getOrCreatePlayerId(account: Account): Promise<number> {
  const [player] = await db
    .insert(players)
    .values({
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      displayName: account.displayName,
    })
    .onConflictDoUpdate({
      target: [players.provider, players.providerAccountId],
      set: { displayName: account.displayName },
    })
    .returning({ id: players.id });

  await db
    .insert(gameProfiles)
    .values({ playerId: player.id })
    .onConflictDoNothing();

  return player.id;
}

export interface ProfilePayload {
  bones: number;
  unlocks: string[];
}

export async function getProfile(playerId: number): Promise<ProfilePayload> {
  const [profile] = await db
    .select({ bones: gameProfiles.bones })
    .from(gameProfiles)
    .where(eq(gameProfiles.playerId, playerId));

  const unlockRows = await db
    .select({ key: gameUnlocks.unlockKey })
    .from(gameUnlocks)
    .where(eq(gameUnlocks.playerId, playerId));

  return {
    bones: profile?.bones ?? 0,
    unlocks: unlockRows.map((r) => r.key),
  };
}

// --- Run submission ------------------------------------------------------

export interface RunResult extends ProfilePayload {
  bonesAwarded: number;
}

export async function recordRun(
  playerId: number,
  stats: RunStats
): Promise<RunResult> {
  let awarded = computeBones(stats);

  // Daily cap: sum bones already awarded today, clamp this award to what's
  // left of the allowance.
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [{ awardedToday }] = await db
    .select({
      awardedToday: sql<number>`coalesce(sum(${gameRuns.bonesAwarded}), 0)`,
    })
    .from(gameRuns)
    .where(
      and(eq(gameRuns.playerId, playerId), gte(gameRuns.createdAt, startOfDay))
    );

  const remaining = Math.max(0, DAILY_BONES_CAP - Number(awardedToday));
  awarded = Math.min(awarded, remaining);

  // Log the run (always, even when awarded is clamped to 0) and credit bones.
  await db.insert(gameRuns).values({
    playerId,
    classKey: stats.classKey,
    depth: stats.depth,
    kills: stats.kills,
    gold: stats.gold,
    turns: stats.turns,
    bonesAwarded: awarded,
  });

  if (awarded > 0) {
    await db
      .update(gameProfiles)
      .set({
        bones: sql`${gameProfiles.bones} + ${awarded}`,
        updatedAt: new Date(),
      })
      .where(eq(gameProfiles.playerId, playerId));
  }

  const profile = await getProfile(playerId);
  return { ...profile, bonesAwarded: awarded };
}

// --- Leaderboard ---------------------------------------------------------

export interface LeaderboardEntry {
  displayName: string;
  classKey: string | null;
  depth: number;
  kills: number;
  gold: number;
  createdAt: string;
}

// Top runs, ranked deepest-first (ties broken by kills then gold). Reads the
// game_runs audit log; no separate leaderboard table needed.
export async function getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      displayName: players.displayName,
      classKey: gameRuns.classKey,
      depth: gameRuns.depth,
      kills: gameRuns.kills,
      gold: gameRuns.gold,
      createdAt: gameRuns.createdAt,
    })
    .from(gameRuns)
    .innerJoin(players, eq(gameRuns.playerId, players.id))
    .orderBy(desc(gameRuns.depth), desc(gameRuns.kills), desc(gameRuns.gold))
    .limit(Math.min(Math.max(1, limit), 100));

  return rows.map((r) => ({
    displayName: r.displayName ?? "adventurer",
    classKey: r.classKey,
    depth: r.depth,
    kills: r.kills,
    gold: r.gold,
    createdAt: r.createdAt.toISOString(),
  }));
}

// --- Unlock purchase -----------------------------------------------------

export type UnlockOutcome =
  | { ok: true; bones: number; unlocks: string[] }
  | { ok: false; reason: "invalid" | "insufficient" | "owned"; bones: number };

export async function purchaseUnlock(
  playerId: number,
  unlockKey: string
): Promise<UnlockOutcome> {
  if (!isValidUnlockKey(unlockKey)) {
    const p = await getProfile(playerId);
    return { ok: false, reason: "invalid", bones: p.bones };
  }
  const cost = UNLOCK_CATALOG[unlockKey].cost;

  return db.transaction(async (tx) => {
    // Lock the profile row so concurrent purchases (double-clicks) serialize.
    const [profile] = await tx
      .select({ bones: gameProfiles.bones })
      .from(gameProfiles)
      .where(eq(gameProfiles.playerId, playerId))
      .for("update");

    const bones = profile?.bones ?? 0;

    const existing = await tx
      .select({ id: gameUnlocks.id })
      .from(gameUnlocks)
      .where(
        and(
          eq(gameUnlocks.playerId, playerId),
          eq(gameUnlocks.unlockKey, unlockKey)
        )
      );
    if (existing.length > 0) {
      return { ok: false as const, reason: "owned" as const, bones };
    }

    if (bones < cost) {
      return { ok: false as const, reason: "insufficient" as const, bones };
    }

    await tx.insert(gameUnlocks).values({ playerId, unlockKey });
    await tx
      .update(gameProfiles)
      .set({ bones: bones - cost, updatedAt: new Date() })
      .where(eq(gameProfiles.playerId, playerId));

    const unlockRows = await tx
      .select({ key: gameUnlocks.unlockKey })
      .from(gameUnlocks)
      .where(eq(gameUnlocks.playerId, playerId));

    return {
      ok: true as const,
      bones: bones - cost,
      unlocks: unlockRows.map((r) => r.key),
    };
  });
}
