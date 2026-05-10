# LoL Personal Stats

自分専用の League of Legends 戦績分析ツール。
対面相手別のパフォーマンスを主軸に、自己改善のためのインサイトを得ることを目的とした個人用 Web アプリ。

## 機能

- **ダッシュボード** — 総試合数・勝率・最近の試合・パッチ別勝率グラフ
- **マッチアップ分析** — 自分のチャンピオン × 対面チャンピオンの勝率・CS差・Gold差を一覧表示
- **マッチアップ詳細** — 勝ち/負けパターンの比較、@15分スタッツの時系列チャート
- **チャンピオン別統計** — KDA・CS・勝率・対面別勝率

## 技術スタック

| 層 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| DB | SQLite (better-sqlite3) |
| ORM | Drizzle ORM |
| UI | Tailwind CSS + shadcn/ui |
| グラフ | Recharts |
| バリデーション | Zod |
| テスト | Vitest |

## セットアップ

### 前提条件

- Node.js 20 以上 (推奨: v24)
- Riot Developer Portal の API キー

### 1. 環境変数を設定する

```bash
cp .env.example .env.local
```

`.env.local` を編集して以下を設定する:

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MY_PUUID=（下記の手順で取得）
REGION=asia
PLATFORM=jp1
```

### 2. PUUID を取得する（初回のみ）

開発サーバーを起動後、以下の URL にアクセスする:

```
http://localhost:3000/api/puuid?gameName=ゲーム名&tagLine=タグ
```

表示された `puuid` の値を `.env.local` の `MY_PUUID` に設定する。

### 3. DB を初期化する

```bash
npm run db:migrate
```

### 4. 開発サーバーを起動する

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開く。

## 使い方

1. 画面右上の **「データ更新」** ボタンを押して試合データを同期する
2. ダッシュボードで最近の試合と全体勝率を確認する
3. **マッチアップ** から対面チャンピオン別の勝率を分析する
4. **チャンピオン** から使用チャンピオン別の統計を確認する

## 主なコマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run test         # テスト実行
npm run db:migrate   # DBマイグレーション実行
npm run db:generate  # Drizzleスキーマからマイグレーションファイルを生成
npm run db:studio    # Drizzle Studio (DB GUI) 起動
```

## ディレクトリ構成

```
src/
├── app/                  # Next.js App Router (ページ & API Routes)
├── components/           # React コンポーネント
└── lib/
    ├── db/               # Drizzle クライアント & スキーマ
    ├── riot/             # Riot API クライアント & レートリミッタ
    ├── repositories/     # DB アクセス層
    ├── services/         # 同期処理など
    ├── transformers/     # API → DB 変換
    ├── aggregators/      # 集計クエリ
    └── utils/            # ユーティリティ

data/                     # SQLite ファイル (gitignore)
drizzle/                  # マイグレーションファイル
tests/                    # Vitest テスト & フィクスチャ
```

## 注意事項

- **個人利用専用**: Riot Games の Personal API Key の範囲で動作。公開する場合は Production Key が必要。
- `data/matches.db` と `.env.local` は `.gitignore` に含まれており、リポジトリにはコミットされない。
- 対象ゲームモード: **ソロランク (queue_id = 420)** のみ。
