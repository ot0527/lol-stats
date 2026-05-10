import Link from "next/link";
import { ChampionIcon } from "./ChampionIcon";

interface MatchCardProps {
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
}

/**
 * 試合1件を表示するカードコンポーネント。
 */
export function MatchCard({
  gameCreation,
  gameDuration,
  patch,
  win,
  championName,
  kills,
  deaths,
  assists,
  csTotal,
  oppChampionName,
}: MatchCardProps) {
  const isWin = win === 1;
  const date = new Date(gameCreation);
  const durationMin = Math.floor(gameDuration / 60);
  const durationSec = gameDuration % 60;

  const kda =
    deaths && deaths > 0
      ? (((kills ?? 0) + (assists ?? 0)) / deaths).toFixed(2)
      : "Perfect";

  return (
    <div
      className={`lol-card flex items-center gap-4 p-3 border-l-4 ${
        isWin
          ? "border-l-[oklch(0.55_0.18_150)] bg-[oklch(0.13_0.03_150/0.3)]"
          : "border-l-[oklch(0.52_0.22_20)] bg-[oklch(0.13_0.03_20/0.3)]"
      }`}
    >
      {/* 勝敗 */}
      <div className="w-14 text-center shrink-0">
        {isWin ? (
          <span className="win-badge">WIN</span>
        ) : (
          <span className="loss-badge">LOSE</span>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          {durationMin}:{durationSec.toString().padStart(2, "0")}
        </div>
      </div>

      {/* 自分のチャンピオン */}
      <div className="flex items-center gap-2 min-w-[140px]">
        {championName && (
          <ChampionIcon name={championName} size={44} />
        )}
        <div>
          <div className="font-bold text-sm gold-text">
            {championName ?? "-"}
          </div>
          <div className="text-xs text-muted-foreground">
            {kills}/{deaths}/{assists}
            <span
              className={`ml-2 font-semibold ${
                typeof kda === "string"
                  ? "stat-positive"
                  : parseFloat(kda) >= 3
                  ? "stat-positive"
                  : parseFloat(kda) >= 2
                  ? "stat-neutral"
                  : "stat-negative"
              }`}
            >
              {kda} KDA
            </span>
          </div>
        </div>
      </div>

      {/* CS */}
      <div className="hidden sm:block text-center min-w-[60px]">
        <div className="text-sm font-bold">{csTotal ?? "-"}</div>
        <div className="text-xs text-muted-foreground">CS</div>
      </div>

      {/* 対面 */}
      {oppChampionName && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">vs</span>
          <Link
            href={`/matchup?my=${championName}&opp=${oppChampionName}`}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ChampionIcon name={oppChampionName} size={32} />
            <span className="text-xs hidden md:block">{oppChampionName}</span>
          </Link>
        </div>
      )}

      {/* 日時 */}
      <div className="hidden lg:block text-xs text-muted-foreground text-right min-w-[80px]">
        <div>{date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</div>
        <div>P{patch}</div>
      </div>
    </div>
  );
}
