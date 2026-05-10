import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { matches, matchup, myPerformance } from "../db/schema";

export interface ChampionStats {
  championName: string;
  total: number;
  wins: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKda: number;
  avgCs: number;
  avgDamage: number;
}

/**
 * チャンピオン別統計の集計クエリ群。
 */
export const championStatsAggregator = {
  /**
   * 全チャンピオンの集計統計を返す (試合数降順)。
   */
  getAllChampionStats(): ChampionStats[] {
    const rows = db
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

    return rows.map((r) => {
      const winRate = r.total > 0 ? r.wins / r.total : 0;
      const avgKda =
        r.avgDeaths > 0
          ? (r.avgKills + r.avgAssists) / r.avgDeaths
          : r.avgKills + r.avgAssists;
      return { ...r, winRate, avgKda };
    });
  },

  /**
   * 対面チャンピオン別の勝率を特定チャンピオンで絞り込む。
   */
  getMatchupWinRates(championName: string) {
    const rows = db
      .select({
        oppChampionName: matchup.oppChampionName,
        total: sql<number>`COUNT(*)`,
        wins: sql<number>`COALESCE(SUM(${matches.win}), 0)`,
        avgCsDiff: sql<number | null>`AVG(${matchup.csDiffAt15})`,
        avgGoldDiff: sql<number | null>`AVG(${matchup.goldDiffAt15})`,
      })
      .from(matchup)
      .innerJoin(matches, eq(matchup.matchId, matches.matchId))
      .innerJoin(myPerformance, eq(matchup.matchId, myPerformance.matchId))
      .where(eq(myPerformance.championName, championName))
      .groupBy(matchup.oppChampionName)
      .orderBy(desc(sql`COUNT(*)`))
      .all();

    return rows.map((r) => ({
      ...r,
      winRate: r.total > 0 ? r.wins / r.total : 0,
    }));
  },
};
