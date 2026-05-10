export const SOLO_QUEUE_ID = 420;

/** @15分 = 900,000ms */
export const FIFTEEN_MINUTES_MS = 900_000;

/** teamPosition → role 正規化マップ */
export const POSITION_TO_ROLE: Record<string, string> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
  UTILITY: "UTILITY",
  SUPPORT: "UTILITY",
  "": "MIDDLE", // フォールバック
};

/** Data Dragon のベースURL */
export const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";
