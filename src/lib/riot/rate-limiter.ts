/**
 * トークンバケット方式のレートリミッタ。
 * 秒単位 (20 req/s) と2分単位 (100 req/2min) の二重バケットで制御する。
 * 429 が返った場合は呼び出し元で Retry-After ヘッダを渡してブロックする。
 */
export class RateLimiter {
  private shortTokens: number;
  private longTokens: number;
  private lastShortRefill: number;
  private lastLongRefill: number;
  private blockedUntil: number = 0;

  constructor(
    private readonly shortLimit = 20,
    private readonly shortWindowMs = 1_000,
    private readonly longLimit = 100,
    private readonly longWindowMs = 120_000
  ) {
    this.shortTokens = shortLimit;
    this.longTokens = longLimit;
    this.lastShortRefill = Date.now();
    this.lastLongRefill = Date.now();
  }

  /** トークンを1つ消費する。必要なら sleep して待機する。 */
  async acquire(): Promise<void> {
    const now = Date.now();

    // 429 によるブロック中なら待機
    if (now < this.blockedUntil) {
      await sleep(this.blockedUntil - now);
    }

    this.refillBuckets();

    while (this.shortTokens < 1 || this.longTokens < 1) {
      await sleep(100);
      this.refillBuckets();
    }

    this.shortTokens--;
    this.longTokens--;
  }

  /**
   * 429 受信時に呼ぶ。Retry-After 秒間リクエストをブロックする。
   * @param retryAfterSeconds Retry-After ヘッダの値 (秒)
   */
  blockFor(retryAfterSeconds: number): void {
    this.blockedUntil = Date.now() + retryAfterSeconds * 1_000;
  }

  private refillBuckets(): void {
    const now = Date.now();

    const shortElapsed = now - this.lastShortRefill;
    if (shortElapsed >= this.shortWindowMs) {
      const periods = Math.floor(shortElapsed / this.shortWindowMs);
      this.shortTokens = Math.min(
        this.shortLimit,
        this.shortTokens + periods * this.shortLimit
      );
      this.lastShortRefill += periods * this.shortWindowMs;
    }

    const longElapsed = now - this.lastLongRefill;
    if (longElapsed >= this.longWindowMs) {
      const periods = Math.floor(longElapsed / this.longWindowMs);
      this.longTokens = Math.min(
        this.longLimit,
        this.longTokens + periods * this.longLimit
      );
      this.lastLongRefill += periods * this.longWindowMs;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
