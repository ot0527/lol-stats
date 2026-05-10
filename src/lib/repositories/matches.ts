import { desc, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { matches, myPerformance, myBuildEvents, mySkillOrder, matchup } from "../db/schema";
import type {
  BuildEventRow,
  MatchRow,
  MatchupRow,
  MyPerformanceRow,
  SkillOrderRow,
} from "../db/schema";

/**
 * 試合データの永続化リポジトリ。
 * DB への書き込みは必ずここを経由する。
 */
export const matchRepository = {
  /**
   * 指定した match_id が既に存在するかチェックする。
   * 冪等な同期のために使用する。
   */
  findExistingIds(matchIds: string[]): Set<string> {
    if (matchIds.length === 0) return new Set();
    const rows = db
      .select({ matchId: matches.matchId })
      .from(matches)
      .where(inArray(matches.matchId, matchIds))
      .all();
    return new Set(rows.map((r) => r.matchId));
  },

  /**
   * 1試合分のデータをトランザクションで一括挿入する。
   * 冪等性のため全テーブルで onConflictDoNothing を使用。
   */
  insertMatchTransaction(data: {
    match: MatchRow;
    myPerf: MyPerformanceRow;
    matchupRow: MatchupRow | null;
    buildEvents: BuildEventRow[];
    skillOrders: SkillOrderRow[];
  }): void {
    db.transaction(() => {
      db.insert(matches).values(data.match).onConflictDoNothing().run();
      db.insert(myPerformance).values(data.myPerf).onConflictDoNothing().run();

      if (data.matchupRow) {
        db.insert(matchup).values(data.matchupRow).onConflictDoNothing().run();
      }

      if (data.buildEvents.length > 0) {
        // build_events は match_id + timestamp が重複することがあるためIDベース
        db.insert(myBuildEvents).values(data.buildEvents).onConflictDoNothing().run();
      }

      if (data.skillOrders.length > 0) {
        db.insert(mySkillOrder).values(data.skillOrders).onConflictDoNothing().run();
      }
    });
  },

  /**
   * 最近の試合を取得する (ダッシュボード表示用)。
   */
  findRecent(limit = 20) {
    return db
      .select({
        matchId: matches.matchId,
        gameCreation: matches.gameCreation,
        gameDuration: matches.gameDuration,
        patch: matches.patch,
        win: matches.win,
        championName: myPerformance.championName,
        role: myPerformance.role,
        kills: myPerformance.kills,
        deaths: myPerformance.deaths,
        assists: myPerformance.assists,
        csTotal: myPerformance.csTotal,
        oppChampionName: matchup.oppChampionName,
      })
      .from(matches)
      .leftJoin(myPerformance, sql`${matches.matchId} = ${myPerformance.matchId}`)
      .leftJoin(matchup, sql`${matches.matchId} = ${matchup.matchId}`)
      .orderBy(desc(matches.gameCreation))
      .limit(limit)
      .all();
  },

  /** 総試合数と勝率を集計する */
  getSummary() {
    const result = db
      .select({
        total: sql<number>`COUNT(*)`,
        wins: sql<number>`COALESCE(SUM(${matches.win}), 0)`,
      })
      .from(matches)
      .get();
    return result ?? { total: 0, wins: 0 };
  },

  /** パッチ別の勝率集計 */
  getWinRateByPatch() {
    return db
      .select({
        patch: matches.patch,
        total: sql<number>`COUNT(*)`,
        wins: sql<number>`COALESCE(SUM(${matches.win}), 0)`,
      })
      .from(matches)
      .groupBy(matches.patch)
      .orderBy(desc(matches.patch))
      .all();
  },
};
