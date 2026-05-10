import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/** Riot API の生レスポンスを保存する。スキーマ変更時の再構築用。 */
export const rawData = sqliteTable(
  "raw_data",
  {
    matchId: text("match_id").notNull(),
    dataType: text("data_type").notNull().$type<"match" | "timeline">(),
    payload: text("payload").notNull(),
    fetchedAt: integer("fetched_at").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.dataType] })]
);

/** 試合の基本情報 */
export const matches = sqliteTable("matches", {
  matchId: text("match_id").primaryKey(),
  gameCreation: integer("game_creation").notNull(),
  gameDuration: integer("game_duration").notNull(),
  gameVersion: text("game_version").notNull(),
  patch: text("patch").notNull(),
  queueId: integer("queue_id").notNull(),
  win: integer("win").notNull().$type<0 | 1>(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** 自分のパフォーマンス */
export const myPerformance = sqliteTable("my_performance", {
  matchId: text("match_id")
    .primaryKey()
    .references(() => matches.matchId, { onDelete: "cascade" }),
  championId: integer("champion_id").notNull(),
  championName: text("champion_name").notNull(),
  role: text("role").notNull().$type<
    "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY"
  >(),
  teamId: integer("team_id").notNull().$type<100 | 200>(),
  kills: integer("kills").notNull(),
  deaths: integer("deaths").notNull(),
  assists: integer("assists").notNull(),
  csTotal: integer("cs_total").notNull(),
  goldTotal: integer("gold_total").notNull(),
  damageToChampions: integer("damage_to_champions").notNull(),
  visionScore: integer("vision_score").notNull(),
  csAt15: integer("cs_at_15"),
  goldAt15: integer("gold_at_15"),
  levelAt15: integer("level_at_15"),
  xpAt15: integer("xp_at_15"),
});

/** 対面相手の情報。マッチアップ分析のコア */
export const matchup = sqliteTable("matchup", {
  matchId: text("match_id")
    .primaryKey()
    .references(() => matches.matchId, { onDelete: "cascade" }),
  opponentPuuid: text("opponent_puuid"),
  oppChampionId: integer("opp_champion_id").notNull(),
  oppChampionName: text("opp_champion_name").notNull(),
  oppKills: integer("opp_kills").notNull(),
  oppDeaths: integer("opp_deaths").notNull(),
  oppAssists: integer("opp_assists").notNull(),
  oppCsTotal: integer("opp_cs_total").notNull(),
  oppGoldTotal: integer("opp_gold_total").notNull(),
  oppDamageToChampions: integer("opp_damage_to_champions").notNull(),
  oppCsAt15: integer("opp_cs_at_15"),
  oppGoldAt15: integer("opp_gold_at_15"),
  oppLevelAt15: integer("opp_level_at_15"),
  csDiffAt15: integer("cs_diff_at_15"),
  goldDiffAt15: integer("gold_diff_at_15"),
});

/** ビルド履歴イベント (アイテム購入・売却等) */
export const myBuildEvents = sqliteTable("my_build_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchId: text("match_id")
    .notNull()
    .references(() => matches.matchId, { onDelete: "cascade" }),
  timestampMs: integer("timestamp_ms").notNull(),
  itemId: integer("item_id").notNull(),
  eventType: text("event_type")
    .notNull()
    .$type<"ITEM_PURCHASED" | "ITEM_SOLD" | "ITEM_UNDO" | "ITEM_DESTROYED">(),
});

/** スキル習得順序 */
export const mySkillOrder = sqliteTable(
  "my_skill_order",
  {
    matchId: text("match_id")
      .notNull()
      .references(() => matches.matchId, { onDelete: "cascade" }),
    level: integer("level").notNull(),
    skillSlot: integer("skill_slot").notNull().$type<1 | 2 | 3 | 4>(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.level] })]
);

/** 同期履歴。最終同期時刻とデバッグ用 */
export const syncLog = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: integer("started_at").notNull(),
  finishedAt: integer("finished_at"),
  matchesAdded: integer("matches_added").notNull().default(0),
  matchesSkipped: integer("matches_skipped").notNull().default(0),
  status: text("status")
    .notNull()
    .$type<"running" | "success" | "failed">(),
  errorMessage: text("error_message"),
});

export type RawDataRow = typeof rawData.$inferInsert;
export type MatchRow = typeof matches.$inferInsert;
export type MyPerformanceRow = typeof myPerformance.$inferInsert;
export type MatchupRow = typeof matchup.$inferInsert;
export type BuildEventRow = typeof myBuildEvents.$inferInsert;
export type SkillOrderRow = typeof mySkillOrder.$inferInsert;
export type SyncLogRow = typeof syncLog.$inferInsert;
