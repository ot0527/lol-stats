/** プラットフォーム → リージョンのマッピング (Match-V5 は Regional エンドポイントを使う) */
const PLATFORM_TO_REGION: Record<string, string> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  eun1: "europe",
  euw1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ph2: "sea",
  sg2: "sea",
  th2: "sea",
  tw2: "sea",
  vn2: "sea",
};

/**
 * プラットフォームコードからリージョンを解決する。
 * Match-V5 / Account-V1 は Regional エンドポイントを使用する。
 */
export function resolveRegion(platform: string): string {
  const region = PLATFORM_TO_REGION[platform.toLowerCase()];
  if (!region) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return region;
}

/**
 * リージョンのベースURLを返す。
 * @example "asia.api.riotgames.com"
 */
export function getRegionalBaseUrl(region: string): string {
  return `https://${region}.api.riotgames.com`;
}

/**
 * プラットフォームのベースURLを返す。
 * @example "https://jp1.api.riotgames.com"
 */
export function getPlatformBaseUrl(platform: string): string {
  return `https://${platform.toLowerCase()}.api.riotgames.com`;
}
