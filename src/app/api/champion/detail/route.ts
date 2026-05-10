import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/champion/detail?name=Jinx
 * 特定チャンピオンの試合履歴と対面別勝率を返す。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "name パラメータが必要です" },
      { status: 400 }
    );
  }

  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { performanceRepository } = await import(
      "@/lib/repositories/performance"
    );
    const { championStatsAggregator } = await import(
      "@/lib/aggregators/champion-stats"
    );

    const [matches, matchupRates] = await Promise.all([
      performanceRepository.findByChampion(name, 50),
      championStatsAggregator.getMatchupWinRates(name),
    ]);

    return NextResponse.json({ matches, matchupRates });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
