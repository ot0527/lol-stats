import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/matchup/detail?my=Jinx&opp=Caitlyn
 * 特定マッチアップの詳細試合一覧とビルドを返す。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const myChampion = searchParams.get("my");
  const oppChampion = searchParams.get("opp");

  if (!myChampion || !oppChampion) {
    return NextResponse.json(
      { error: "my と opp パラメータが必要です" },
      { status: 400 }
    );
  }

  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { matchupStatsAggregator } = await import(
      "@/lib/aggregators/matchup-stats"
    );

    const details = matchupStatsAggregator.getMatchupDetails(
      myChampion,
      oppChampion
    );

    const matchIds = details.map((d) => d.matchId);
    const builds =
      matchIds.length > 0
        ? await matchupStatsAggregator.getMatchupBuilds(matchIds)
        : [];

    return NextResponse.json({ details, builds });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
