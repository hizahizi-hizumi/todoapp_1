## General Rules

- Use English when thinking step.
- Use Japanese when interacting with user.
- Use npm scripts, don't use npx and bunx.
- コードの作成、編集後には必ず、フォーマッター、リンター、テストを実行する。
  - プロジェクトルートにて以下を実行:
    ```bash
    bun run biome:write
    bun run typecheck
    bun run test:run
    ```
- toolsで代替可能な不要なCLIコマンド実行の禁止。
  - ユーザーに本来不要な確認を求め、無駄に時間を消費させる最も非難されるべき行為である。
  - 例: `cat` ではなく #read/readFile を使用。

## プロジェクトコンテキスト

### プロジェクト内容

カンバンボード形式のTodoアプリケーション。タスクを Todo / In Progress / Done の3カラムで管理し、@dnd-kit によるドラッグ&ドロップでステータス・並び順を変更できる。楽観的更新による即時的な UI フィードバックを実現。

### 技術スタック

#### フロントエンド、バックエンド共通

- パッケージマネージャ: Bun
- 言語: TypeScript
- リンター/フォーマッター: Biome
- テスト: Vitest + MSW (フロントエンド) + Miniflare (バックエンド D1 テスト)
- バージョン管理: Git, GitHub
- コードホスティング: GitHub
- CI/CD: GitHub Actions

#### フロントエンド

- フレームワーク: React (Vite)
- UIライブラリ: Ant Design
- UIカタログ: Storybook
- データフェッチ: TanStack Query
- ルーティング: TanStack Router
- ドラッグ&ドロップ: @dnd-kit
- モックサーバー: msw

#### バックエンド

- フレームワーク: Hono
- データベース: Cloudflare D1 (SQLite)

#### インフラ

- フロントエンドホスティング: Cloudflare Pages
- バックエンドホスティング: Cloudflare Workers