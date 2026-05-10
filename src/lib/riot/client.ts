import { RateLimiter } from "./rate-limiter";
import { getRegionalBaseUrl, resolveRegion } from "./routing";
import {
  MatchData,
  MatchDataSchema,
  RiotAccount,
  RiotAccountSchema,
  TimelineData,
  TimelineDataSchema,
} from "./types";

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [1_000, 2_000, 4_000];

/**
 * Riot API の薄いHTTPラッパー。
 * レートリミッタと指数バックオフリトライを内包する。
 */
export class RiotApiClient {
  private readonly rateLimiter = new RateLimiter();
  private readonly apiKey: string;
  private readonly region: string;

  constructor(apiKey: string, platform: string) {
    this.apiKey = apiKey;
    this.region = resolveRegion(platform);
  }

  /**
   * Riot ID (gameName#tagLine) から PUUID を取得する。
   * 初回セットアップ時のみ使用する。
   */
  async getAccountByRiotId(
    gameName: string,
    tagLine: string
  ): Promise<RiotAccount> {
    const data = await this.fetch(
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
    return RiotAccountSchema.parse(data);
  }

  /**
   * PUUID に紐づくソロランク試合IDリストを取得する。
   * @param count 最大取得件数 (デフォルト: 20, 最大: 100)
   */
  async getMatchIdsByPuuid(
    puuid: string,
    count = 20,
    start = 0
  ): Promise<string[]> {
    const params = new URLSearchParams({
      queue: "420",
      type: "ranked",
      count: String(count),
      start: String(start),
    });
    const data = await this.fetch(
      `/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`
    );
    return data as string[];
  }

  /**
   * 試合詳細データを取得する。
   */
  async getMatch(matchId: string): Promise<MatchData> {
    const data = await this.fetch(`/lol/match/v5/matches/${matchId}`);
    return MatchDataSchema.parse(data);
  }

  /**
   * 試合タイムラインを取得する。
   * @15分スタッツとビルド履歴の抽出に使用する。
   */
  async getMatchTimeline(matchId: string): Promise<TimelineData> {
    const data = await this.fetch(
      `/lol/match/v5/matches/${matchId}/timeline`
    );
    return TimelineDataSchema.parse(data);
  }

  private async fetch(path: string, attempt = 0): Promise<unknown> {
    await this.rateLimiter.acquire();

    const url = `${getRegionalBaseUrl(this.region)}${path}`;
    const res = await globalThis.fetch(url, {
      headers: { "X-Riot-Token": this.apiKey },
    });

    if (res.ok) {
      return res.json();
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
      this.rateLimiter.blockFor(retryAfter);
      // 429 は即リトライ(バックオフ不要、リミッタが制御)
      return this.fetch(path, attempt);
    }

    if (res.status === 404) {
      throw new NotFoundError(`Not found: ${path}`);
    }

    if (res.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(RETRY_BACKOFF_MS[attempt] ?? 4_000);
      return this.fetch(path, attempt + 1);
    }

    throw new RiotApiError(res.status, `Riot API error ${res.status}: ${path}`);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RiotApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
