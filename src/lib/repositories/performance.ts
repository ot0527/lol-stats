import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { matchup, matches, myPerformance, myBuildEvents } from "../db/schema";

/**
 * チャンピオン別パフォーマンスのリポジトリ。
 */
export const performanceRepository = {
  /**
   * チャンピオン別の集計統計を返す。
   */
  getChampionStats() {
    return db
      .select({
        championName: myPerformance.championName,
        total: sql<number>`COUNT(*)`,
        wins: sql<number>`COALESCE(SUM(${matches.win}), 0)`,
        avgKills: sql<number>`AVG(${myPerformance.kills})`,
        avgDeaths: sql<number>`AVG(${myPerformance.deaths})`,
        avgAssists: sql<number>`AVG(${myPerformance.assists})`,
        avgCs: sql<number>`AVG(${myPerformance.csTotal})`,
        avgDamage: sql<number>`AVG(${myPerformance.damageToChampions})`,
      })
      .from(myPerformance)
      .innerJoin(matches, eq(myPerformance.matchId, matches.matchId))
      .groupBy(myPerformance.championName)
      .orderBy(desc(sql`COUNT(*)`))
      .all();
  },

  /**
   * 特定チャンピオンの試合履歴を返す。
   */
  findByChampion(championName: string, limit = 50) {
    return db
      .select({
        matchId: matches.matchId,
        gameCreation: matches.gameCreation,
        gameDuration: matches.gameDuration,
        patch: matches.patch,
        win: matches.win,
        kills: myPerformance.kills,
        deaths: myPerformance.deaths,
        assists: myPerformance.assists,
        csTotal: myPerformance.csTotal,
        goldTotal: myPerformance.goldTotal,
        damageToChampions: myPerformance.damageToChampions,
        csAt15: myPerformance.csAt15,
        goldAt15: myPerformance.goldAt15,
        oppChampionName: matchup.oppChampionName,
        csDiffAt15: matchup.csDiffAt15,
        goldDiffAt15: matchup.goldDiffAt15,
      })
      .from(myPerformance)
      .innerJoin(matches, eq(myPerformance.matchId, matches.matchId))
      .leftJoin(matchup, eq(myPerformance.matchId, matchup.matchId))
      .where(eq(myPerformance.championName, championName))
      .orderBy(desc(matches.gameCreation))
      .limit(limit)
      .all();
  },

  /**
   * 特定試合のビルド履歴を返す。
   */
  getBuildEvents(matchId: string) {
    return db
      .select()
      .from(myBuildEvents)
      .where(eq(myBuildEvents.matchId, matchId))
      .orderBy(myBuildEvents.timestampMs)
      .all();
  },
};
