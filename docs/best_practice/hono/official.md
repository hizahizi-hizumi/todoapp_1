# Hono 公式ベストプラクティス

Hono の公式ドキュメントから収集したベストプラクティスをまとめたドキュメントです。

## 概要

Hono（日本語で「炎🔥」の意）は、Web Standards 上に構築された小さく、シンプルで、超高速な Web フレームワークです。Cloudflare Workers、Fastly Compute、Deno、Bun、Vercel、Netlify、AWS Lambda、Lambda@Edge、Node.js など、あらゆる JavaScript ランタイムで動作します。

### 主要機能

- **超高速** 🚀 - `RegExpRouter` は非常に高速で、リニアループを使用しない
- **軽量** 🪶 - `hono/tiny` プリセットは 14KB 未満、ゼロ依存
- **マルチランタイム** 🌍 - 同じコードがすべてのプラットフォームで動作
- **バッテリー同梱** 🔋 - 組み込みミドルウェア、カスタムミドルウェア、サードパーティミドルウェア、ヘルパーを提供
- **優れた DX** 😃 - クリーンな API、ファーストクラスの TypeScript サポート

## 推奨設定

### 基本設定

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

export default app
```

### ルーターの選択

Hono には複数のルーターがあり、用途に応じて選択できます：

| ルーター | 特徴 | 推奨用途 |
|---------|------|----------|
| **SmartRouter**（デフォルト） | RegExpRouter と TrieRouter を組み合わせ | 一般的な用途 |
| **RegExpRouter** | JavaScript 世界最速、1つの大きな正規表現でマッチング | パフォーマンス重視 |
| **LinearRouter** | ルート登録が高速、ワンショット環境向け | リクエストごとに初期化する環境 |
| **PatternRouter** | 最小サイズ（15KB未満） | リソースが限られた環境 |

```typescript
import { RegExpRouter } from 'hono/router/reg-exp-router'

const app = new Hono({ router: new RegExpRouter() })
```

### Strict モード

デフォルトでは `strict: true` で、`/hello` と `/hello/` は異なるルートとして扱われます。両方を同じように扱う場合：

```typescript
const app = new Hono({ strict: false })
```

### 型付き環境変数とコンテキスト変数

```typescript
type Bindings = {
  TOKEN: string
}

type Variables = {
  user: User
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

## セキュリティ

### Secure Headers ミドルウェア

セキュリティヘッダーを簡単に設定できます。デフォルトで最適な設定が適用されます。

```typescript
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()
app.use(secureHeaders())
```

#### カスタマイズ例

```typescript
app.use(
  '*',
  secureHeaders({
    strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xXssProtection: '1',
  })
)
```

#### Content-Security-Policy の設定

```typescript
app.use(
  '/test',
  secureHeaders({
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

#### Nonce 属性の使用

```typescript
import { secureHeaders, NONCE } from 'hono/secure-headers'
import type { SecureHeadersVariables } from 'hono/secure-headers'

type Variables = SecureHeadersVariables

const app = new Hono<{ Variables: Variables }>()

app.get(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      scriptSrc: [NONCE, 'https://allowed.example.com'],
    },
  })
)

app.get('/', (c) => {
  return c.html(
    <html>
      <body>
        <script src='/js/client.js' nonce={c.get('secureHeadersNonce')} />
      </body>
    </html>
  )
})
```

### CORS ミドルウェア

```typescript
import { cors } from 'hono/cors'

const app = new Hono()

// CORS はルートの前に呼び出す
app.use('/api/*', cors())

// 詳細設定
app.use(
  '/api2/*',
  cors({
    origin: 'http://example.com',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)

// 複数オリジン
app.use(
  '/api3/*',
  cors({
    origin: ['https://example.com', 'https://example.org'],
  })
)

// 動的オリジン
app.use(
  '/api4/*',
  cors({
    origin: (origin, c) => {
      return origin.endsWith('.example.com') ? origin : 'http://example.com'
    },
  })
)
```

#### 環境依存の CORS 設定

```typescript
app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN,
  })
  return corsMiddlewareHandler(c, next)
})
```

#### Vite との併用

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: false, // Vite の CORS を無効化して Hono の CORS を使用
  },
})
```

### CSRF Protection

```typescript
import { csrf } from 'hono/csrf'

const app = new Hono()

// デフォルト：Origin と Sec-Fetch-Site の両方を検証
app.use(csrf())

// 特定のオリジンを許可
app.use(csrf({ origin: 'https://myapp.example.com' }))

// 動的オリジン検証（末尾マッチを推奨）
app.use(
  '*',
  csrf({
    origin: (origin) => /https:\/\/(\w+\.)?myapp\.example\.com$/.test(origin),
  })
)
```

> ⚠️ **注意**: `Origin` ヘッダーを送信しない古いブラウザや、リバースプロキシでヘッダーが削除される環境では正しく動作しない場合があります。

## パフォーマンス

### ルーター選択によるパフォーマンス最適化

- **通常用途**: デフォルトの SmartRouter を使用
- **高パフォーマンス要件**: RegExpRouter を明示的に指定
- **ワンショット環境**（リクエストごとに初期化）: LinearRouter を使用
- **最小サイズ優先**: PatternRouter を使用

### Body Limit ミドルウェア

リクエストボディのサイズを制限してメモリ使用量を抑制：

```typescript
import { bodyLimit } from 'hono/body-limit'

app.post(
  '/upload',
  bodyLimit({
    maxSize: 50 * 1024, // 50KB
    onError: (c) => {
      return c.text('overflow :(', 413)
    },
  }),
  async (c) => {
    const body = await c.req.parseBody()
    if (body['file'] instanceof File) {
      console.log(`Got file sized: ${body['file'].size}`)
    }
    return c.text('pass :)')
  }
)
```

#### Bun での大きなリクエスト

Bun のデフォルトは 128MiB です。より大きなファイルを受け付ける場合は Bun 側の設定も変更が必要：

```typescript
export default {
  port: process.env['PORT'] || 3000,
  fetch: app.fetch,
  maxRequestBodySize: 1024 * 1024 * 200, // 200MB
}
```

### Timeout ミドルウェア

```typescript
import { timeout } from 'hono/timeout'

// 5秒のタイムアウト
app.use('/api', timeout(5000))

// カスタムエラーハンドラ
import { HTTPException } from 'hono/http-exception'

const customTimeoutException = (context) =>
  new HTTPException(408, {
    message: `Request timeout after ${context.req.headers.get('Duration')} seconds.`,
  })

app.use('/api/long-process', timeout(60000, customTimeoutException))
```

> ⚠️ **注意**: Timeout ミドルウェアはストリーミングでは使用できません。ストリーミングには `stream.close` と `setTimeout` を組み合わせて使用してください。

## エラーハンドリング

### HTTPException の使用

```typescript
import { HTTPException } from 'hono/http-exception'

// シンプルなエラー
throw new HTTPException(401, { message: 'Unauthorized' })

// カスタムレスポンス
const errorResponse = new Response('Unauthorized', {
  status: 401,
  headers: {
    Authenticate: 'error="invalid_token"',
  },
})
throw new HTTPException(401, { res: errorResponse })

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
  return c.text('Custom Error Message', 500)
})
```

### Not Found ハンドリング

```typescript
app.notFound((c) => {
  return c.text('Custom 404 Message', 404)
})
```

> ⚠️ **注意**: `notFound` メソッドはトップレベルのアプリからのみ呼び出されます。

## バリデーション

### 手動バリデーション

```typescript
import { validator } from 'hono/validator'

app.post(
  '/posts',
  validator('form', (value, c) => {
    const body = value['body']
    if (!body || typeof body !== 'string') {
      return c.text('Invalid!', 400)
    }
    return { body }
  }),
  (c) => {
    const { body } = c.req.valid('form')
    return c.json({ message: 'Created!' }, 201)
  }
)
```

### Zod Validator ミドルウェア（推奨）

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const route = app.post(
  '/posts',
  zValidator(
    'form',
    z.object({
      body: z.string(),
    })
  ),
  (c) => {
    const validated = c.req.valid('form')
    // ...
  }
)
```

### 複数のバリデーター

```typescript
app.post(
  '/posts/:id',
  validator('param', ...),
  validator('query', ...),
  validator('json', ...),
  (c) => {
    // ...
  }
)
```

## よくある落とし穴

### 1. Controllers を作らない

❌ **避けるべきパターン**:

```typescript
// RoR ライクな Controller（型推論が効かない）
const bookPermalink = (c: Context) => {
  const id = c.req.param('id') // パスパラメータを推論できない
  return c.json(`get ${id}`)
}

app.get('/books/:id', bookPermalink)
```

✅ **推奨パターン**:

```typescript
// ハンドラを直接定義
app.get('/books/:id', (c) => {
  const id = c.req.param('id') // パスパラメータを推論できる
  return c.json(`get ${id}`)
})
```

Controller が必要な場合は `factory.createHandlers()` を使用：

```typescript
import { createFactory } from 'hono/factory'

const factory = createFactory()

const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo)
})

app.get('/api', ...handlers)
```

### 2. 大規模アプリケーションの構造化

`app.route()` を使用してアプリケーションを分割：

```typescript
// authors.ts
import { Hono } from 'hono'

const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create an author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

```typescript
// index.ts
import { Hono } from 'hono'
import authors from './authors'
import books from './books'

const app = new Hono()

const routes = app.route('/authors', authors).route('/books', books)

export default app
export type AppType = typeof routes
```

### 3. RPC 使用時の注意点

#### c.notFound() を使わない

❌ **避けるべき**:

```typescript
if (post === undefined) {
  return c.notFound() // クライアントで型推論できない
}
```

✅ **推奨**:

```typescript
if (post === undefined) {
  return c.json({ error: 'not found' }, 404) // ステータスコードを明示
}
return c.json({ post }, 200)
```

#### IDE パフォーマンスの改善

ルートが多いと IDE が遅くなる場合、コンパイル済みクライアントを使用：

```typescript
import { app } from './app'
import { hc } from 'hono/client'

export type Client = ReturnType<typeof hc<typeof app>>

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args)
```

### 4. バリデーション時の Content-Type ヘッダー

`json` や `form` をバリデーションする際、リクエストに適切な `Content-Type` ヘッダーが必要です。

❌ **テストで失敗するパターン**:

```typescript
const res = await app.request('/testing', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
})
```

✅ **正しいパターン**:

```typescript
const res = await app.request('/testing', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
  headers: new Headers({ 'Content-Type': 'application/json' }),
})
```

### 5. ヘッダーバリデーション時の小文字化

```typescript
// ❌ 動作しない
const idempotencyKey = value['Idempotency-Key']

// ✅ 動作する（小文字を使用）
const idempotencyKey = value['idempotency-key']
```

### 6. ミドルウェアの順序

ミドルウェアの順序が動作に影響します：

```typescript
// secureHeaders が動作し、x-powered-by は削除される
app.use(secureHeaders())
app.use(poweredBy())

// poweredBy が動作し、x-powered-by は追加される
app.use(poweredBy())
app.use(secureHeaders())
```

## テスト

### app.request() を使用したテスト

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
    expect(await res.json()).toEqual({ message: 'Created' })
  })
})
```

### 環境変数のモック

```typescript
const MOCK_ENV = {
  API_HOST: 'example.com',
  DB: {
    prepare: () => { /* mocked D1 */ },
  },
}

test('GET /posts', async () => {
  const res = await app.request('/posts', {}, MOCK_ENV)
})
```

## 参考リンク

- [公式ドキュメント](https://hono.dev/docs/)
- [ベストプラクティス](https://hono.dev/docs/guides/best-practices)
- [ミドルウェア一覧](https://hono.dev/docs/middleware/builtin/basic-auth)
- [RPC ガイド](https://hono.dev/docs/guides/rpc)
- [テストガイド](https://hono.dev/docs/guides/testing)
- [バリデーションガイド](https://hono.dev/docs/guides/validation)
- [GitHub Discussions](https://github.com/orgs/honojs/discussions)
