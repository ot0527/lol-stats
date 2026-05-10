import Link from "next/link";
import { Shield } from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { WinRateBadge } from "@/components/WinRateBadge";
import type { ChampionStats } from "@/lib/aggregators/champion-stats";

async function getChampionStats(): Promise<{ champions: ChampionStats[] }> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/champion`,
      { cache: "no-store" }
    );
    if (!res.ok) return { champions: [] };
    return res.json();
  } catch {
    return { champions: [] };
  }
}

export default async function ChampionListPage() {
  const { champions } = await getChampionStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 gold-text" />
        <h1 className="text-2xl font-bold gold-text tracking-wide">
          チャンピオン別統計
        </h1>
        <span className="text-sm text-muted-foreground">
          ({champions.length} チャンピオン)
        </span>
      </div>

      {champions.length === 0 ? (
        <div className="lol-card p-12 text-center text-muted-foreground">
          データがありません。まず「データ更新」を実行してください。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {champions.map((champ) => (
            <ChampionCard key={champ.championName} stats={champ} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChampionCard({ stats }: { stats: ChampionStats }) {
  return (
    <Link href={`/champion/${encodeURIComponent(stats.championName)}`}>
      <div className="lol-card p-4 hover:border-[oklch(0.5_0.12_85/0.6)] transition-all cursor-pointer group">
        <div className="flex items-center gap-3 mb-3">
          <ChampionIcon
            name={stats.championName}
            size={48}
            className="group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-bold gold-text">{stats.championName}</div>
            <div className="text-xs text-muted-foreground">
              {stats.total} 試合
            </div>
          </div>
          <div className="ml-auto">
            <WinRateBadge
              winRate={stats.winRate}
              total={stats.total}
              wins={stats.wins}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <StatBox label="KDA" value={stats.avgKda.toFixed(2)} />
          <StatBox
            label="平均CS"
            value={Math.round(stats.avgCs).toString()}
          />
          <StatBox
            label="K/D/A"
            value={`${stats.avgKills.toFixed(1)}/${stats.avgDeaths.toFixed(1)}/${stats.avgAssists.toFixed(1)}`}
            small
          />
        </div>
      </div>
    </Link>
  );
}

function StatBox({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-bold gold-text ${small ? "text-xs" : "text-sm"}`}>
        {value}
      </div>
    </div>
  );
}
