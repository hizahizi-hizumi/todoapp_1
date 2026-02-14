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

<!-- このテンプレートからリポジトリを作成後追記 -->

### 技術スタック

#### フロントエンド、バックエンド共通

- パッケージマネージャ: Bun
- 言語: TypeScript
- リンター/フォーマッター: Biome
- テスト: Vitest
- バージョン管理: Git, GitHub
- コードホスティング: GitHub
- CI/CD: GitHub Actions

#### フロントエンド

- フレームワーク: React (Vite)
- UIライブラリ: Ant Design
- UIカタログ: Storybook
- データフェッチ: TanStack Query
- ルーティング: TanStack Router
- モックサーバー: msw

#### バックエンド

- フレームワーク: Hono


#### インフラ

- フロントエンドホスティング: Cloudflare Pages
- バックエンドホスティング: Cloudflare Workers