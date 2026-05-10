import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { matchup, matches, myPerformance, myBuildEvents } from "../db/schema";

export interface MatchupSummary {
  myChampion: string;
  oppChampion: string;
  total: number;
  wins: number;
  winRate: number;
  avgCsDiffAt15: number | null;
  avgGoldDiffAt15: number | null;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
}

export interface MatchupDetail {
  matchId: string;
  gameCreation: number;
  gameDuration: number;
  patch: string;
  win: number;
  kills: number;
  deaths: number;
  assists: number;
  csTotal: number;
  goldTotal: number;
  csAt15: number | null;
  goldAt15: number | null;
  oppKills: number;
  oppDeaths: number;
  oppAssists: number;
  oppCsTotal: number;
  oppGoldTotal: number;
  oppCsAt15: number | null;
  oppGoldAt15: number | null;
  csDiffAt15: number | null;
  goldDiffAt15: number | null;
}

/**
 * マッチアップ統計の集計クエリ群。
 * 「自分のA vs 相手のB」形式のデータを集計する。
 */
export const matchupStatsAggregator = {
  /**
   * 全マッチアップの勝率サマリーを返す。
   */
  getAllMatchups(): MatchupSummary[] {
    const rows = db
      .select({
        myChampion: myPerformance.championName,
        oppChampion: matchup.oppChampionName,
        total: sql<number>`COUNT(*)`,
        wins: sql<number>`COALESCE(SUM(${matches.win}), 0)`,
        avgCsDiffAt15: sql<number | null>`AVG(${matchup.csDiffAt15})`,
        avgGoldDiffAt15: sql<number | null>`AVG(${matchup.goldDiffAt15})`,
        avgKills: sql<number>`AVG(${myPerformance.kills})`,
        avgDeaths: sql<number>`AVG(${myPerformance.deaths})`,
        avgAssists: sql<number>`AVG(${myPerformance.assists})`,
      })
      .from(matchup)
      .innerJoin(matches, eq(matchup.matchId, matches.matchId))
      .innerJoin(myPerformance, eq(matchup.matchId, myPerformance.matchId))
      .groupBy(myPerformance.championName, matchup.oppChampionName)
      .orderBy(desc(sql`COUNT(*)`))
      .all();

    return rows.map((r) => ({
      ...r,
      winRate: r.total > 0 ? r.wins / r.total : 0,
    }));
  },

  /**
   * 特定マッチアップの詳細試合一覧を返す。
   * @param myChampion 自分のチャンピオン名
   * @param oppChampion 対面チャンピオン名
   */
  getMatchupDetails(
    myChampion: string,
    oppChampion: string
  ): MatchupDetail[] {
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
        csAt15: myPerformance.csAt15,
        goldAt15: myPerformance.goldAt15,
        oppKills: matchup.oppKills,
        oppDeaths: matchup.oppDeaths,
        oppAssists: matchup.oppAssists,
        oppCsTotal: matchup.oppCsTotal,
        oppGoldTotal: matchup.oppGoldTotal,
        oppCsAt15: matchup.oppCsAt15,
        oppGoldAt15: matchup.oppGoldAt15,
        csDiffAt15: matchup.csDiffAt15,
        goldDiffAt15: matchup.goldDiffAt15,
      })
      .from(matchup)
      .innerJoin(matches, eq(matchup.matchId, matches.matchId))
      .innerJoin(myPerformance, eq(matchup.matchId, myPerformance.matchId))
      .where(
        and(
          eq(myPerformance.championName, myChampion),
          eq(matchup.oppChampionName, oppChampion)
        )
      )
      .orderBy(desc(matches.gameCreation))
      .all();
  },

  /**
   * 苦手対面ランキング (勝率が低い順、最低3試合以上)。
   */
  getHardMatchups(minGames = 3): MatchupSummary[] {
    const all = matchupStatsAggregator.getAllMatchups();
    return all
      .filter((m) => m.total >= minGames)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 10);
  },

  /**
   * 特定マッチアップの勝ち試合と負け試合のビルドを返す。
   * ビルド比較機能で使用する。
   */
  async getMatchupBuilds(matchIds: string[]) {
    if (matchIds.length === 0) return [];

    return db
      .select()
      .from(myBuildEvents)
      .where(
        sql`${myBuildEvents.matchId} IN (${sql.join(matchIds.map((id) => sql`${id}`), sql`, `)})`
      )
      .orderBy(myBuildEvents.matchId, myBuildEvents.timestampMs)
      .all();
  },
};
