import { NextResponse } from "next/server";

/**
 * GET /api/dashboard
 * ダッシュボード用の集計データを返す。
 */
export async function GET() {
  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { matchRepository } = await import("@/lib/repositories/matches");
    const { syncLogRepository } = await import("@/lib/repositories/sync-log");

    const [summary, recent, latestSync, patchStats] = await Promise.all([
      matchRepository.getSummary(),
      matchRepository.findRecent(20),
      syncLogRepository.findLatest(),
      matchRepository.getWinRateByPatch(),
    ]);

    return NextResponse.json({
      summary,
      recent,
      latestSync,
      patchStats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
