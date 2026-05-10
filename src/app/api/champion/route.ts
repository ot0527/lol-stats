import { NextResponse } from "next/server";

/**
 * GET /api/champion
 * チャンピオン別の統計一覧を返す。
 */
export async function GET() {
  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { championStatsAggregator } = await import(
      "@/lib/aggregators/champion-stats"
    );

    const stats = championStatsAggregator.getAllChampionStats();
    return NextResponse.json({ champions: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
