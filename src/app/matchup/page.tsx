import { Swords, AlertTriangle } from "lucide-react";
import { MatchupTable } from "@/components/MatchupTable";
import { ChampionIcon } from "@/components/ChampionIcon";
import { WinRateBadge } from "@/components/WinRateBadge";
import Link from "next/link";
import type { MatchupSummary } from "@/lib/aggregators/matchup-stats";

interface MatchupData {
  matchups: MatchupSummary[];
  hardMatchups: MatchupSummary[];
}

async function getMatchupData(): Promise<MatchupData> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/matchup`,
      { cache: "no-store" }
    );
    if (!res.ok) return { matchups: [], hardMatchups: [] };
    return res.json();
  } catch {
    return { matchups: [], hardMatchups: [] };
  }
}

export default async function MatchupPage() {
  const { matchups, hardMatchups } = await getMatchupData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Swords className="h-6 w-6 gold-text" />
        <h1 className="text-2xl font-bold gold-text tracking-wide">
          マッチアップ分析
        </h1>
        <span className="text-sm text-muted-foreground">
          ({matchups.length} マッチアップ)
        </span>
      </div>

      {/* 苦手対面ランキング */}
      {hardMatchups.length > 0 && (
        <div className="lol-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 stat-negative" />
            苦手対面 TOP {hardMatchups.length}
            <span className="text-xs font-normal">(3試合以上)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {hardMatchups.map((m, i) => (
              <Link
                key={i}
                href={`/matchup/${encodeURIComponent(m.myChampion)}/${encodeURIComponent(m.oppChampion)}`}
                className="flex flex-col items-center gap-2 p-3 rounded-md bg-[oklch(0.18_0.05_20/0.2)] border border-[oklch(0.45_0.18_20/0.3)] hover:border-[oklch(0.45_0.18_20/0.6)] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <ChampionIcon name={m.myChampion} size={28} />
                  <span className="text-xs text-muted-foreground">vs</span>
                  <ChampionIcon name={m.oppChampion} size={28} />
                </div>
                <WinRateBadge
                  winRate={m.winRate}
                  total={m.total}
                  wins={m.wins}
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 全マッチアップテーブル */}
      <div className="lol-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">全マッチアップ</h2>
        </div>
        <MatchupTable matchups={matchups} />
      </div>
    </div>
  );
}
