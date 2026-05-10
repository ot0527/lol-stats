import { Swords, Trophy, Clock, TrendingUp } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { WinRateChart } from "@/components/WinRateChart";

interface DashboardData {
  summary: { total: number; wins: number };
  recent: Array<{
    matchId: string;
    gameCreation: number;
    gameDuration: number;
    patch: string;
    win: number;
    championName: string | null;
    role: string | null;
    kills: number | null;
    deaths: number | null;
    assists: number | null;
    csTotal: number | null;
    oppChampionName: string | null;
  }>;
  latestSync: {
    startedAt: number;
    finishedAt: number | null;
    matchesAdded: number;
    status: string;
  } | null;
  patchStats: Array<{ patch: string; total: number; wins: number }>;
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/dashboard`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const winRate =
    data && data.summary.total > 0
      ? Math.round((data.summary.wins / data.summary.total) * 100)
      : null;

  const lastSyncText = data?.latestSync?.finishedAt
    ? new Date(data.latestSync.finishedAt).toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未同期";

  return (
    <div className="space-y-6">
      {/* ページタイトル */}
      <div className="flex items-center gap-3">
        <Swords className="h-6 w-6 gold-text" />
        <h1 className="text-2xl font-bold gold-text tracking-wide">
          ダッシュボード
        </h1>
        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
          <Clock className="h-3 w-3" />
          最終同期: {lastSyncText}
        </span>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Trophy className="h-5 w-5 gold-text" />}
          label="総試合数"
          value={data?.summary.total.toLocaleString() ?? "-"}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="勝率"
          value={winRate != null ? `${winRate}%` : "-"}
          valueClass={
            winRate != null
              ? winRate >= 50
                ? "stat-positive"
                : "stat-negative"
              : ""
          }
        />
        <SummaryCard
          label="勝利"
          value={data?.summary.wins.toLocaleString() ?? "-"}
          valueClass="stat-positive"
        />
        <SummaryCard
          label="敗北"
          value={
            data
              ? (data.summary.total - data.summary.wins).toLocaleString()
              : "-"
          }
          valueClass="stat-negative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 最近の試合 */}
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            最近の試合
          </h2>
          {data?.recent && data.recent.length > 0 ? (
            <div className="space-y-1.5">
              {data.recent.map((match) => (
                <MatchCard key={match.matchId} {...match} />
              ))}
            </div>
          ) : (
            <div className="lol-card p-8 text-center text-muted-foreground">
              <p>まだデータがありません。</p>
              <p className="text-sm mt-1">
                右上の「データ更新」ボタンで試合を同期してください。
              </p>
            </div>
          )}
        </div>

        {/* パッチ別勝率グラフ */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            パッチ別勝率
          </h2>
          <div className="lol-card p-4">
            {data?.patchStats && data.patchStats.length > 0 ? (
              <WinRateChart data={data.patchStats} />
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                データなし
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  valueClass = "",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="lol-card p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold ${valueClass || "gold-text"}`}>
        {value}
      </div>
    </div>
  );
}
