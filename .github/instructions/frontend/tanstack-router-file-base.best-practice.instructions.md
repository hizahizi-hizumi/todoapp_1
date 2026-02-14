---
description: 'TanStack Router のファイルベースルーティングを使用した型安全で保守性の高い React アプリケーション開発のベストプラクティス'
applyTo: 'src/routes/**/*.{ts,tsx}, tsr.config.json, vite.config.ts'
---

# TanStack Router ファイルベースルーティング ベストプラクティス

TanStack Router のファイルベースルーティングを使用して、型安全で保守性が高く、パフォーマンスに優れた React アプリケーションを構築するための包括的ガイド。

## 目的とスコープ

このドキュメントは、TanStack Router のファイルベースルーティング機能を使用する際のコーディング規約、設計パターン、型安全性の確保、パフォーマンス最適化の手法を定義します。公式ドキュメントの推奨事項とコミュニティの実践的な知見を統合し、本番環境で実証されたベストプラクティスを提供します。

## 基本原則

- ファイルシステムの構造がそのまま URL 構造になる（明示的で理解しやすい）
- すべてのルートとナビゲーションは完全に型安全である
- データローディングは適切なレベル（ローダー vs クエリ）で実行する
- すべての重要な UI 状態は URL で表現可能にする（共有・リロード可能）

## セットアップと設定

### Vite プラグインの設定

Vite プロジェクトでは、`@tanstack/router-plugin` を使用して自動ルート生成を有効化する。

**推奨**:
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
```

**重要な注意点**：
- プラグインの順序：`TanStackRouterVite()` は `react()` の**前に**配置する
  **根拠**: ルート生成が React のトランスフォーム前に実行される必要があるため

**非推奨**:
```typescript
// ❌ プラグインの順序が逆
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(), // これでは正しく動作しない
  ],
})
```

### tsr.config.json の設定

プロジェクトルートに `tsr.config.json` を配置して、ルート生成の動作をカスタマイズする。

**推奨**:
```json
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts",
  "routeFileIgnorePrefix": "-",
  "routeToken": "route",
  "indexToken": "index",
  "quoteStyle": "single",
  "semicolons": false,
  "autoCodeSplitting": false,
  "enableRouteTreeFormatting": true
}
```

**重要な設定項目**：
- `routeFileIgnorePrefix`: プライベートなファイル/ディレクトリに使用するプレフィックス（デフォルト: `-`）
  **根拠**: コンポーネント、ユーティリティ、テストファイルをルート定義から分離するため
- `autoCodeSplitting`: バンドラープラグイン使用時のみ有効（CLI のみでは動作しない）

### Git と無視設定

**推奨**:
```gitignore
# .gitignore
src/routeTree.gen.ts
```

```json
// .prettierignore / .eslintignore
src/routeTree.gen.ts
```

**根拠**: 自動生成ファイルはビルド時に常に再生成されるため、バージョン管理とコードレビューの対象から除外する

## ファイル命名規則とディレクトリ構造

### 基本的なファイルトークン

TanStack Router は以下のトークンでルートファイルを識別する：

- `__root.tsx`: ルートレイアウト（必須、常にレンダリングされる）
- `index.tsx`: そのディレクトリのインデックスルート
- `route.tsx`: レイアウトルート（ディレクトリをグループ化する場合）
- `$paramName.tsx`: 動的パラメータ
- `_folderName/`: レイアウトルート（URL パスには影響しない）
- `-prefix/`: ルーティングから無視されるファイル/ディレクトリ

### 推奨ディレクトリ構造（小規模プロジェクト）

**推奨**:
```
src/
├── routes/
│   ├── __root.tsx          # ルートレイアウト（必須）
│   ├── index.tsx           # / パス
│   ├── about.tsx           # /about パス
│   ├── posts.tsx           # /posts パス
│   ├── posts.index.tsx     # /posts パス（インデックス）
│   ├── posts.$postId.tsx   # /posts/:postId パス
│   └── posts.$postId.edit.tsx  # /posts/:postId/edit パス
├── routeTree.gen.ts        # 自動生成（編集しない）
└── main.tsx
```

**根拠**: フラット構造は小規模プロジェクトで見通しが良く、ファイル名から URL が明確に分かる

### 推奨ディレクトリ構造（中規模〜大規模プロジェクト）

**推奨**:
```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── about/
│   │   └── route.tsx       # /about パス
│   ├── posts/
│   │   ├── route.tsx       # /posts レイアウト
│   │   ├── index.tsx       # /posts パス
│   │   ├── $postId/
│   │   │   ├── route.tsx   # /posts/:postId レイアウト
│   │   │   ├── index.tsx   # /posts/:postId パス
│   │   │   └── edit.tsx    # /posts/:postId/edit パス
│   │   └── -components/    # posts 配下専用コンポーネント
│   │       ├── PostCard.tsx
│   │       └── PostList.tsx
│   └── _auth/              # レイアウトルート（URL に現れない）
│       ├── route.tsx       # 認証レイアウト
│       ├── login.tsx       # /login パス
│       └── register.tsx    # /register パス
├── routeTree.gen.ts
└── main.tsx
```

**根拠**: 
- ネスト構造は関連ファイルをディレクトリにカプセル化できる
- `-components/` のようなプレフィックスでルーティングから除外されたディレクトリに、ルート固有のコンポーネントを配置できる
- 垂直分割により、各ページが動作に必要なすべてを含む

### ファイル配置の原則

**コロケーション（関連コードの近接配置）**:
- 関連するコンポーネント、フック、ユーティリティは階層の最も近い共有スペースに配置する
- 長い相対パスインポート（`../../../`）は設計の問題を示す
  **根拠**: コードの理解と保守が難しくなるため

**推奨**:
```
src/routes/
├── posts/
│   ├── -components/        # posts ルート配下で共有
│   │   ├── PostCard.tsx
│   │   └── PostList.tsx
│   ├── -hooks/             # posts ルート配下で共有
│   │   └── usePostData.ts
│   ├── index.tsx
│   └── $postId.tsx
```

**非推奨**:
```typescript
// posts/index.tsx
import { PostCard } from '../../../components/posts/PostCard'  // ❌ 長い相対パス
```

## ルート定義とコンポーネント作成

### createFileRoute の使用

ファイルベースルーティングでは `createFileRoute` を使用してルートを定義する。

**推奨**:
```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: async () => {
    return { posts: await fetchPosts() }
  },
  component: PostsComponent,
})

function PostsComponent() {
  const { posts } = Route.useLoaderData()
  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

**重要な注意点**：
- エクスポート名は必ず `Route` にする（TanStack Router の規約）
- `createFileRoute` の引数には実際の URL パスを文字列で渡す（型推論に使用される）
- コンポーネント関数は同じファイル内で定義するか、別ファイルからインポートする

### ルートパスの指定

**推奨**:
```typescript
// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailComponent,
})
```

**非推奨**:
```typescript
// ❌ パスが間違っている
export const Route = createFileRoute('/posts/:postId')({  // コロン記法は使わない
  component: PostDetailComponent,
})
```

**根拠**: ファイル名と一致する `$paramName` 形式を使用することで、型推論が正しく動作する

### ルートコンポーネント内での型安全な API 使用

**推奨**:
```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return { post: await fetchPost(params.postId) }
  },
  component: PostDetailComponent,
})

function PostDetailComponent() {
  const { post } = Route.useLoaderData()
  const { postId } = Route.useParams()
  return <article>{post.title}</article>
}
```

**根拠**: `Route.useLoaderData()` や `Route.useParams()` を使用することで、完全な型安全性が保証される

### 別ファイルでのルート API 使用（getRouteApi）

コンポーネントを別ファイルに分割する場合は `getRouteApi` を使用する。

**推奨**:
```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { PostDetailComponent } from './-components/PostDetail'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return { post: await fetchPost(params.postId) }
  },
  component: PostDetailComponent,
})

// src/routes/posts/-components/PostDetail.tsx
import { getRouteApi } from '@tanstack/react-router'

const route = getRouteApi('/posts/$postId')

export function PostDetailComponent() {
  const { post } = route.useLoaderData()
  const { postId } = route.useParams()
  return <article>{post.title}</article>
}
```

**重要な注意点**：
- `getRouteApi` には実際の URL パス文字列を渡す（ファイル名ではない）
- 利用可能な API: `useLoaderData`, `useLoaderDeps`, `useMatch`, `useParams`, `useRouteContext`, `useSearch`

## データローディング戦略

### ローダーとクエリの使い分け（本番環境実証済み）

**ルール 1: ページ全体で必要なデータはローダーを使用**

**推奨**:
```typescript
// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
  component: PostComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  // ローディング状態を処理する必要なし（ルーターが管理）
  return <article>{post.title}</article>
}
```

**根拠**: ページ全体に必要なデータはルーターレベルで管理することで、ローディング状態が一元化され、サスペンス対応が容易になる

**ルール 2: 単一コンポーネントで使用するデータはサスペンスクエリを使用**

**推奨**:
```typescript
function CommentSection({ postId }: { postId: string }) {
  // ルーターが調整を処理、ローディング/エラー状態は不要
  const { data: comments } = useSuspenseQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  })
  
  return (
    <div>
      {comments.map(c => (
        <Comment key={c.id} {...c} />
      ))}
    </div>
  )
}
```

**根拠**: コンポーネントレベルのデータはそのコンポーネント内で管理することで、コードの凝集度が高まる

**ルール 3: インタラクションに依存するデータは通常のクエリを使用**

**推奨**:
```typescript
function SearchBox() {
  const [search, setSearch] = useState('')
  
  // ローディング/エラー状態を自分で処理
  const { data, isLoading, error } = useQuery({
    queryKey: ['search', search],
    queryFn: () => searchPosts(search),
    enabled: search.length > 0,
  })
  
  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      {isLoading && <Spinner />}
      {error && <Error />}
      {data && <Results data={data} />}
    </>
  )
}
```

**根拠**: ユーザーインタラクションに応じてトリガーされるデータ取得は、明示的なローディング状態の管理が必要

**ルール 4: ローダーとクエリでコードを共有**

**推奨**:
```typescript
// shared-queries.ts
export const postQueryOptions = (postId: string) => ({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
})

// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, context }) => {
    return context.queryClient.ensureQueryData(
      postQueryOptions(params.postId)
    )
  },
})

// コンポーネント内でも同じクエリを使用
function PostDetail({ postId }: { postId: string }) {
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  return <article>{data.title}</article>
}
```

**根拠**: クエリ定義を共有することで、キャッシュが一貫性を持ち、重複リクエストを防げる

### ローダーでの並列データ取得

**推奨**:
```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    const [user, posts, stats] = await Promise.all([
      context.queryClient.ensureQueryData(userQueryOptions()),
      context.queryClient.ensureQueryData(postsQueryOptions()),
      context.queryClient.ensureQueryData(statsQueryOptions()),
    ])
    return { user, posts, stats }
  },
})
```

**根拠**: 複数のデータ取得を並列化することで、初期ロード時間を最小化できる

### ローダーの分割に関する注意

**⚠️ 警告**: ローダーの分割は慎重に行う必要がある。

**非推奨**（通常）:
```typescript
import { lazyFn } from '@tanstack/react-router'

const route = createRoute({
  path: '/my-route',
  loader: lazyFn(() => import('./loader'), 'loader'),  // ❌ 通常は推奨しない
})
```

**根拠**:
- ローダーはすでに非同期境界であり、チャンク取得とローダー実行の二重コストが発生する
- コンポーネントに比べてバンドルサイズへの寄与が少ない
- ローダーはプリロード可能な最も重要な資産の 1 つであり、非同期オーバーヘッドなしで利用可能であることが重要

ローダーを分割するのは、明確なパフォーマンス上の利点がある場合のみにする。

## コード分割とパフォーマンス最適化

### 自動コード分割（推奨）✨

バンドラープラグインを使用している場合、自動コード分割を有効化する。

**推奨**:
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,  // 自動コード分割を有効化
    }),
    react(),
  ],
})
```

**根拠**: 初期ページロード時に必要なコード量が削減され、コードはオンデマンドで必要なときにのみ読み込まれる

**注意**: バンドラープラグイン使用時のみ有効（詳細は「セットアップと設定」を参照）

### 手動コード分割（.lazy.tsx サフィックス）

自動コード分割が利用できない場合、`.lazy.tsx` サフィックスを使用して手動でコード分割を行う。

**変更前（単一ファイル）**:
```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
  component: Posts,
  errorComponent: PostsError,
  pendingComponent: PostsPending,
})

function Posts() { /* ... */ }
function PostsError() { /* ... */ }
function PostsPending() { /* ... */ }
```

**変更後（クリティカルと非クリティカルに分割）**:

クリティカルなルート設定（即座に必要）:
```typescript
// src/routes/posts.tsx
import { createFileRoute } from '@tanstack/react-router'
import { fetchPosts } from './api'

export const Route = createFileRoute('/posts')({
  loader: fetchPosts,  // クリティカル（プリロード可能）
})
```

非クリティカルなルート設定（遅延読み込み可能）:
```typescript
// src/routes/posts.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts')({
  component: Posts,
  errorComponent: PostsError,
  pendingComponent: PostsPending,
})

function Posts() { /* ... */ }
function PostsError() { /* ... */ }
function PostsPending() { /* ... */ }
```

**重要な制限事項**：
- `__root.tsx` ルートファイルはコード分割をサポートしていない（常にレンダリングされるため）
- `createLazyFileRoute` では `component`、`errorComponent`、`pendingComponent`、`notFoundComponent` のみサポート
- ローダーの分割は推奨されない（詳細は「データローディング戦略 > ローダーの分割に関する注意」を参照）

### 仮想ルート

すべてのコードを分割して元のルートファイルが空になった場合、そのファイルを削除できる（仮想ルートが自動生成される）。

**推奨**:
```typescript
// src/routes/posts.lazy.tsx のみ存在（posts.tsx は不要）
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts')({
  component: Posts,
})

function Posts() { /* ... */ }
```

**根拠**: クリティカルなルート設定が不要な場合、ファイルを削減してプロジェクト構造をシンプルに保てる

### プリロードによる体感速度の向上

**推奨**:
```typescript
import { Link } from '@tanstack/react-router'

<Link 
  to="/posts/$postId" 
  params={{ postId: '123' }}
  preload="intent"  // ホバー時にプリロード
>
  投稿を見る
</Link>
```

**利用可能な preload オプション**：
- `"intent"`: ホバー時にプリロード（推奨）
- `"render"`: レンダリング時にプリロード
- `false`: プリロードしない

**根拠**: ユーザーがリンクをクリックする前にルートをプリロードすることで、ナビゲーションが瞬時に感じられる

### ペンディング時間の調整

**推奨**:
```typescript
export const Route = createFileRoute('/posts')({
  component: Posts,
  pendingMs: 200,  // デフォルトの 500ms から短縮
})
```

**根拠**: ペンディング UI の表示遅延を調整することで、速いネットワークでのチラツキを防ぎ、遅いネットワークでは適切なフィードバックを提供できる

## 型安全なナビゲーション

### Link コンポーネントの使用

**推奨**:
```typescript
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <>
      {/* ✅ 正しい：型チェックされる */}
      <Link to="/posts/$postId" params={{ postId: '123' }}>
        投稿を見る
      </Link>
      
      {/* ✅ 正しい：検索パラメータも型安全 */}
      <Link 
        to="/posts" 
        search={{ filter: 'recent', page: 1 }}
      >
        最近の投稿
      </Link>
    </>
  )
}
```

**非推奨**:
```typescript
// ❌ エラー：存在しないパス
<Link to="/non-existent-route">リンク</Link>

// ❌ エラー：必須パラメータが不足
<Link to="/posts/$postId">リンク</Link>

// ❌ エラー：型が合わない検索パラメータ
<Link 
  to="/posts" 
  search={{ page: "1" }}  // number が期待されるが string
>
```

**根拠**: TypeScript の型チェックにより、存在しないルートへのリンクやパラメータの誤りをコンパイル時に検出できる

### useNavigate によるプログラマティックナビゲーション

**推奨**:
```typescript
import { useNavigate } from '@tanstack/react-router'

function MyComponent() {
  const navigate = useNavigate()
  
  const handleClick = () => {
    navigate({
      to: '/posts/$postId',
      params: { postId: '123' },
      search: { from: 'home' },
    })
  }
  
  return <button onClick={handleClick}>投稿を見る</button>
}
```

**根拠**: `useNavigate` も完全に型安全であり、パラメータや検索パラメータの誤りを防げる

## 検索パラメータのバリデーション

### Zod を使用した検索パラメータの型安全性

**推奨**:
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const postsSearchSchema = z.object({
  page: z.number().int().positive().catch(1),
  filter: z.enum(['recent', 'popular', 'trending']).catch('recent'),
  sortBy: z.enum(['date', 'title', 'author']).optional(),
})

export const Route = createFileRoute('/posts')({
  validateSearch: postsSearchSchema,
  component: PostsComponent,
})

function PostsComponent() {
  const { page, filter, sortBy } = Route.useSearch()
  return <div>Page: {page}, Filter: {filter}</div>
}
```

**根拠**: Zod バリデーションにより、URL の検索パラメータが常に期待される型と形式になり、ランタイムエラーを防げる

**非推奨**:
```typescript
// ❌ バリデーションなし（型安全性が失われる）
export const Route = createFileRoute('/posts')({
  component: PostsComponent,
})

function PostsComponent() {
  const search = Route.useSearch()
}
```

## レイアウトとネストルート

### レイアウトルートの使用

**推奨**:
```typescript
// src/routes/_auth/route.tsx（レイアウトルート）
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="auth-container">
      <header>認証ページ</header>
      <main>
        <Outlet />  {/* 子ルートがここにレンダリング */}
      </main>
      <footer>フッター</footer>
    </div>
  )
}

// src/routes/_auth/login.tsx
export const Route = createFileRoute('/_auth/login')({
  component: () => <div>ログインフォーム</div>,
})
```

**根拠**: 
- `_folderName/` で始まるディレクトリは URL パスに影響せず、レイアウトのみを提供する
- 複数のページで共通のレイアウトを共有する場合に有効
- `/login` のような URL になるが、認証ページのレイアウトが適用される

### Outlet の配置

**推奨**:
```typescript
// 親ルート
import { Outlet } from '@tanstack/react-router'

function ParentComponent() {
  return (
    <div>
      <h1>親コンテンツ</h1>
      <Outlet />  {/* 子ルートはここにレンダリング */}
    </div>
  )
}
```

**非推奨**:
```typescript
// ❌ Outlet がない
function ParentComponent() {
  return (
    <div>
      <h1>親コンテンツ</h1>
      {/* Outlet がないため、子ルートがレンダリングされない */}
    </div>
  )
}
```

**根拠**: ネストルートでは、親コンポーネントに `<Outlet />` を配置しないと子ルートがレンダリングされない

## URL 設計とユーザー体験

### すべての重要な UI 状態に URL を割り当てる（本番環境実証済み）

**推奨**:
```typescript
// モーダルの状態も URL に反映
<Link 
  to="/posts" 
  search={{ modal: 'create' }}
>
  新規作成
</Link>

function PostsComponent() {
  const { modal } = Route.useSearch()
  
  return (
    <>
      <PostsList />
      {modal === 'create' && <CreatePostModal />}
    </>
  )
}
```

**非推奨**:
```typescript
// ❌ モーダルの状態がローカル（共有不可、リロードで消える）
const [isOpen, setIsOpen] = useState(false)
```

**根拠**: 
- URL で状態を管理することで、リンクを共有すると同じものが表示される
- ブラウザバック/フォワードで状態が復元される
- ページリロード（Cmd+R）で状態が失われない

### URL は独立している

**原則**:
- ページ間の状態はパフォーマンスのためだけに使用する
- リロードで常に再構築可能にする
- リンクを共有すると、同じものが表示されるようにする

**推奨**:
```typescript
// ローダーで必要なデータをすべて取得
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
})
```

**非推奨**:
```typescript
// ❌ ナビゲーション時の状態に依存（リロードで壊れる）
navigate({
  to: '/posts/$postId',
  params: { postId: '123' },
  state: { post: somePost },  // state に依存しない
})
```

## よくある落とし穴と解決策

### 1. ルートが生成されない

**症状**: `routeTree.gen.ts` が生成されない、または更新されない

**解決策**:
- Vite プラグインが正しく設定されているか確認
- プラグインの順序を確認（`TanStackRouterVite()` が `react()` の前）
- 開発サーバーを再起動

```bash
# キャッシュをクリアして再起動
rm -rf node_modules/.vite
bun run dev
```

### 2. ネストルートが動作しない

**症状**: ネストされたルートが正しくマッチしない

**解決策**:
- 親ルートに `<Outlet />` コンポーネントが配置されているか確認
- ファイル命名規則を確認（`index.tsx` vs `route.tsx`）

### 3. 型エラー：ルートが見つからない

**症状**: 存在するルートにリンクしているのに型エラーが発生

**解決策**:
- `routeTree.gen.ts` が最新か確認
- TypeScript サーバーを再起動
- プロジェクトを再ビルド

```bash
# TypeScript 型を再生成
bun run build
```

### 4. HMR が動作しない

**症状**: `__root.tsx` やコンポーネントを編集しても HMR がトリガーされない

**解決策**:
- Vite プラグインのバージョンを確認（最新版にアップデート）
- 開発サーバーを再起動
- 既知の問題を GitHub で確認

### 5. ルートトークンの設定ミス

**問題**: `routeFilePrefix`、`routeFileIgnorePrefix`、`routeFileIgnorePattern` を、ファイル命名規則のトークン（`route`、`index` など）と一致するように設定すると、予期しない動作が発生する

**解決策**: これらのオプションは、トークンと重複しないように設定する

### 6. CLI のみでの自動コード分割の使用

**問題**: `@tanstack/router-cli` のみを使用している場合、`autoCodeSplitting` は動作しない

**解決策**: サポートされているバンドラープラグイン（Vite、Webpack、Rspack など）と組み合わせて使用する

### 7. ルートルートのコード分割

**問題**: `__root.tsx` ルートファイルは常にレンダリングされるため、コード分割をサポートしていない

**解決策**: ルートルートはそのままにして、他のルートのみコード分割を適用する

### 8. 生成ファイルのフォーマット衝突

**問題**: リンターやフォーマッターが `routeTree.gen.ts` を自動修正すると衝突が発生する

**解決策**: 「セットアップと設定 > Git と無視設定」を参照し、無視リストに追加する

## チーム開発での運用

### コーディング規約

**ファイル命名**:
- 一貫した命名規則を使用（kebab-case 推奨）
- `index.tsx` はそのパスのメインページを表す
- `route.tsx` はレイアウトコンポーネントを表す
- コンポーネント名は PascalCase を使用

**ディレクトリ構造**:
- 機能ごとにグループ化
- 共有コンポーネントは適切なレベルに配置
- プライベートコンポーネントには `-` プレフィックスを使用

### レビューのポイント

コードレビュー時に確認すべき項目：

- [ ] ルート構造が URL 構造と一致しているか
- [ ] データローディングが適切なレベル（loader vs query）で行われているか
- [ ] 型安全性が保たれているか（`any` の使用は最小限か）
- [ ] 不要な相対パスインポート（`../../../`）がないか
- [ ] コンポーネントが適切なレベルに配置されているか
- [ ] 検索パラメータがバリデーションされているか
- [ ] 重要な UI 状態が URL で表現されているか

### デバッグのベストプラクティス

**TanStack Router DevTools を使用**:
```typescript
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <TanStackRouterDevtools router={router} />
    </>
  )
}
```

**根拠**: DevTools により、現在のルート、パラメータ、検索パラメータ、ローダーデータをリアルタイムで確認できる

## 参考リソース

### 公式ドキュメント
- [TanStack Router - File-Based Routing](https://tanstack.com/router/v1/docs/framework/react/routing/file-based-routing)
- [TanStack Router - Code Splitting](https://tanstack.com/router/v1/docs/framework/react/guide/code-splitting)
- [TanStack Router - Type Safety](https://tanstack.com/router/v1/docs/framework/react/guide/type-safety)
- [TanStack Router - File-Based Routing API Reference](https://tanstack.com/router/v1/docs/api/file-based-routing)

### コミュニティの実践
- [Tips from 8 months of TanStack/Router in production - Swizec Teller](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
- [Reddit: Best Practices for Using TanStack Router](https://www.reddit.com/r/reactjs/comments/1bo3hzr/best_practices_for_using_tanstack_router_with_a/)
- [TanStack Router Full Course](https://www.youtube.com/watch?v=fpXOT8SNTpY)
