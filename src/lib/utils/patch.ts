/**
 * Riot の gameVersion 文字列からパッチ番号を抽出する。
 * @example extractPatch("14.21.123.4567") → "14.21"
 */
export function extractPatch(gameVersion: string): string {
  const parts = gameVersion.split(".");
  if (parts.length < 2) return gameVersion;
  return `${parts[0]}.${parts[1]}`;
}
