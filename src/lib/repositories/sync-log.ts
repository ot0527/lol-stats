import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { syncLog } from "../db/schema";

/**
 * 同期履歴のリポジトリ。
 * 最終同期時刻の表示と失敗時のデバッグに使用する。
 */
export const syncLogRepository = {
  /** 同期開始を記録して ID を返す */
  start(): number {
    const result = db
      .insert(syncLog)
      .values({
        startedAt: Date.now(),
        status: "running",
      })
      .returning({ id: syncLog.id })
      .get();
    return result!.id;
  },

  /** 同期成功を記録する */
  complete(id: number, matchesAdded: number, matchesSkipped: number): void {
    db.update(syncLog)
      .set({
        finishedAt: Date.now(),
        status: "success",
        matchesAdded,
        matchesSkipped,
      })
      .where(eq(syncLog.id, id))
      .run();
  },

  /** 同期失敗を記録する */
  fail(id: number, error: string): void {
    db.update(syncLog)
      .set({
        finishedAt: Date.now(),
        status: "failed",
        errorMessage: error,
      })
      .where(eq(syncLog.id, id))
      .run();
  },

  /** 最新の同期履歴を取得する */
  findLatest() {
    return db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.startedAt))
      .limit(1)
      .get();
  },

  /** 最近の同期履歴一覧 */
  findRecent(limit = 10) {
    return db
      .select()
      .from(syncLog)
      .orderBy(desc(syncLog.startedAt))
      .limit(limit)
      .all();
  },
};
