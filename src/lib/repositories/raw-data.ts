import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { rawData, type RawDataRow } from "../db/schema";

/**
 * 生レスポンスデータのリポジトリ。
 * スキーマ変更時の再構築のために Riot API レスポンスを JSON のまま保存する。
 */
export const rawDataRepository = {
  /**
   * 生データを保存する (既存の場合は何もしない)。
   */
  insert(row: RawDataRow): void {
    db.insert(rawData)
      .values(row)
      .onConflictDoNothing()
      .run();
  },

  /**
   * 指定試合の生データを取得する。
   */
  findByMatchId(matchId: string) {
    return db
      .select()
      .from(rawData)
      .where(eq(rawData.matchId, matchId))
      .all();
  },

  /** 全ての raw_data の match_id 一覧 (重複なし) */
  findAllMatchIds(): string[] {
    const rows = db
      .selectDistinct({ matchId: rawData.matchId })
      .from(rawData)
      .all();
    return rows.map((r) => r.matchId);
  },
};
