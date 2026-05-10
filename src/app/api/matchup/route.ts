import { NextResponse } from "next/server";

/**
 * GET /api/matchup
 * 全マッチアップの勝率サマリーを返す。
 */
export async function GET() {
  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { matchupStatsAggregator } = await import(
      "@/lib/aggregators/matchup-stats"
    );

    const [all, hard] = await Promise.all([
      matchupStatsAggregator.getAllMatchups(),
      matchupStatsAggregator.getHardMatchups(3),
    ]);

    return NextResponse.json({ matchups: all, hardMatchups: hard });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
