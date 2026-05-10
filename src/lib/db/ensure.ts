import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "matches.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

let initialized = false;

/**
 * DB が存在しない場合にマイグレーションを実行する。
 * Next.js の API Route 初回呼び出し時に自動で DB をセットアップする。
 */
export async function ensureDbReady(): Promise<void> {
  if (initialized) return;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });

  sqlite.close();
  initialized = true;
}
