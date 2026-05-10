interface WinRateBadgeProps {
  winRate: number;
  total: number;
  wins: number;
}

/**
 * 勝率バッジコンポーネント。
 * 50%以上は青系、50%未満は赤系で色分けする。
 */
export function WinRateBadge({ winRate, total, wins }: WinRateBadgeProps) {
  const pct = Math.round(winRate * 100);
  const isPositive = pct >= 50;

  return (
    <div className="flex flex-col items-center">
      <span
        className={`text-lg font-bold ${
          isPositive ? "stat-positive" : "stat-negative"
        }`}
      >
        {pct}%
      </span>
      <span className="text-xs text-muted-foreground">
        {wins}W {total - wins}L
      </span>
    </div>
  );
}
