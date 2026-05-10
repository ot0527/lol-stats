"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface WinRateChartProps {
  data: Array<{
    patch: string;
    total: number;
    wins: number;
  }>;
}

/**
 * パッチ別勝率の棒グラフ。
 * 50%以上はLoLゴールド、50%未満は赤系で表示する。
 */
export function WinRateChart({ data }: WinRateChartProps) {
  const chartData = data
    .slice(0, 10)
    .reverse()
    .map((d) => ({
      patch: `P${d.patch}`,
      winRate: d.total > 0 ? Math.round((d.wins / d.total) * 100) : 0,
      total: d.total,
    }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.04 240)" vertical={false} />
        <XAxis
          dataKey="patch"
          tick={{ fill: "oklch(0.6 0.04 240)", fontSize: 11 }}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "oklch(0.6 0.04 240)", fontSize: 11 }}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.15 0.025 240)",
            border: "1px solid oklch(0.35 0.08 85 / 0.4)",
            borderRadius: "6px",
            color: "oklch(0.92 0.01 240)",
          }}
          formatter={(value, _name, props) => [
            `${typeof value === "number" ? value : 0}% (${(props.payload as { total?: number }).total ?? 0}試合)`,
            "勝率",
          ] as [string, string]}
        />
        <ReferenceLine y={50} stroke="oklch(0.6 0.04 240)" strokeDasharray="4 4" />
        <Bar dataKey="winRate" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.winRate >= 50
                  ? "oklch(0.78 0.15 85)"
                  : "oklch(0.52 0.22 20)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
