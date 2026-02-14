---
description: 'Hono Web フレームワークを使用した API 開発のベストプラクティス。型安全性、セキュリティ、パフォーマンス最適化のガイドライン。'
applyTo: '**/*.{ts,tsx,js,jsx}, **/hono.config.*, **/wrangler.toml'
---

# Hono ベストプラクティス

Hono を使用した Web アプリケーション・API 開発における公式推奨事項とコミュニティの知見を統合したガイドラインです。

## 基本原則

- ハンドラは直接定義し、Controller パターンを避ける（型推論を維持するため）
- Zod Validator を使用して型安全なバリデーションを実装する
- `app.route()` でアプリケーションを論理単位に分割する
- 環境変数とコンテキスト変数は型定義を明示する
- ミドルウェアの順序が動作に影響することを理解する

## ルーティングと型推論

### ハンドラを直接定義する

**推奨**:

```typescript
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // パスパラメータが正しく推論される
  return c.json({ id })
})
```

**非推奨**:

```typescript
// 型推論が効かない
const getBook = (c: Context) => {
  const id = c.req.param('id') // パスパラメータを推論できない
  return c.json({ id })
}
app.get('/books/:id', getBook)
```

### 大規模アプリケーションの構造化

`app.route()` を使用してモジュール分割する：

```typescript
// routes/authors.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create an author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
export type AppType = typeof app
```

```typescript
// index.ts
import { Hono } from 'hono'
import authors from './routes/authors'
import books from './routes/books'

const app = new Hono()
const routes = app.route('/authors', authors).route('/books', books)

export default app
export type AppType = typeof routes
```

### Controller パターンが必要な場合

`factory.createHandlers()` を使用する：

```typescript
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo)
})

app.get('/api', ...handlers)
```

## 型定義

### 環境変数とコンテキスト変数の型付け

```typescript
type Bindings = {
  TOKEN: string
  DATABASE_URL: string
}

type Variables = {
  user: User
  requestId: string
}

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

app.use('/auth/*', async (c, next) => {
  const token = c.env.TOKEN // 型推論が効く
  c.set('user', user) // user は User 型
  await next()
})
```

## バリデーション

### Zod Validator を使用する

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

### カスタムエラーハンドラ付きバリデーター

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
) =>
  zValidator(target, schema, (result, c) => {
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
```

### 複数のバリデーター

```typescript
app.post(
  '/posts/:id',
  zValidator('param', paramSchema),
  zValidator('query', querySchema),
  zValidator('json', bodySchema),
  (c) => {
    const param = c.req.valid('param')
    const query = c.req.valid('query')
    const body = c.req.valid('json')
    // ...
  }
)
```

## セキュリティ

### Secure Headers ミドルウェア

```typescript
import { secureHeaders } from 'hono/secure-headers'

app.use(secureHeaders())

// カスタマイズ
app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
    },
  })
)
```

### CORS ミドルウェア

```typescript
import { cors } from 'hono/cors'

// CORS はルートの前に配置する
app.use('/api/*', cors({
  origin: ['https://example.com', 'https://example.org'],
  allowHeaders: ['X-Custom-Header', 'Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  maxAge: 600,
  credentials: true,
}))

// 動的オリジン
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin.endsWith('.example.com') ? origin : null,
  })
)
```

### CSRF Protection

```typescript
import { csrf } from 'hono/csrf'

app.use(csrf({ origin: 'https://myapp.example.com' }))

// 動的オリジン検証
app.use(
  '*',
  csrf({
    origin: (origin) => /https:\/\/(\w+\.)?myapp\.example\.com$/.test(origin),
  })
)
```

## エラーハンドリング

### HTTPException を使用する

```typescript
import { HTTPException } from 'hono/http-exception'

// シンプルなエラー
throw new HTTPException(401, { message: 'Unauthorized' })

// 原因の追加
app.post('/login', async (c) => {
  try {
    await authorize(c)
  } catch (cause) {
    throw new HTTPException(401, { message: 'Auth failed', cause })
  }
  return c.redirect('/')
})
```

### グローバルエラーハンドリング

```typescript
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error.cause)
    return error.getResponse()
  }
  console.error(`${error}`)
  return c.json({ success: false, message: error.message }, 500)
})

app.notFound((c) => {
  return c.json({ message: 'Not Found' }, 404)
})
```

### RPC 使用時は c.notFound() を避ける

**推奨**:

```typescript
if (post === undefined) {
  return c.json({ error: 'not found' }, 404) // ステータスコードを明示
}
return c.json({ post }, 200)
```

**非推奨**:

```typescript
if (post === undefined) {
  return c.notFound() // クライアントで型推論できない
}
```

## パフォーマンス

### ルーター選択

| ルーター | 特徴 | 推奨用途 |
|---------|------|----------|
| SmartRouter（デフォルト） | RegExpRouter と TrieRouter を組み合わせ | 一般的な用途 |
| RegExpRouter | JavaScript 世界最速 | パフォーマンス重視 |
| LinearRouter | ルート登録が高速 | リクエストごとに初期化する環境 |
| PatternRouter | 最小サイズ（15KB未満） | リソースが限られた環境 |

```typescript
import { RegExpRouter } from 'hono/router/reg-exp-router'

const app = new Hono({ router: new RegExpRouter() })
```

### Body Limit ミドルウェア

```typescript
import { bodyLimit } from 'hono/body-limit'

app.post(
  '/upload',
  bodyLimit({
    maxSize: 50 * 1024, // 50KB
    onError: (c) => c.text('overflow :(', 413),
  }),
  async (c) => {
    const body = await c.req.parseBody()
    return c.text('pass :)')
  }
)
```

### Timeout ミドルウェア

```typescript
import { timeout } from 'hono/timeout'
import { HTTPException } from 'hono/http-exception'

app.use('/api', timeout(5000))

// カスタムエラーハンドラ
const customTimeoutException = () =>
  new HTTPException(408, { message: 'Request timeout' })

app.use('/api/long-process', timeout(60000, customTimeoutException))
```

## テスト

### app.request() を使用する

```typescript
import { describe, test, expect } from 'vitest'

describe('Example', () => {
  test('GET /posts', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Many posts')
  })

  test('POST /posts with JSON', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello hono' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
  })
})
```

### 環境変数のモック

```typescript
const MOCK_ENV = {
  API_HOST: 'example.com',
  DB: { prepare: () => {} },
}

test('GET /posts', async () => {
  const res = await app.request('/posts', {}, MOCK_ENV)
})
```

## よくある落とし穴

### Content-Type ヘッダーを設定する

バリデーション時に適切な Content-Type ヘッダーが必要：

```typescript
// ✅ 正しい
const res = await app.request('/testing', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
  headers: new Headers({ 'Content-Type': 'application/json' }),
})
```

### ヘッダーバリデーションは小文字を使用する

```typescript
// ❌ 動作しない
const idempotencyKey = value['Idempotency-Key']

// ✅ 動作する
const idempotencyKey = value['idempotency-key']
```

### ミドルウェアの順序に注意する

```typescript
// secureHeaders が動作し、x-powered-by は削除される
app.use(secureHeaders())
app.use(poweredBy())

// poweredBy が動作し、x-powered-by は追加される
app.use(poweredBy())
app.use(secureHeaders())
```

### ESM インポートには .js 拡張子を使用する

Bun および Node.js ESM ではローカルインポートに明示的な `.js` 拡張子が必要：

```typescript
// ❌ 動作しない
import { db } from './lib/db'

// ✅ 正しい
import { db } from './lib/db.js'
```

### Strict モードの動作

デフォルトでは `/hello` と `/hello/` は異なるルート。両方を同じにする場合：

```typescript
const app = new Hono({ strict: false })
```

## 参考資料

- [Hono 公式ドキュメント](https://hono.dev/docs/)
- [Best Practices ガイド](https://hono.dev/docs/guides/best-practices)
- [RPC ガイド](https://hono.dev/docs/guides/rpc)
- [テストガイド](https://hono.dev/docs/guides/testing)
- [docs/best_practice/hono/official.md](../../../docs/best_practice/hono/official.md)
- [docs/best_practice/hono/community.md](../../../docs/best_practice/hono/community.md)
