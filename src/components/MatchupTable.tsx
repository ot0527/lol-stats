"use client";

import Link from "next/link";
import { ChampionIcon } from "./ChampionIcon";
import { WinRateBadge } from "./WinRateBadge";
import type { MatchupSummary } from "@/lib/aggregators/matchup-stats";

interface MatchupTableProps {
  matchups: MatchupSummary[];
}

/**
 * マッチアップ勝率テーブル。
 * 自分のチャンピオン × 対面チャンピオンの勝率を表示する。
 */
export function MatchupTable({ matchups }: MatchupTableProps) {
  if (matchups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        データがありません。まず「データ更新」を実行してください。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4">自分</th>
            <th className="text-left py-3 px-4">対面</th>
            <th className="text-center py-3 px-4">勝率</th>
            <th className="text-center py-3 px-4 hidden sm:table-cell">CS差@15</th>
            <th className="text-center py-3 px-4 hidden md:table-cell">Gold差@15</th>
            <th className="text-center py-3 px-4 hidden lg:table-cell">平均KDA</th>
          </tr>
        </thead>
        <tbody>
          {matchups.map((m, i) => {
            const kda =
              m.avgDeaths > 0
                ? ((m.avgKills + m.avgAssists) / m.avgDeaths).toFixed(2)
                : "∞";
            const csDiff = m.avgCsDiffAt15;
            const goldDiff = m.avgGoldDiffAt15;

            return (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/champion/${m.myChampion}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <ChampionIcon name={m.myChampion} size={32} />
                    <span className="font-medium">{m.myChampion}</span>
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <Link
                    href={`/matchup/${encodeURIComponent(m.myChampion)}/${encodeURIComponent(m.oppChampion)}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <ChampionIcon name={m.oppChampion} size={32} />
                    <span className="font-medium">{m.oppChampion}</span>
                  </Link>
                </td>
                <td className="py-3 px-4 text-center">
                  <WinRateBadge
                    winRate={m.winRate}
                    total={m.total}
                    wins={m.wins}
                  />
                </td>
                <td className="py-3 px-4 text-center hidden sm:table-cell">
                  {csDiff != null ? (
                    <span
                      className={`font-mono font-bold ${
                        csDiff > 5
                          ? "stat-positive"
                          : csDiff < -5
                          ? "stat-negative"
                          : "stat-neutral"
                      }`}
                    >
                      {csDiff > 0 ? "+" : ""}
                      {csDiff.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center hidden md:table-cell">
                  {goldDiff != null ? (
                    <span
                      className={`font-mono font-bold ${
                        goldDiff > 300
                          ? "stat-positive"
                          : goldDiff < -300
                          ? "stat-negative"
                          : "stat-neutral"
                      }`}
                    >
                      {goldDiff > 0 ? "+" : ""}
                      {Math.round(goldDiff).toLocaleString()}g
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center hidden lg:table-cell">
                  <span className="font-mono">{kda}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
