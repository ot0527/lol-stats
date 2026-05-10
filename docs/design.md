# LoL Personal Stats - 設計書

> 自分専用 League of Legends 戦績分析ツール  
> マッチアップ分析を主軸に、自分のプレイデータを蓄積・可視化する個人用Webアプリ

---

## 1. プロジェクト概要

### 1.1 目的

OP.GG等の汎用統計サイトでは得られない、**自分自身のプレイデータに特化した分析環境**を構築する。
特に「対面相手別の自分のパフォーマンス」を主軸に、自己改善のためのインサイトを得る。

### 1.2 スコープ

- **対象ユーザー**: 開発者本人のみ(自分専用ツール)
- **対象ゲームモード**: ソロランク (queue_id = 420) のみ
- **動作環境**: ローカル PC (`localhost:3000`)
- **ホスティング**: なし (将来的な追加は想定するが、初期スコープ外)

### 1.3 非目標 (やらないこと)

| 項目 | 理由 |
|------|------|
| 他プレイヤーの戦績検索 | 自分専用ツールのため不要 |
| チャンピオン Tier 表 | OP.GG 等の既存ツールで十分、車輪の再発明 |
| リアルタイム試合中オーバーレイ | Electron 化が必要、別プロジェクトレベルの工数 |
| AI コーチング | データ規模的に精度が出ず、ハルシネーションリスク |
| マルチユーザー対応 | 認証・認可が必要になり複雑度が大幅増 |

---

## 2. 設計原則

### 2.1 アーキテクチャ原則

1. **生データを失わない**  
   Riot API のレスポンスは JSON 文字列として `raw_data` テーブルに保存する。これにより、後から新しい分析軸が必要になった際に、API を再度叩かずローカルで再構築できる。Riot API はレート制限があり、過去試合の再取得には時間がかかるため。

2. **レイヤー分離**  
   API クライアント / 永続化 / 集計 / UI を明確に分離する。各層は次の層のインターフェースのみに依存し、実装には依存しない。

3. **集計ロジックは SQL に寄せる**  
   SQLite は集計に強い。アプリ側で JS のループを書くより、ビューや集計クエリで処理する方が保守性が高い。

4. **冪等な同期**  
   何度実行しても同じ結果になる(`INSERT OR IGNORE` をベースに)。差分のみ取得し、既存データは触らない。

5. **段階的拡張を前提とする**  
   ルーン、味方分析、メモ機能などは後付けで追加できるよう、テーブル設計を独立させる。

### 2.2 技術選定原則

- **依存ライブラリは最小限**: 個人ツールゆえ、メンテナンスコストを最小化する
- **型安全性を重視**: TypeScript + Drizzle で API レスポンスから DB まで一気通貫で型を通す
- **「動くこと」を最優先**: 美しい抽象化より、まず動くものを作って改善する

---

## 3. 技術スタック

| 層 | 技術 | 選定理由 |
|---|---|---|
| ランタイム | Node.js 20+ | LTS、ES Modules 対応 |
| フレームワーク | Next.js 15 (App Router) | API Routes と UI を同一プロジェクトで完結 |
| 言語 | TypeScript 5+ | 型安全、保守性 |
| DB | SQLite (better-sqlite3) | ファイルベース、同期 API、爆速、依存最小 |
| ORM/Query Builder | Drizzle ORM | 軽量、TS ネイティブ、生 SQL も書ける、マイグレーション機能 |
| Riot API クライアント | 自作薄ラッパー | 依存最小化、レート制限の挙動を完全に把握したいため |
| UI | Tailwind CSS + shadcn/ui | スピード重視、カスタマイズ容易 |
| グラフ | Recharts | 宣言的、React 親和性 |
| バリデーション | Zod | API レスポンスの実行時検証 |
| テスト | Vitest | Vite ベースで高速、Jest 互換 API |

### 3.1 採用しない技術と理由

- **Prisma**: Drizzle より重い。マイグレーション体験は良いが、SQLite + 個人用途では Drizzle の方が軽快。
- **tRPC**: Next.js の Server Actions / API Routes で十分。
- **Redis 等のキャッシュ層**: ローカル動作のためオーバースペック。
- **`@fightmegg/riot-rate-limiter`**: 依存追加よりも、自作の単純なリミッタで挙動を把握する。同期頻度が低い(数日に1回)ため過剰。

---

## 4. システムアーキテクチャ

### 4.1 全体構成

```
┌─────────────────────────────────────────────────────────┐
│  ブラウザ (localhost:3000)                              │
│  ┌─────────────────┐  ┌────────────────────────────┐  │
│  │ ダッシュボード   │  │ マッチアップ分析画面        │  │
│  └─────────────────┘  └────────────────────────────┘  │
│           │                       │                     │
│           └───── fetch ────────────┘                    │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Next.js Server (App Router)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  API Routes / Server Actions                    │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────┐ │   │
│  │  │ /api/sync│  │ /api/matches │  │ /api/... │ │   │
│  │  └─────┬────┘  └──────┬───────┘  └────┬─────┘ │   │
│  └────────┼──────────────┼────────────────┼──────┘   │
│           ▼              ▼                ▼          │
│  ┌────────────────┐ ┌────────────┐  ┌─────────────┐ │
│  │ SyncService    │ │ Repository │  │ Aggregator  │ │
│  │ (同期ロジック) │ │ (DB アクセス)│  │ (集計ロジック)│ │
│  └────────┬───────┘ └─────┬──────┘  └──────┬──────┘ │
│           │               │                │        │
│           ▼               ▼                ▼        │
│  ┌────────────────┐ ┌────────────────────────────┐ │
│  │ RiotApiClient  │ │ Drizzle ORM                │ │
│  │ (HTTP+リミッタ)│ │                            │ │
│  └────────┬───────┘ └─────────────┬──────────────┘ │
└───────────┼───────────────────────┼─────────────────┘
            │                       │
            ▼                       ▼
   ┌────────────────┐      ┌──────────────────┐
   │ Riot Games API │      │ data/matches.db  │
   │ (HTTPS)        │      │ (SQLite)         │
   └────────────────┘      └──────────────────┘
```

### 4.2 レイヤー責務

| レイヤー | 責務 | 依存先 |
|---------|------|-------|
| **UI (React Components)** | 表示とユーザー操作 | API Routes |
| **API Routes / Actions** | HTTP I/F、認証(将来)、入力検証 | Service |
| **Service** | ユースケース(同期、分析等) | Repository, RiotApiClient |
| **Repository** | DB アクセスの抽象化 | Drizzle |
| **RiotApiClient** | HTTP 通信、レート制限、リトライ | (なし) |
| **Aggregator** | 集計クエリの集約 | Drizzle (生 SQL も使う) |

**依存方向は常に上から下**。逆方向の依存は禁止。

### 4.3 データフロー(同期処理の例)

```
[更新ボタン押下]
    │
    ▼
POST /api/sync
    │
    ▼
SyncService.syncRecentMatches()
    │
    ├─► RiotApiClient.getMatchIdsByPuuid(puuid, queue=420)
    │       └─► [match_id_1, match_id_2, ...]
    │
    ├─► Repository.findExistingMatchIds([...])
    │       └─► 既存の match_id を除外
    │
    ├─► For each new match_id:
    │     ├─► RiotApiClient.getMatch(match_id)
    │     ├─► RiotApiClient.getMatchTimeline(match_id)
    │     ├─► Transformer.toMatchRow(matchData, timelineData)
    │     └─► Repository.insertMatchTransaction(rows)
    │           ├─► raw_data に JSON 保存
    │           ├─► matches に基本情報
    │           ├─► my_performance に自分の戦績
    │           ├─► matchup に対面情報
    │           ├─► my_build_events にビルド履歴
    │           └─► my_skill_order にスキル順
    │
    └─► return { added: N, skipped: M }
```

---

## 5. データモデル

### 5.1 設計方針

- **正規化を基本としつつ、集計の高速化のため一部冗長化を許容**(例: `cs_diff_at_15`)
- **生データの保存層を必ず持つ**(`raw_data`)
- **すべてのテーブルに `match_id` で辿れるようにする**(分析の起点)

### 5.2 テーブル定義

#### 5.2.1 raw_data (生データ保存) ★重要

```sql
CREATE TABLE raw_data (
  match_id        TEXT NOT NULL,
  data_type       TEXT NOT NULL,    -- 'match' | 'timeline'
  payload         TEXT NOT NULL,    -- JSON 文字列
  fetched_at      INTEGER NOT NULL, -- unix ms
  schema_version  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (match_id, data_type)
);
```

**役割**: 後で新しい分析軸が必要になった時、API 再取得なしでローカル再構築できる。
スキーマ変更時にも、ここから再変換するだけで済む。

#### 5.2.2 matches (試合の基本情報)

```sql
CREATE TABLE matches (
  match_id        TEXT PRIMARY KEY,
  game_creation   INTEGER NOT NULL,   -- unix ms
  game_duration   INTEGER NOT NULL,   -- 秒
  game_version    TEXT NOT NULL,      -- "14.21.123.4567"
  patch           TEXT NOT NULL,      -- "14.21" (game_versionから派生)
  queue_id        INTEGER NOT NULL,
  win             INTEGER NOT NULL,   -- 0/1
  created_at      INTEGER NOT NULL    -- レコード作成日時
);
CREATE INDEX idx_matches_creation ON matches(game_creation DESC);
CREATE INDEX idx_matches_patch ON matches(patch);
```

#### 5.2.3 my_performance (自分のパフォーマンス)

```sql
CREATE TABLE my_performance (
  match_id            TEXT PRIMARY KEY,
  champion_id         INTEGER NOT NULL,
  champion_name       TEXT NOT NULL,
  role                TEXT NOT NULL,  -- TOP/JUNGLE/MIDDLE/BOTTOM/UTILITY
  team_id             INTEGER NOT NULL, -- 100/200
  -- 最終スタッツ
  kills               INTEGER NOT NULL,
  deaths              INTEGER NOT NULL,
  assists             INTEGER NOT NULL,
  cs_total            INTEGER NOT NULL,
  gold_total          INTEGER NOT NULL,
  damage_to_champions INTEGER NOT NULL,
  vision_score        INTEGER NOT NULL,
  -- @15分時点 (Timeline API から)
  cs_at_15            INTEGER,
  gold_at_15          INTEGER,
  level_at_15         INTEGER,
  xp_at_15            INTEGER,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
CREATE INDEX idx_perf_champion ON my_performance(champion_name);
CREATE INDEX idx_perf_role ON my_performance(role);
```

#### 5.2.4 matchup (対面相手) ★メイン機能の核

```sql
CREATE TABLE matchup (
  match_id            TEXT PRIMARY KEY,
  opponent_puuid      TEXT,
  opp_champion_id     INTEGER NOT NULL,
  opp_champion_name   TEXT NOT NULL,
  opp_kills           INTEGER NOT NULL,
  opp_deaths          INTEGER NOT NULL,
  opp_assists         INTEGER NOT NULL,
  opp_cs_total        INTEGER NOT NULL,
  opp_gold_total      INTEGER NOT NULL,
  opp_damage_to_champions INTEGER NOT NULL,
  -- @15分時点
  opp_cs_at_15        INTEGER,
  opp_gold_at_15      INTEGER,
  opp_level_at_15     INTEGER,
  -- 計算済み差分 (集計高速化のため冗長化)
  cs_diff_at_15       INTEGER,  -- 自分 - 相手
  gold_diff_at_15     INTEGER,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
CREATE INDEX idx_matchup_opp ON matchup(opp_champion_name);
-- 「私のJinx vs 相手のCaitlyn」を高速に引くための複合index
CREATE INDEX idx_matchup_combo ON matchup(opp_champion_name, match_id);
```

#### 5.2.5 my_build_events (ビルド履歴)

```sql
CREATE TABLE my_build_events (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id        TEXT NOT NULL,
  timestamp_ms    INTEGER NOT NULL,  -- 試合開始からのms
  item_id         INTEGER NOT NULL,
  event_type      TEXT NOT NULL,     -- PURCHASED/SOLD/UNDO/DESTROYED
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
CREATE INDEX idx_build_match ON my_build_events(match_id, timestamp_ms);
```

**設計判断**: 「最終アイテム構成」を別カラムに持たず、イベント時系列のみ持つ。
理由: 「最初の3アイテム順」「コアビルド時間」など、後から多様な分析を作るのが容易。
最終構成が必要なら集計クエリで導出する。

#### 5.2.6 my_skill_order (スキル順)

```sql
CREATE TABLE my_skill_order (
  match_id    TEXT NOT NULL,
  level       INTEGER NOT NULL,  -- 1〜18
  skill_slot  INTEGER NOT NULL,  -- 1=Q, 2=W, 3=E, 4=R
  PRIMARY KEY (match_id, level),
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
```

#### 5.2.7 my_runes (ルーン) - v2 で追加

```sql
CREATE TABLE my_runes (
  match_id          TEXT PRIMARY KEY,
  primary_style     INTEGER,
  primary_keystone  INTEGER,
  primary_1 INTEGER, primary_2 INTEGER, primary_3 INTEGER,
  sub_style         INTEGER,
  sub_1 INTEGER, sub_2 INTEGER,
  shard_offense INTEGER, shard_flex INTEGER, shard_defense INTEGER,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
```

#### 5.2.8 notes (メモ機能) - v3 で追加

```sql
CREATE TABLE notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id    TEXT NOT NULL,
  content     TEXT NOT NULL,
  tags        TEXT,           -- JSON配列の文字列 ["roaming", "vision"]
  created_at  INTEGER NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);
CREATE INDEX idx_notes_match ON notes(match_id);
```

#### 5.2.9 sync_log (同期履歴)

```sql
CREATE TABLE sync_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at      INTEGER NOT NULL,
  finished_at     INTEGER,
  matches_added   INTEGER NOT NULL DEFAULT 0,
  matches_skipped INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL,   -- 'running'/'success'/'failed'
  error_message   TEXT
);
```

**役割**: 「最後にいつ同期したか」UI に出すため、また失敗時のデバッグ用。

### 5.3 ER 図

```
                    ┌─────────────┐
                    │  raw_data   │
                    │             │
                    └─────────────┘
                           │ (match_id)
                           │
                    ┌──────┴──────┐
                    │   matches   │
                    └──────┬──────┘
                           │ (1:1)
        ┌──────────────────┼──────────────┬─────────────┐
        ▼                  ▼              ▼             ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────┐
│my_performance│  │   matchup    │  │  my_runes   │  │ notes  │
└──────────────┘  └──────────────┘  └─────────────┘  └────────┘
        │
        │ (1:N)
        ▼
┌────────────────┐    ┌────────────────┐
│my_build_events │    │ my_skill_order │
└────────────────┘    └────────────────┘
```

---

## 6. ディレクトリ構成

```
lol-stats/
├── .env.local                  # RIOT_API_KEY, MY_PUUID, REGION
├── .env.example                # コミット用テンプレート
├── .gitignore                  # data/, .env.local 含む
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── next.config.ts
│
├── data/                       # SQLite ファイル(gitignore)
│   └── matches.db
│
├── drizzle/                    # マイグレーションファイル
│   └── 0000_initial.sql
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # ダッシュボード
│   │   ├── matchup/
│   │   │   ├── page.tsx        # マッチアップ一覧
│   │   │   └── [champ]/[opp]/
│   │   │       └── page.tsx    # マッチアップ詳細
│   │   ├── champion/[name]/
│   │   │   └── page.tsx        # チャンピオン別
│   │   └── api/
│   │       ├── sync/route.ts
│   │       ├── matches/route.ts
│   │       └── matchup/route.ts
│   │
│   ├── components/             # React コンポーネント
│   │   ├── ui/                 # shadcn/ui
│   │   ├── SyncButton.tsx
│   │   ├── MatchupTable.tsx
│   │   └── BuildTimeline.tsx
│   │
│   ├── lib/
│   │   ├── riot/               # ★ Riot API 層
│   │   │   ├── client.ts       # HTTP クライアント
│   │   │   ├── rate-limiter.ts # レート制限
│   │   │   ├── types.ts        # API レスポンス型 (Zod)
│   │   │   └── routing.ts      # リージョン解決
│   │   │
│   │   ├── db/                 # ★ DB 層
│   │   │   ├── client.ts       # Drizzle インスタンス
│   │   │   ├── schema.ts       # テーブル定義
│   │   │   └── migrate.ts
│   │   │
│   │   ├── repositories/       # ★ Repository 層
│   │   │   ├── matches.ts
│   │   │   ├── matchup.ts
│   │   │   ├── performance.ts
│   │   │   └── raw-data.ts
│   │   │
│   │   ├── services/           # ★ ユースケース層
│   │   │   ├── sync.ts         # 同期処理
│   │   │   └── analyze.ts      # 集計
│   │   │
│   │   ├── transformers/       # ★ API → DB 変換
│   │   │   ├── match.ts
│   │   │   └── timeline.ts
│   │   │
│   │   ├── aggregators/        # ★ 集計クエリ
│   │   │   ├── matchup-stats.ts
│   │   │   └── champion-stats.ts
│   │   │
│   │   └── utils/
│   │       ├── patch.ts        # game_version → patch 変換
│   │       └── constants.ts
│   │
│   └── types/                  # 共通型
│       └── domain.ts
│
└── tests/
    ├── fixtures/               # 実APIレスポンスのサンプル
    │   ├── match-sample.json
    │   └── timeline-sample.json
    ├── transformers.test.ts
    └── aggregators.test.ts
```

### 6.1 構成上のポイント

- **`lib/riot/` と `lib/db/` を完全に分離**: 互いを知らない。`transformers/` が橋渡し。
- **`repositories/` で DB アクセスをカプセル化**: SQL を直接書くのはここだけ。
- **`services/` がユースケース**: 「同期する」「集計する」など、UI から呼ばれる単位。
- **`tests/fixtures/` に実 API レスポンスを保存**: テストで Riot API をモックできる。

---

## 7. Riot API 連携設計

### 7.1 使用エンドポイント

| エンドポイント | 用途 | レート消費 |
|---|---|---|
| `GET /lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420` | 試合 ID 一覧 | 1 req |
| `GET /lol/match/v5/matches/{matchId}` | 試合詳細 | 1 req/match |
| `GET /lol/match/v5/matches/{matchId}/timeline` | タイムライン(@15分情報、ビルド履歴) | 1 req/match |
| `GET /riot/account/v1/accounts/by-riot-id/{name}/{tag}` | 初回 PUUID 取得(1回のみ) | 1 req |

**1試合の取り込み = 2リクエスト** (詳細 + タイムライン)。

### 7.2 リージョンルーティング

Riot API は2種類のエンドポイント体系がある:

- **Regional routing**: `americas` / `asia` / `europe` / `sea` (Match-V5, Account-V1)
- **Platform routing**: `jp1` / `kr` / `na1` 等 (Summoner-V4 など)

Match-V5 は **Regional**。日本の場合 `asia.api.riotgames.com` を使う。

### 7.3 レート制限戦略

開発キーの制限: **20 req/秒、100 req/2分**

自作リミッタの方針:
- **トークンバケット**を秒単位と2分単位の二重で持つ
- 制限に近づいたら自動 sleep
- 429 が返ったら `Retry-After` ヘッダに従ってリトライ

```typescript
// 擬似コード
class RateLimiter {
  async acquire(): Promise<void> {
    while (this.shortBucket.tokens < 1 || this.longBucket.tokens < 1) {
      await sleep(100);
    }
    this.shortBucket.tokens--;
    this.longBucket.tokens--;
  }
}
```

### 7.4 エラーハンドリング

| ステータス | 対応 |
|---|---|
| 200 | 正常 |
| 404 | 試合が存在しない → スキップして続行 |
| 429 | レート制限超過 → `Retry-After` 後にリトライ |
| 5xx | サーバーエラー → 指数バックオフで最大3回リトライ |
| その他 | エラーログ + sync_log に記録、当該試合のみスキップ |

### 7.5 設定の取り扱い

```env
# .env.local
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MY_PUUID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REGION=asia
PLATFORM=jp1
```

PUUID は初回のみ Riot ID から取得し、`.env.local` に固定。毎回 API を叩かない。

---

## 8. 主要画面設計

### 8.1 画面一覧

| パス | 画面 | 主機能 |
|---|---|---|
| `/` | ダッシュボード | 全体勝率、最近の試合、更新ボタン |
| `/matchup` | マッチアップ一覧 | 自分Champ × 対面Champ の勝率テーブル |
| `/matchup/[champ]/[opp]` | マッチアップ詳細 | 勝った/負けた試合のビルド比較等 |
| `/champion/[name]` | チャンピオン別 | そのチャンピオンの試合履歴・統計 |

### 8.2 共通レイアウト

- ヘッダーに **更新ボタン** と **最終同期時刻**
- 同期中はボタンに進捗表示 `⏳ 同期中... (3/12)`

### 8.3 マッチアップ詳細画面の核

- 平均スタッツの自分 vs 相手の並列表示
- **勝った試合のビルド** と **負けた試合のビルド** を上下に並べる
   - パターンの違いを目視で発見できることが目的
- 各試合の詳細(Recharts でゴールド差/CS差の時系列)

---

## 9. 開発ロードマップ

### v0.1 - スケルトン (1日)
- [ ] Next.js プロジェクト初期化
- [ ] Drizzle セットアップ + 初期マイグレーション
- [ ] `.env.local` 設計
- [ ] Riot API クライアントの単発 GET 実装
- [ ] PUUID 確認スクリプト

### v0.2 - 同期 MVP (2-3日)
- [ ] レートリミッタ実装
- [ ] 試合 ID 一覧取得
- [ ] 試合詳細・タイムライン取得
- [ ] Transformer 実装(API → DB 行)
- [ ] `/api/sync` 実装
- [ ] フィクスチャベースのテスト

### v0.3 - 表示 MVP (1-2日)
- [ ] ダッシュボード(総試合数、勝率、最近の試合)
- [ ] 更新ボタン + 進捗表示
- [ ] チャンピオン別画面

### v0.4 - マッチアップ分析 ★メイン (3-5日)
- [ ] マッチアップ集計クエリ
- [ ] マッチアップ一覧画面
- [ ] マッチアップ詳細画面(ビルド比較)
- [ ] 苦手対面ランキング

### v0.5 - 補助分析
- [ ] パッチ別勝率推移
- [ ] ヒートマップ
- [ ] ロール別集計

### v1.0 - 仕上げ
- [ ] エラー時の UI 改善
- [ ] パフォーマンス最適化(必要なら)
- [ ] 設定画面(対象 PUUID 切り替えなど)

### 将来の拡張候補 (やるかは未定)
- ルーン分析
- メモ機能
- 味方・敵チーム別分析
- 時間帯・連戦分析
- Tailscale + モバイル対応
- Electron / Tauri 化(オーバーレイ機能のため)

---

## 10. テスト戦略

### 10.1 テストの優先順位

ローカル個人ツールゆえ、テストは「壊れたら困るところ」に絞る。

| 対象 | テストする | 理由 |
|---|---|---|
| Transformer (API → DB 変換) | ✅ 必須 | データ品質の中核、バグると全データが壊れる |
| Aggregator (集計クエリ) | ✅ 必須 | 数値が間違ってると意味がない |
| RateLimiter | ✅ 推奨 | 微妙な挙動でハマりやすい |
| RiotApiClient | △ モック程度 | 統合テストは API キー必要 |
| UI コンポーネント | ✕ スキップ | 個人用、見て分かる |

### 10.2 フィクスチャ戦略

実際の Riot API レスポンスを `tests/fixtures/` に保存し、Transformer のテストはこれをベースに行う。
これにより、Riot API のスキーマ変更に気づきやすい。

```typescript
// tests/transformers.test.ts
import matchSample from './fixtures/match-sample.json';
import timelineSample from './fixtures/timeline-sample.json';

test('Transformer: 自分のCS@15を正しく抽出する', () => {
  const result = toMatchupRow(matchSample, timelineSample, MY_PUUID);
  expect(result.cs_at_15).toBe(72);
});
```

---

## 11. セキュリティ・運用

### 11.1 API キー管理

- `.env.local` に保存し、`.gitignore` に追加
- `.env.example` をコミットして必要な変数を明示
- 万一漏洩した場合は Riot Developer Portal で即座に再発行
- **絶対にフロントエンドのコードに含めない**(常に Server 経由)

### 11.2 DB ファイル管理

- `data/matches.db` は **gitignore**(個人データのため)
- バックアップ: 定期的に `data/` ディレクトリを別ストレージにコピー
- 将来クラウド同期したくなったら、Litestream + S3 互換ストレージ で対応可能

### 11.3 Riot 開発者規約への配慮

- 自分専用の Personal API Key の範囲で運用
- 公開する場合は Production Key 申請が必要
- 試合データを第三者に再配布しない

---

## 12. 拡張性のための設計判断記録 (ADR 風)

### ADR-001: Raw Data Layer の採用

**決定**: Riot API レスポンスを JSON 文字列のまま `raw_data` テーブルに保存する。

**理由**:
- スキーマ進化時に再取得不要
- レート制限を考えると、過去試合の再取得は数十分〜数時間かかる
- ストレージコストは無視できる(1試合 ~30KB × 数千試合 = 100MB 程度)

**トレードオフ**:
- 容量増加(許容範囲)
- 「正データはどっち?」問題 → 構造化テーブルが正、`raw_data` は復元用

### ADR-002: Drizzle 採用 (Prisma 不採用)

**決定**: ORM は Drizzle を使う。

**理由**:
- 軽量、TS ファースト
- 生 SQL も書ける(集計クエリで重要)
- 個人プロジェクト規模では Prisma の機能はオーバースペック

### ADR-003: Diff カラムの冗長化

**決定**: `cs_diff_at_15` 等の差分を計算済みで保存する。

**理由**:
- 集計クエリの WHERE 句で使う頻度が高い (`WHERE cs_diff_at_15 < -10`)
- データは不変(後から自分のCSは変わらない)なので冗長化のリスクなし
- 集計が一桁速くなる

### ADR-004: ローカル動作前提

**決定**: 認証・マルチテナント・ホスティングは初期スコープ外。

**理由**:
- 「自分専用」という要件
- 認証を入れると複雑度が一桁上がる
- 将来必要になっても、API Routes は変えずに認証ミドルウェア追加のみで対応可能

### ADR-005: ソロランクのみ

**決定**: queue_id = 420 のみ取り込む。

**理由**:
- ARAM やノーマルとはプレイの真剣度・分析の意味が違う
- データを混ぜると統計が無意味になる
- 将来必要なら `queue_id` で分けて分析可能(データは変えなくて済む)

---

## 13. 参考リンク

- [Riot Developer Portal](https://developer.riotgames.com/)
- [Match-V5 API Reference](https://developer.riotgames.com/apis#match-v5)
- [Rate Limiting Documentation](https://developer.riotgames.com/docs/portal#web-apis_api-keys)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)

---

*Last updated: 2026-05-10*
