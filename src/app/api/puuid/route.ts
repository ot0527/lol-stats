import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/puuid?gameName=xxx&tagLine=yyy
 * Riot ID から PUUID を取得する (初回セットアップ用)。
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "gameName と tagLine パラメータが必要です" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RIOT_API_KEY;
  const platform = process.env.PLATFORM ?? "jp1";

  if (!apiKey) {
    return NextResponse.json(
      { error: "RIOT_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const { RiotApiClient } = await import("@/lib/riot/client");
    const client = new RiotApiClient(apiKey, platform);
    const account = await client.getAccountByRiotId(gameName, tagLine);

    return NextResponse.json({
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      envLine: `MY_PUUID=${account.puuid}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
