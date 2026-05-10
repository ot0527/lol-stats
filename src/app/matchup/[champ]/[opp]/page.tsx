import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { WinRateBadge } from "@/components/WinRateBadge";
import { StatCompare } from "@/components/StatCompare";
import { GoldCsChart } from "@/components/GoldCsChart";
import type { MatchupDetail } from "@/lib/aggregators/matchup-stats";

interface PageProps {
  params: Promise<{ champ: string; opp: string }>;
}

interface MatchupDetailData {
  details: MatchupDetail[];
  builds: Array<{
    matchId: string;
    timestampMs: number;
    itemId: number;
    eventType: string;
  }>;
}

async function getMatchupDetail(
  champ: string,
  opp: string
): Promise<MatchupDetailData> {
  try {
    const params = new URLSearchParams({ my: champ, opp });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/matchup/detail?${params}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { details: [], builds: [] };
    return res.json();
  } catch {
    return { details: [], builds: [] };
  }
}

export default async function MatchupDetailPage({ params }: PageProps) {
  const { champ, opp } = await params;
  const myChampion = decodeURIComponent(champ);
  const oppChampion = decodeURIComponent(opp);

  const { details } = await getMatchupDetail(myChampion, oppChampion);

  const total = details.length;
  const wins = details.filter((d) => d.win === 1).length;
  const winRate = total > 0 ? wins / total : 0;

  // 平均スタッツを計算
  const avg = (arr: (number | null)[]) => {
    const vals = arr.filter((v) => v != null) as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const avgStats = {
    kills: avg(details.map((d) => d.kills)),
    deaths: avg(details.map((d) => d.deaths)),
    assists: avg(details.map((d) => d.assists)),
    csTotal: avg(details.map((d) => d.csTotal)),
    goldTotal: avg(details.map((d) => d.goldTotal)),
    csAt15: avg(details.map((d) => d.csAt15)),
    goldAt15: avg(details.map((d) => d.goldAt15)),
    oppKills: avg(details.map((d) => d.oppKills)),
    oppDeaths: avg(details.map((d) => d.oppDeaths)),
    oppAssists: avg(details.map((d) => d.oppAssists)),
    oppCsTotal: avg(details.map((d) => d.oppCsTotal)),
    oppGoldTotal: avg(details.map((d) => d.oppGoldTotal)),
    oppCsAt15: avg(details.map((d) => d.oppCsAt15)),
    oppGoldAt15: avg(details.map((d) => d.oppGoldAt15)),
  };

  const winMatches = details.filter((d) => d.win === 1);
  const loseMatches = details.filter((d) => d.win === 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <Link
          href="/matchup"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          マッチアップ一覧に戻る
        </Link>

        <div className="flex items-center gap-4">
          <ChampionIcon name={myChampion} size={64} />
          <Swords className="h-6 w-6 text-muted-foreground" />
          <ChampionIcon name={oppChampion} size={64} />
          <div className="ml-2">
            <h1 className="text-xl font-bold gold-text">
              {myChampion} vs {oppChampion}
            </h1>
            <WinRateBadge winRate={winRate} total={total} wins={wins} />
          </div>
        </div>
      </div>

      {/* 平均スタッツ比較 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="lol-card p-4 space-y-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChampionIcon name={myChampion} size={20} />
              <span className="font-semibold">{myChampion}</span>
            </div>
            <div className="text-xs text-muted-foreground">平均スタッツ</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-semibold">{oppChampion}</span>
              <ChampionIcon name={oppChampion} size={20} />
            </div>
          </div>
          <StatCompare
            label="キル"
            myValue={avgStats.kills}
            oppValue={avgStats.oppKills}
            format={(v) => v.toFixed(1)}
          />
          <StatCompare
            label="デス"
            myValue={avgStats.deaths}
            oppValue={avgStats.oppDeaths}
            format={(v) => v.toFixed(1)}
            higherIsBetter={false}
          />
          <StatCompare
            label="アシスト"
            myValue={avgStats.assists}
            oppValue={avgStats.oppAssists}
            format={(v) => v.toFixed(1)}
          />
          <StatCompare
            label="CS合計"
            myValue={avgStats.csTotal}
            oppValue={avgStats.oppCsTotal}
            format={(v) => v.toFixed(0)}
          />
          <StatCompare
            label="ゴールド"
            myValue={avgStats.goldTotal}
            oppValue={avgStats.oppGoldTotal}
            format={(v) => `${Math.round(v / 1000).toFixed(1)}k`}
          />
          <StatCompare
            label="CS@15"
            myValue={avgStats.csAt15}
            oppValue={avgStats.oppCsAt15}
            format={(v) => v.toFixed(0)}
          />
          <StatCompare
            label="Gold@15"
            myValue={avgStats.goldAt15}
            oppValue={avgStats.oppGoldAt15}
            format={(v) => `${Math.round(v / 1000).toFixed(1)}k`}
          />
        </div>

        {/* CS差チャート */}
        <div className="lol-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            CS差 / Gold差 @15 推移
          </h3>
          <GoldCsChart details={details} />
        </div>
      </div>

      {/* 試合ごとの詳細 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 勝ち試合 */}
        <div className="lol-card">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <span className="win-badge">WIN</span>
            <span className="text-sm font-semibold">{winMatches.length} 試合</span>
          </div>
          <div className="divide-y divide-border/30">
            {winMatches.slice(0, 10).map((d) => (
              <MatchRow key={d.matchId} detail={d} isWin />
            ))}
          </div>
        </div>

        {/* 負け試合 */}
        <div className="lol-card">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <span className="loss-badge">LOSE</span>
            <span className="text-sm font-semibold">{loseMatches.length} 試合</span>
          </div>
          <div className="divide-y divide-border/30">
            {loseMatches.slice(0, 10).map((d) => (
              <MatchRow key={d.matchId} detail={d} isWin={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  detail,
  isWin,
}: {
  detail: MatchupDetail;
  isWin: boolean;
}) {
  const date = new Date(detail.gameCreation);
  const dMin = Math.floor(detail.gameDuration / 60);
  const dSec = detail.gameDuration % 60;
  const kda =
    detail.deaths > 0
      ? ((detail.kills + detail.assists) / detail.deaths).toFixed(2)
      : "Perfect";

  return (
    <div className="p-3 text-sm flex items-center gap-3 hover:bg-muted/20 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isWin ? "stat-positive" : "stat-negative"}`}>
            {detail.kills}/{detail.deaths}/{detail.assists}
          </span>
          <span className="text-muted-foreground text-xs">({kda})</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {detail.csTotal}CS · {dMin}:{dSec.toString().padStart(2, "0")} · P{detail.patch}
        </div>
      </div>
      <div className="text-right">
        {detail.csDiffAt15 != null && (
          <div
            className={`text-xs font-bold font-mono ${
              detail.csDiffAt15 > 0 ? "stat-positive" : "stat-negative"
            }`}
          >
            CS {detail.csDiffAt15 > 0 ? "+" : ""}{detail.csDiffAt15}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}
