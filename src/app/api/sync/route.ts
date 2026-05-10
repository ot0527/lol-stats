import { NextRequest, NextResponse } from "next/server";
import { createSyncService } from "@/lib/services/sync";

/**
 * POST /api/sync
 * 最新の試合データを Riot API から取得して DB に同期する。
 */
export async function POST(req: NextRequest) {
  const puuid = process.env.MY_PUUID;
  if (!puuid) {
    return NextResponse.json(
      { error: "MY_PUUID が設定されていません" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 20), 100);

  try {
    // DB マイグレーションを確認
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const syncService = createSyncService();
    const result = await syncService.syncRecentMatches(puuid, count);

    return NextResponse.json({
      success: true,
      added: result.added,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET /api/sync - 最終同期情報を返す */
export async function GET() {
  try {
    const { ensureDbReady } = await import("@/lib/db/ensure");
    await ensureDbReady();

    const { syncLogRepository } = await import("@/lib/repositories/sync-log");
    const latest = syncLogRepository.findLatest();
    return NextResponse.json({ latest });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
