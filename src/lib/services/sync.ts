import { NotFoundError, RiotApiClient } from "../riot/client";
import { matchRepository } from "../repositories/matches";
import { rawDataRepository } from "../repositories/raw-data";
import { syncLogRepository } from "../repositories/sync-log";
import { transformMatch } from "../transformers/match";

export interface SyncResult {
  added: number;
  skipped: number;
  errors: string[];
}

export interface SyncProgress {
  current: number;
  total: number;
}

/**
 * Riot API から最新の試合データを取得してDBに保存する同期サービス。
 * 冪等設計: 既存の試合はスキップし、新規分のみ追加する。
 */
export class SyncService {
  constructor(private readonly client: RiotApiClient) {}

  /**
   * 最新の試合を同期する。
   * @param puuid 自分の PUUID
   * @param count 取得する試合数 (最大 100)
   * @param onProgress 進捗コールバック
   */
  async syncRecentMatches(
    puuid: string,
    count = 20,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncResult> {
    const logId = syncLogRepository.start();
    const errors: string[] = [];

    try {
      // 試合 ID 一覧を取得
      const matchIds = await this.client.getMatchIdsByPuuid(puuid, count);

      // 既存の試合 ID を除外
      const existing = matchRepository.findExistingIds(matchIds);
      const newIds = matchIds.filter((id) => !existing.has(id));

      let added = 0;
      const skipped = matchIds.length - newIds.length;

      for (let i = 0; i < newIds.length; i++) {
        const matchId = newIds[i];
        onProgress?.({ current: i + 1, total: newIds.length });

        try {
          const [matchData, timelineData] = await Promise.all([
            this.client.getMatch(matchId),
            this.client.getMatchTimeline(matchId),
          ]);

          // 生データを保存
          const now = Date.now();
          rawDataRepository.insert({
            matchId,
            dataType: "match",
            payload: JSON.stringify(matchData),
            fetchedAt: now,
          });
          rawDataRepository.insert({
            matchId,
            dataType: "timeline",
            payload: JSON.stringify(timelineData),
            fetchedAt: now,
          });

          // 変換して保存
          const result = transformMatch(matchData, timelineData, puuid);
          matchRepository.insertMatchTransaction({
            match: result.match,
            myPerf: result.myPerformance,
            matchupRow: result.matchup,
            buildEvents: result.buildEvents,
            skillOrders: result.skillOrder,
          });

          added++;
        } catch (err) {
          if (err instanceof NotFoundError) {
            // 試合が存在しない場合はスキップ
            errors.push(`${matchId}: not found`);
          } else {
            const message =
              err instanceof Error ? err.message : String(err);
            errors.push(`${matchId}: ${message}`);
          }
        }
      }

      syncLogRepository.complete(logId, added, skipped);
      return { added, skipped, errors };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      syncLogRepository.fail(logId, message);
      throw err;
    }
  }
}

/**
 * 環境変数から RiotApiClient を生成する。
 * サーバーサイドのみで使用する。
 */
export function createSyncService(): SyncService {
  const apiKey = process.env.RIOT_API_KEY;
  const platform = process.env.PLATFORM ?? "jp1";

  if (!apiKey) {
    throw new Error("RIOT_API_KEY が設定されていません");
  }

  const client = new RiotApiClient(apiKey, platform);
  return new SyncService(client);
}
