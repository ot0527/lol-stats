"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { MatchupDetail } from "@/lib/aggregators/matchup-stats";

interface GoldCsChartProps {
  details: MatchupDetail[];
}

/**
 * マッチアップ詳細のCS差/Gold差チャート。
 * 試合ごとのCS差(縦軸)を時系列(横軸)で表示する。
 */
export function GoldCsChart({ details }: GoldCsChartProps) {
  const data = details
    .filter((d) => d.csDiffAt15 != null)
    .slice(0, 20)
    .reverse()
    .map((d, i) => ({
      game: i + 1,
      cs差: d.csDiffAt15 ?? 0,
      gold差: Math.round((d.goldDiffAt15 ?? 0) / 100),
      result: d.win === 1 ? "WIN" : "LOSE",
    }));

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        @15分データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 240)" />
        <XAxis
          dataKey="game"
          tick={{ fill: "oklch(0.6 0.04 240)", fontSize: 11 }}
          label={{
            value: "試合 (古→新)",
            position: "insideBottom",
            fill: "oklch(0.6 0.04 240)",
            fontSize: 11,
          }}
        />
        <YAxis
          tick={{ fill: "oklch(0.6 0.04 240)", fontSize: 11 }}
          tickFormatter={(v) => (v > 0 ? `+${v}` : String(v))}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.15 0.025 240)",
            border: "1px solid oklch(0.35 0.08 85 / 0.4)",
            borderRadius: "6px",
            color: "oklch(0.92 0.01 240)",
          }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : 0;
            const n = typeof name === "string" ? name : "";
            return [n === "cs差" ? v : `${v * 100}g`, n] as [string | number, string];
          }}
        />
        <Legend
          wrapperStyle={{ color: "oklch(0.7 0.04 240)", fontSize: 12 }}
        />
        <ReferenceLine y={0} stroke="oklch(0.5 0.04 240)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="cs差"
          stroke="oklch(0.78 0.15 85)"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            const color =
              payload.result === "WIN"
                ? "oklch(0.55 0.18 150)"
                : "oklch(0.52 0.22 20)";
            return (
              <circle
                key={`cs-dot-${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={4}
                fill={color}
                stroke="none"
              />
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="gold差"
          stroke="oklch(0.55 0.18 240)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
