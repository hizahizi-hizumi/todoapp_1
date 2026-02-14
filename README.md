# カンバンTodoアプリ

カンバンボード形式のTodoアプリケーション。タスクを **Todo / In Progress / Done** の3カラムで管理し、ドラッグ&ドロップでステータスを変更できる。

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フロントエンド | React (Vite), Ant Design, TanStack Query, TanStack Router |
| バックエンド | Hono (Cloudflare Workers) |
| データベース | Cloudflare D1 (SQLite) |
| ドラッグ&ドロップ | @dnd-kit |
| テスト | Vitest, MSW, Miniflare |
| リンター/フォーマッター | Biome |
| パッケージマネージャ | Bun |

## 前提条件

- [Bun](https://bun.sh/) v1.x 以上
- Node.js v20 以上

## セットアップ

```sh
bun install
```

D1 データベースのマイグレーション:

```sh
cd backend && bun run -- wrangler d1 migrations apply DB --local
```

## 開発サーバー起動

`.env` からポート番号を指定して起動:

```sh
bun --env-file=.env run dev
```

## 主要スクリプト

| コマンド | 説明 |
|---|---|
| `bun run dev` | フロントエンド・バックエンド・Storybook を同時起動 |
| `bun run typecheck` | TypeScript 型チェック |
| `bun run biome:write` | Biome によるフォーマット・リント修正 |
| `bun run test:run` | テスト実行 |
| `bun run build:frontend` | フロントエンドビルド |

## プロジェクト構成

```
todoapp_1/
├── backend/           # Hono (Cloudflare Workers) API
│   ├── db/migrations/ # D1 マイグレーション SQL
│   └── src/
│       ├── controllers/  # API ルート
│       ├── errors/       # カスタムエラークラス
│       ├── test/         # テストヘルパー (Miniflare D1)
│       ├── usecases/     # ビジネスロジック
│       └── utils/        # ユーティリティ
├── frontend/          # React (Vite) SPA
│   └── src/
│       ├── components/   # 共有コンポーネント
│       ├── config/       # 環境設定
│       ├── pages/        # ページコンポーネント
│       │   └── kanban/   # カンバンボード機能
│       ├── routes/       # TanStack Router ファイルベースルーティング
│       ├── services/     # 汎用フック (useGet, useCreate 等)
│       └── test/         # MSW セットアップ
├── shared/            # 共有型定義 (Task, API 型)
└── docs/              # プロジェクトドキュメント
```

## API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/tasks` | 全タスク取得 |
| GET | `/tasks/:id` | タスク詳細取得 |
| POST | `/tasks` | タスク作成 |
| PUT | `/tasks/:id` | タスク更新 |
| DELETE | `/tasks/:id` | タスク削除 |
| PATCH | `/tasks/:id/move` | タスク移動 (ステータス・並び順変更) |

## ローカルでのデプロイ手順

### フロントエンド

プロジェクトルートにて

初回実行時にのみPagesの初期化が必要:

```sh
bun --env-file=.env run deploy:init-frontend
```

```sh
bun --env-file=.env run build:frontend
bun --env-file=.env run deploy:frontend
```