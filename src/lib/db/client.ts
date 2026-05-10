import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const DB_PATH = path.join(process.cwd(), "data", "matches.db");

/**
 * SQLite データベースのシングルトンインスタンス。
 * Next.js の Hot Reload で接続が増殖しないよう global にキャッシュする。
 */
function createDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

type DbInstance = ReturnType<typeof createDb>;

const globalForDb = global as unknown as { db: DbInstance | undefined };

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
