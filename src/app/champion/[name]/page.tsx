import Link from "next/link";
import { ArrowLeft, Shield, Swords } from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { WinRateBadge } from "@/components/WinRateBadge";

interface PageProps {
  params: Promise<{ name: string }>;
}

interface ChampionDetailData {
  matches: Array<{
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
    damageToChampions: number;
    csAt15: number | null;
    goldAt15: number | null;
    oppChampionName: string | null;
    csDiffAt15: number | null;
    goldDiffAt15: number | null;
  }>;
  matchupRates: Array<{
    oppChampionName: string;
    total: number;
    wins: number;
    winRate: number;
    avgCsDiff: number | null;
    avgGoldDiff: number | null;
  }>;
}

async function getChampionDetail(name: string): Promise<ChampionDetailData> {
  try {
    const params = new URLSearchParams({ name });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/champion/detail?${params}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { matches: [], matchupRates: [] };
    return res.json();
  } catch {
    return { matches: [], matchupRates: [] };
  }
}

export default async function ChampionDetailPage({ params }: PageProps) {
  const { name } = await params;
  const championName = decodeURIComponent(name);
  const { matches, matchupRates } = await getChampionDetail(championName);

  const total = matches.length;
  const wins = matches.filter((m) => m.win === 1).length;
  const winRate = total > 0 ? wins / total : 0;

  const avgKills =
    total > 0 ? matches.reduce((s, m) => s + m.kills, 0) / total : 0;
  const avgDeaths =
    total > 0 ? matches.reduce((s, m) => s + m.deaths, 0) / total : 0;
  const avgAssists =
    total > 0 ? matches.reduce((s, m) => s + m.assists, 0) / total : 0;
  const avgCs =
    total > 0 ? matches.reduce((s, m) => s + m.csTotal, 0) / total : 0;
  const avgKda =
    avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/champion"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          チャンピオン一覧に戻る
        </Link>

        <div className="flex items-center gap-4">
          <ChampionIcon name={championName} size={72} />
          <div>
            <h1 className="text-2xl font-bold gold-text">{championName}</h1>
            <WinRateBadge winRate={winRate} total={total} wins={wins} />
          </div>
          <div className="ml-8 grid grid-cols-3 gap-4 hidden sm:grid">
            <QuickStat label="KDA" value={avgKda.toFixed(2)} />
            <QuickStat label="平均K/D/A" value={`${avgKills.toFixed(1)}/${avgDeaths.toFixed(1)}/${avgAssists.toFixed(1)}`} small />
            <QuickStat label="平均CS" value={avgCs.toFixed(0)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 試合履歴 */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            試合履歴
          </div>
          <div className="lol-card divide-y divide-border/30">
            {matches.map((m) => {
              const isWin = m.win === 1;
              const kda =
                m.deaths > 0
                  ? ((m.kills + m.assists) / m.deaths).toFixed(2)
                  : "Perfect";
              const dMin = Math.floor(m.gameDuration / 60);
              const dSec = m.gameDuration % 60;
              const date = new Date(m.gameCreation);

              return (
                <div
                  key={m.matchId}
                  className={`p-3 flex items-center gap-3 text-sm border-l-4 ${
                    isWin
                      ? "border-l-[oklch(0.55_0.18_150)]"
                      : "border-l-[oklch(0.52_0.22_20)]"
                  } hover:bg-muted/20 transition-colors`}
                >
                  <div className="w-12 shrink-0">
                    {isWin ? (
                      <span className="win-badge">WIN</span>
                    ) : (
                      <span className="loss-badge">LOSE</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isWin ? "stat-positive" : "stat-negative"}`}>
                        {m.kills}/{m.deaths}/{m.assists}
                      </span>
                      <span className="text-muted-foreground text-xs">({kda} KDA)</span>
                      <span className="text-xs text-muted-foreground">{m.csTotal}CS</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dMin}:{dSec.toString().padStart(2, "0")} · P{m.patch}
                    </div>
                  </div>
                  {m.oppChampionName && (
                    <Link
                      href={`/matchup/${encodeURIComponent(championName)}/${encodeURIComponent(m.oppChampionName)}`}
                      className="flex items-center gap-1.5 hover:opacity-80 shrink-0"
                    >
                      <span className="text-xs text-muted-foreground hidden sm:block">vs</span>
                      <ChampionIcon name={m.oppChampionName} size={28} />
                    </Link>
                  )}
                  <div className="text-xs text-muted-foreground text-right shrink-0 hidden md:block">
                    {date.toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 対面別勝率 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <Swords className="h-4 w-4" />
            対面別勝率
          </div>
          <div className="lol-card divide-y divide-border/30">
            {matchupRates.map((r) => (
              <Link
                key={r.oppChampionName}
                href={`/matchup/${encodeURIComponent(championName)}/${encodeURIComponent(r.oppChampionName)}`}
                className="flex items-center gap-2 p-3 hover:bg-muted/20 transition-colors"
              >
                <ChampionIcon name={r.oppChampionName} size={32} />
                <span className="text-sm flex-1">{r.oppChampionName}</span>
                <WinRateBadge
                  winRate={r.winRate}
                  total={r.total}
                  wins={r.wins}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="lol-card p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-bold gold-text ${small ? "text-xs" : "text-base"}`}>
        {value}
      </div>
    </div>
  );
}
