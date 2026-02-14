## 概要

Hono は、Web 標準 API をベースにした軽量かつ高速な Web フレームワークであり、特にエッジコンピューティング環境（Cloudflare Workers、Deno Deploy など）やサーバーレス環境で高い評価を得ている。「一度書けばどこでも動く（Write once, run anywhere）」という設計思想により、Node.js、Bun、Deno など複数のランタイムで同じコードを動作させることができる。

コミュニティでは以下の点が特に評価されている：

- **パフォーマンス**: Bun と組み合わせることで Fastify を上回るベンチマーク結果
- **シンプルさ**: Express に似た直感的な API でありながら、より軽量
- **型安全性**: TypeScript ファーストの設計で、RPC クライアントとの統合も強力
- **ポータビリティ**: 複数のランタイム間でコードを再利用可能

## セットアップのベストプラクティス

### プロジェクト初期化

公式の `create-hono` コマンドを使用してプロジェクトを作成する。

```bash
npm create hono@latest my-app
# または
bun create hono@latest my-app
```

テンプレート選択時は、デプロイ先に応じて適切なテンプレートを選ぶ：

- `cloudflare-workers`: Cloudflare Workers 向け
- `bun`: Bun ランタイム向け（高パフォーマンス推奨）
- `nodejs`: 従来の Node.js サーバー向け

### 推奨ディレクトリ構造

中規模〜大規模アプリケーション向けの構造：

```
src/
├── index.ts              # アプリケーションのエントリーポイント
├── schemas/              # Zod スキーマ（単一の真実の源）
│   └── user.schema.ts
├── controllers/          # HTTP ハンドラー（薄いレイヤー）
│   └── user.controller.ts
├── services/             # ビジネスロジック（HTTP の詳細を含まない）
│   └── user.service.ts
├── middlewares/          # 認証、ロギング、エラーハンドリング
│   └── auth.middleware.ts
├── routes/               # ルート定義
│   ├── authors.ts
│   └── books.ts
└── components/           # JSX コンポーネント（SSR 使用時）
    └── Layout.tsx
```

### TypeScript 設定（パスエイリアス）

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "paths": {
      "@controllers/*": ["controllers/*"],
      "@services/*": ["services/*"],
      "@schemas/*": ["schemas/*"]
    }
  }
}
```

> **注意**: Bun ランタイムではパスエイリアスがランタイムでサポートされないため、実際のインポートには相対パス（`.js` 拡張子付き）を使用すること。

## 実践的な使用パターン

### 開発環境での活用

#### Controller パターンを避ける

Hono の公式ベストプラクティスとして、Ruby on Rails 風の Controller パターンを避けることが推奨されている。型推論が正しく動作しなくなるため。

```typescript
// ❌ 避けるべきパターン
const booksList = (c: Context) => {
  return c.json('list books')
}
app.get('/books', booksList)

// ✅ 推奨パターン
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // パスパラメータが正しく推論される
  return c.json(`get ${id}`)
})
```

#### `app.route()` を使った大規模アプリケーション構築

```typescript
// authors.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create an author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
export type AppType = typeof app // RPC 機能使用時に型をエクスポート
```

```typescript
// index.ts
import { Hono } from 'hono'
import authors from './authors'
import books from './books'

const app = new Hono()
app.route('/authors', authors)
app.route('/books', books)

export default app
```

#### Controller パターンが必要な場合

`factory.createHandlers()` を使用することで、型推論を維持しながら Controller パターンを実現できる。

```typescript
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

const middleware = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo)
})

app.get('/api', ...handlers)
```

### Zod を使用したバリデーション

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().int().positive(),
})

const app = new Hono()

app.post(
  '/users',
  zValidator('json', createUserSchema),
  (c) => {
    const user = c.req.valid('json') // 型安全なデータ取得
    return c.json({ success: true, user }, 201)
  }
)
```

#### カスタムエラーハンドラー付きバリデーター

```typescript
import type { ValidationTargets } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const customZodValidator = <
  Target extends keyof ValidationTargets,
  Schema extends z.ZodSchema
>(
  target: Target,
  schema: Schema
) => {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          timestamp: Date.now(),
          message: `invalid ${target}`,
          issues: result.error.issues,
        },
        400
      )
    }
    return result.data
  })
}
```

### CI/CD統合

#### Docker + Bun でのデプロイ

```dockerfile
FROM oven/bun

WORKDIR /usr/src/app
COPY . .
RUN bun install
EXPOSE 3000

CMD ["bun", "start"]
```

#### Node.js + pm2 でのプロダクション運用

```typescript
// src/index.ts
import { serve } from '@hono/node-server'
import app from './app'

serve({ fetch: app.fetch, port: 3000 })
```

```bash
# ビルド後、pm2 で起動
npm run build
pm2 start dist/index.js
```

#### Cloudflare Workers へのデプロイ

```bash
# wrangler でデプロイ
wrangler deploy
```

## よくある問題と解決策

### ESM インポートと `.js` 拡張子の問題

**問題**: Bun（および Node.js ESM）ではローカルインポートに明示的な `.js` 拡張子が必要。

**エラー例**:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './lib/db' imported from ...
```

**解決策**:
```typescript
// ❌ 動作しない
import { db } from './lib/db'

// ✅ 正しい
import { db } from './lib/db.js'
```

tsconfig.json での設定：
```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### パスエイリアスがランタイムで動作しない

**問題**: `@/lib/db` のようなパスエイリアスは TypeScript のコンパイル時のみ有効で、ランタイムではサポートされない。

**解決策**:
- ランタイムコードでは相対パスのみを使用
- `module-alias` や `tsconfig-paths` などのレガシーツールは Bun では動作しないため削除

### セキュリティ脆弱性への対応

コミュニティで報告された主要なセキュリティ問題：

| 問題 | 重要度 | 対策 |
|------|--------|------|
| JWT アルゴリズム混同（HS256 デフォルト） | High | 明示的にアルゴリズムを指定 |
| JWT Middleware での認証バイパス | High | 最新バージョンへ更新 |
| Cache Middleware の `Cache-Control: private` 無視 | Moderate | キャッシュ設定を見直し |
| IP 制限 Middleware での IPv4 検証バイパス | Moderate | 追加の検証レイヤーを実装 |
| Body Limit Middleware のバイパス | Moderate | 最新バージョンへ更新 |

**推奨**: GitHub Security Advisories を定期的に確認し、依存関係を最新に保つ。

### 環境変数の読み込み

**Bun の場合**: プロジェクトルートに `.env` ファイルを配置すれば自動的に読み込まれる。

```typescript
// process.env でアクセス
const apiKey = process.env.API_KEY
```

## パフォーマンス最適化

### ランタイム選択の影響

コミュニティのベンチマーク結果によると：

- **Bun + Hono**: 最高のパフォーマンス（Fastify を上回る）
- **Node.js + Hono**: Web 標準 API へのアダプター変換オーバーヘッドがあるが、最近のアダプター改善により Fastify と同等以上

**推奨**: パフォーマンスが重要な場合は Bun ランタイムを使用。

### Bun でのマルチコア活用

```typescript
// cluster.ts
const numCPUs = navigator.hardwareConcurrency
const buns = new Array(numCPUs)

for (let i = 0; i < numCPUs; i++) {
  buns[i] = Bun.spawn({
    cmd: ['bun', `${__dirname}/index.ts`],
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  })
}

function kill() {
  for (const bun of buns) {
    bun.kill()
  }
}

process.on('SIGINT', kill)
process.on('exit', kill)
```

```typescript
// index.ts
import { Hono } from 'hono'

const app = new Hono()
const port = 3000

app.get('/', (c) => c.text('Hello Hono!'))

Bun.serve({
  port: port,
  reusePort: true, // 複数プロセスでポート共有
  fetch: app.fetch,
})
```

### カスタムキャッシュミドルウェア

```typescript
const cacheStore = new Map()

app.use('/api/public-data', async (c, next) => {
  const cacheKey = c.req.url

  if (cacheStore.has(cacheKey)) {
    const cachedItem = cacheStore.get(cacheKey)
    return new Response(cachedItem.body, { headers: cachedItem.headers })
  }

  await next()

  if (c.res) {
    const newResponse = c.res.clone()
    const body = await newResponse.text()
    const headers = Object.fromEntries(newResponse.headers.entries())
    cacheStore.set(cacheKey, { body, headers })
  }
})
```

## チーム開発での運用

### 型定義の一元管理

Zod スキーマを「単一の真実の源（Single Source of Truth）」として使用：

```typescript
// schemas/user.schema.ts
import { z } from 'zod'
import 'zod-openapi/extend'

export const CreateUserSchema = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  password: z.string().min(8).openapi({ example: 'SecurePass123!' }),
  name: z.string().min(2).openapi({ example: 'John Doe' }),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
```

このスキーマは以下の用途で使用：
1. ランタイムバリデーション
2. OpenAPI ドキュメント自動生成
3. テストデータの型検証

### エラーハンドリングの標準化

```typescript
// exceptions/http-exceptions.ts
import { HTTPException } from 'hono/http-exception'

export class NotFoundError extends HTTPException {
  constructor(resource: string) {
    super(404, { message: `${resource} not found` })
  }
}

export class UnauthorizedError extends HTTPException {
  constructor() {
    super(401, { message: 'Unauthorized' })
  }
}
```

使用例：

```typescript
// サービス層で throw し、Hono が自動的にキャッチ
if (!user) throw new NotFoundError('User')
```

### グローバルエラーハンドラー

```typescript
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json(
    {
      success: false,
      message: err.message,
    },
    500
  )
})
```

### ファイル命名規則

チーム内で一貫性を保つための推奨規則：

- Controllers: `user.controller.ts`
- Services: `user.service.ts`
- Schemas: `user.schema.ts`
- Tests: `user.controller.test.ts`
- Utils: `date.util.ts`
- Middlewares: `auth.middleware.ts`

### DI（依存性注入）

Hono は DI を組み込んでいないため、大規模アプリケーションでは Awilix などの DI コンテナを使用するケースが報告されている。ただし、ボイラープレートが増える点に注意。

## 参考リンク

### 公式ドキュメント
- [Hono 公式サイト](https://hono.dev/)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono Validation Guide](https://hono.dev/docs/guides/validation)

### コミュニティリソース
- [How to Build Production-Ready Web Apps with the Hono Framework - freeCodeCamp](https://www.freecodecamp.org/news/build-production-ready-web-apps-with-hono/)
- [Building Production-Ready Hono APIs: A Modern Architecture Guide - Medium](https://medium.com/@yannick.burkard/building-production-ready-hono-apis-a-modern-architecture-guide-fed8a415ca96)
- [The Real-World Guide to TypeScript + Hono + Bun - Medium](https://medium.com/@sainkee1997/the-real-world-guide-to-typescript-hono-bun-problems-solutions-5eebbe9853e4)
- [Hacking Hono: The Ins and Outs of Validation Middleware - Fiberplane Blog](https://blog.fiberplane.com/blog/hono-validation-middleware/)
- [Request for Guidance: Application Structure & Best Practices - GitHub Issue](https://github.com/honojs/hono/issues/4121)
- [Improve benchmarks - GitHub Discussion](https://github.com/orgs/honojs/discussions/1483)
- [Light as a Feather: Hono and Bun Boost Web Performance - Red Sky Digital](https://redskydigital.com/light-as-a-feather-hono-and-bun-boost-web-performance/)

### セキュリティ
- [Hono Security Advisories - GitHub](https://github.com/honojs/hono/security/advisories)

### 関連フレームワーク
- [HonoX](https://github.com/honojs/honox) - Hono ベースのメタフレームワーク
- [Bun 公式ドキュメント](https://bun.sh/)
