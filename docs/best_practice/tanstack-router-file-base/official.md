## 概要

TanStack Router は、React アプリケーション向けの完全型安全なルーティングライブラリです。ファイルベースルーティングは、ファイルシステムの構造に基づいて自動的にルート定義を生成する機能で、開発者の生産性と保守性を大幅に向上させます。

TanStack Router のファイルベースルーティングは、フラットおよびネスト構造の両方をサポートし、自動コード分割、型安全性、パフォーマンス最適化を実現します。

## ファイルベースルーティングの基本

### ディレクトリ構造とルート定義

TanStack Router は、`src/routes` ディレクトリ内のファイル構造に基づいてルートツリーを自動生成します。

```typescript
// tsr.config.json での基本設定
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts"
}
```

### ファイル命名規則

TanStack Router は以下のトークンを使用してルートファイルを識別します：

- **routeToken**: レイアウトルートを識別（デフォルト: `route`）
- **indexToken**: インデックスルートを識別（デフォルト: `index`）

```
src/routes/
├── posts.tsx              -> /posts
├── posts.route.tsx        -> /posts (同じルート)
├── posts/route.tsx        -> /posts (同じルート)
├── posts.index.tsx        -> /posts/ (インデックス)
└── posts/index.tsx        -> /posts/ (インデックス)
```

### ルートファイルの作成

ファイルベースルーティングでは `createFileRoute` を使用してルートを定義します：

```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
  component: Posts,
})

function Posts() {
  const posts = Route.useLoaderData()
  return <div>{/* レンダリングロジック */}</div>
}
```

## コード分割戦略

### 自動コード分割（推奨）✨

TanStack Router は、サポートされているバンドラープラグインと組み合わせることで、自動コード分割機能を提供します。

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true, // 自動コード分割を有効化
    }),
    react(),
  ],
})
```

**重要な注意点**：
- 自動コード分割機能は、サポートされているバンドラープラグインでのみ利用可能
- CLI のみ（`@tanstack/router-cli`）では動作しない
- 次期メジャーリリース（v2）では、デフォルトで有効になる予定

### クリティカルおよび非クリティカルなルート設定

TanStack Router は、ルート設定を 2 つのカテゴリに分類します：

**クリティカルなルート設定**（即座に必要）：
- パスのパース/シリアライゼーション
- 検索パラメータのバリデーション
- ローダー、beforeLoad
- ルートコンテキスト
- 静的データ
- リンク、スクリプト、スタイル

**非クリティカルなルート設定**（遅延読み込み可能）：
- ルートコンポーネント
- エラーコンポーネント
- ペンディングコンポーネント
- 404 コンポーネント

### .lazy.tsx サフィックスによるコード分割

自動コード分割が利用できない場合は、`.lazy.tsx` サフィックスを使用して手動でコード分割を行います。

**分割前（単一ファイル）**：

```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
  component: Posts,
})

function Posts() {
  // ...
}
```

**分割後（2 ファイル）**：

クリティカルなルート設定：

```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
})
```

非クリティカルなルート設定：

```typescript
// src/routes/posts.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts')({
  component: Posts,
})

function Posts() {
  // ...
}
```

**重要な制限事項**：
- `__root.tsx` ルートファイルはコード分割をサポートしていない（常にレンダリングされるため）
- `createLazyFileRoute` では以下のオプションのみサポート：
  - `component`
  - `errorComponent`
  - `pendingComponent`
  - `notFoundComponent`

### 仮想ルート（Virtual Routes）

すべてのコードを分割して元のルートファイルが空になった場合、そのファイルを削除できます。仮想ルートが自動的に生成されます。

```typescript
// src/routes/posts.lazy.tsx のみ存在
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts')({
  component: Posts,
})

function Posts() {
  // ...
}
```

## ルート構成とファイル組織

### ディレクトリへのルートファイルのカプセル化

TanStack Router は、フラットおよびネスト構造の両方をサポートしているため、関連ファイルを単一のディレクトリにカプセル化できます。

**変更前**：
```
src/routes/
└── posts.tsx
```

**変更後**：
```
src/routes/
└── posts/
    ├── route.tsx
    ├── -components/  # 無視される（- プレフィックス）
    │   └── Post.tsx
    └── index.tsx
```

### ファイル無視パターン

特定のファイルやディレクトリをルーティングから除外するための設定：

```typescript
// tsr.config.json
{
  "routeFileIgnorePrefix": "-",          // - で始まるファイル/ディレクトリを無視
  "routeFileIgnorePattern": ".((css|const).ts)|test-page"  // 正規表現パターンで無視
}
```

**例**：
```
src/routes/
├── posts/
│   ├── -components/     # 無視される
│   ├── -utils/          # 無視される
│   ├── index.tsx        # ルートとして認識
│   └── route.tsx        # ルートとして認識
```

## 型安全性の確保

### getRouteApi ヘルパーの使用

別ファイルでルート API に型安全にアクセスするために `getRouteApi` を使用します：

**ルート定義**：

```typescript
// my-route.tsx
import { createRoute } from '@tanstack/react-router'
import { MyComponent } from './MyComponent'

const route = createRoute({
  path: '/my-route',
  loader: () => ({
    foo: 'bar',
  }),
  component: MyComponent,
})
```

**コンポーネントファイル**：

```typescript
// MyComponent.tsx
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/my-route')

export function MyComponent() {
  const loaderData = route.useLoaderData()
  //    ^? { foo: string }
  
  return <div>...</div>
}
```

`getRouteApi` で利用可能な型安全 API：
- `useLoaderData`
- `useLoaderDeps`
- `useMatch`
- `useParams`
- `useRouteContext`
- `useSearch`

## パフォーマンス最適化

### コード分割のベネフィット

- 初期ページロード時に必要なコード量を削減
- コードはオンデマンドで必要なときにのみ読み込まれる
- より小さなチャンクに分割され、ブラウザでキャッシュしやすくなる

### データローダーの分割に関する注意

**⚠️ 警告**：ローダーの分割は慎重に行う必要があります。

ローダーは通常分割しない理由：
- ローダーはすでに非同期境界であり、チャンク取得とローダー実行の二重コストが発生
- コンポーネントに比べて大きなバンドルサイズへの寄与が少ない
- ローダーはプリロード可能な最も重要な資産の 1 つであり、非同期オーバーヘッドなしで利用可能であることが重要

それでもローダーを分割する場合：

```typescript
import { lazyFn } from '@tanstack/react-router'

const route = createRoute({
  path: '/my-route',
  component: MyComponent,
  loader: lazyFn(() => import('./loader'), 'loader'),
})

// 別ファイル
export const loader = async (context: LoaderContext) => {
  // ...
}
```

## API 設定オプション

### 主要な設定オプション

```typescript
// tsr.config.json
{
  "routesDirectory": "./src/routes",              // 必須: ルートファイルのディレクトリ
  "generatedRouteTree": "./src/routeTree.gen.ts", // 必須: 生成されるルートツリーファイル
  "routeFilePrefix": "",                          // ルートファイルのプレフィックス
  "routeFileIgnorePrefix": "-",                   // 無視するファイルのプレフィックス
  "routeFileIgnorePattern": undefined,            // 無視するファイルの正規表現パターン
  "routeToken": "route",                          // レイアウトルートのトークン
  "indexToken": "index",                          // インデックスルートのトークン
  "quoteStyle": "single",                         // 引用符のスタイル
  "semicolons": false,                            // セミコロンの使用
  "autoCodeSplitting": false,                     // 自動コード分割（バンドラープラグイン必須）
  "disableTypes": false,                          // 型生成を無効化
  "addExtensions": false,                         // ファイル拡張子を追加
  "disableLogging": false,                        // ログ出力を無効化
  "routeTreeFileHeader": [                        // 生成ファイルのヘッダー
    "/* eslint-disable */",
    "// @ts-nocheck",
    "// noinspection JSUnusedGlobalSymbols"
  ],
  "routeTreeFileFooter": [],                      // 生成ファイルのフッター
  "enableRouteTreeFormatting": true,              // ルートツリーのフォーマットを有効化
  "tmpDir": undefined                             // 一時ディレクトリ
}
```

### 正規表現トークンの使用

より柔軟なファイル命名規則を実現するために、正規表現パターンを使用できます：

```json
{
  "routeToken": { "regex": "[a-z]+-layout", "flags": "i" },
  "indexToken": { "regex": "[a-z]+-page" }
}
```

**例**：
- `dashboard.main-layout.tsx` → レイアウトルートとして認識
- `posts.protected-layout.tsx` → レイアウトルートとして認識
- `home-page.tsx` → インデックスルートとして認識

## よくある落とし穴

### 1. ルートトークンの設定ミス

**問題**：`routeFilePrefix`、`routeFileIgnorePrefix`、`routeFileIgnorePattern` を、ファイル命名規則のトークン（`route`、`index` など）と一致するように設定すると、予期しない動作が発生します。

**解決策**：これらのオプションは、トークンと重複しないように設定してください。

### 2. CLI のみでの自動コード分割の使用

**問題**：`@tanstack/router-cli` のみを使用している場合、`autoCodeSplitting` は動作しません。

**解決策**：サポートされているバンドラープラグイン（Vite、Webpack、Rspack など）と組み合わせて使用してください。

### 3. ルートルートのコード分割

**問題**：`__root.tsx` ルートファイルは常にレンダリングされるため、コード分割をサポートしていません。

**解決策**：ルートルートはそのままにして、他のルートのみコード分割を適用してください。

### 4. ローダーの過剰な分割

**問題**：ローダーを安易に分割すると、パフォーマンスが低下する可能性があります。

**解決策**：ローダーの分割は、明確なパフォーマンス上の利点がある場合のみ行ってください。通常、コンポーネントの分割に集中することをお勧めします。

### 5. 生成ファイルのフォーマット衝突

**問題**：リンターやフォーマッターが生成されたルートツリーファイル（`routeTree.gen.ts`）を自動修正すると、設定との衝突が発生する可能性があります。

**解決策**：生成されたルートツリーファイルをリンターとフォーマッターの無視リストに追加してください。

```json
// .prettierignore または .eslintignore
src/routeTree.gen.ts
```

## 推奨されるプロジェクト構造

### 小規模プロジェクト（フラット構造）

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── about.tsx
│   ├── posts.tsx
│   ├── posts.index.tsx
│   ├── posts.$postId.tsx
│   └── posts.$postId.edit.tsx
├── routeTree.gen.ts
└── main.tsx
```

### 中規模〜大規模プロジェクト（ネスト構造）

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── about/
│   │   └── route.tsx
│   ├── posts/
│   │   ├── route.tsx
│   │   ├── index.tsx
│   │   ├── $postId/
│   │   │   ├── route.tsx
│   │   │   ├── index.tsx
│   │   │   └── edit.tsx
│   │   └── -components/
│   │       └── PostCard.tsx
│   └── dashboard/
│       ├── route.tsx
│       ├── index.tsx
│       ├── settings/
│       │   └── route.tsx
│       └── -utils/
│           └── helpers.ts
├── routeTree.gen.ts
└── main.tsx
```

## 参考リンク

- [TanStack Router - File-Based Routing](https://tanstack.com/router/v1/docs/framework/react/routing/file-based-routing)
- [TanStack Router - Code Splitting](https://tanstack.com/router/v1/docs/framework/react/guide/code-splitting)
- [TanStack Router - File-Based Routing API Reference](https://tanstack.com/router/v1/docs/api/file-based-routing)
- [TanStack Router - Automatic Code Splitting](https://tanstack.com/router/v1/docs/framework/react/guide/automatic-code-splitting)
- [TanStack Router - File Naming Conventions](https://tanstack.com/router/v1/docs/framework/react/routing/file-naming-conventions)
- [TanStack Router - Type Safety](https://tanstack.com/router/v1/docs/framework/react/guide/type-safety)
