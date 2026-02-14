## 概要

TanStack Routerのファイルベースルーティングは、コミュニティで高く評価されている最新のルーティング手法です。ファイルシステムの構造がそのままルート構造になり、型安全性、自動コード分割、サスペンス対応などの強力な機能を提供します。本番環境での実績も豊富で、多くの開発者が従来のコードベースのルーティングから移行しています。

コミュニティでは特に以下の点が評価されています：

- **型安全性**：存在しないパスへのリンクでコンパイルエラーが発生
- **開発者体験**：ファイル構造がそのままURL構造になり、コードが見つけやすい
- **パフォーマンス**：自動コード分割により初期ロード時間が改善
- **柔軟性**：ネストされたルート、動的ルート、レイアウトルートを簡単に実装可能

**情報源**：

- [TanStack Router公式ドキュメント - File-Based Routing](https://tanstack.com/router/v1/docs/framework/react/routing/file-based-routing)
- [Tips from 8 months of TanStack/Router in production - Swizec Teller](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
- [Reddit: Best Practices for Using TanStack Router](https://www.reddit.com/r/reactjs/comments/1bo3hzr/best_practices_for_using_tanstack_router_with_a/)

## セットアップのベストプラクティス

### Viteとの統合

Viteプロジェクトでファイルベースルーティングを使用する場合、`@tanstack/router-plugin`をインストールして設定します。

```bash
npm install @tanstack/react-router
npm install -D @tanstack/router-plugin
```

**vite.config.ts の設定**：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
})
```

**重要なポイント**：

- プラグインの順序：`TanStackRouterVite()`は`react()`の**前に**配置する
- 自動生成ファイル：`src/routeTree.gen.ts`が自動生成されるので、Gitで無視する
- リンター/フォーマッターの除外：自動生成ファイルはリンターとフォーマッターから除外する

```gitignore
# .gitignore
src/routeTree.gen.ts
```

**情報源**：

- [TanStack Router - Installation with Vite](https://tanstack.com/router/v1/docs/framework/react/installation/with-vite)
- [Setting Up TanStack File-Based Router with a Vite React App](https://blog.iamdipankarpaul.com/setting-up-tanstack-file-based-router-with-a-vite-react-app)

### ディレクトリ構造のベストプラクティス

```
src/
├── routes/
│   ├── __root.tsx          # ルートレイアウト（必須）
│   ├── index.tsx           # / パス
│   ├── about.tsx           # /about パス
│   ├── posts/
│   │   ├── index.tsx       # /posts パス
│   │   └── $postId.tsx     # /posts/:postId パス（動的ルート）
│   └── _auth/              # レイアウトルート（URLに現れない）
│       ├── route.tsx       # 認証レイアウト
│       ├── login.tsx       # /login パス
│       └── register.tsx    # /register パス
└── routeTree.gen.ts        # 自動生成（編集しない）
```

**命名規則**：

- `__root.tsx`：ルートレイアウト（必須）
- `index.tsx`：そのディレクトリのインデックスルート
- `$paramName.tsx`：動的パラメータ
- `_folderName/`：レイアウトルート（URLパスには影響しない）
- `route.tsx`：フォルダ内でコンポーネントを定義する場合

**情報源**：

- [TanStack Router - File-Based Routing](https://tanstack.com/router/v1/docs/framework/react/routing/file-based-routing)
- [File-Based Routing with Tanstack Router - Grasp](https://paths.grasp.study/public-courses/7348a52b-431d-46f3-be49-57877ff0037d/modules/aa2fe4fb-fe1d-45ae-881b-65a06279947e/lessons/24151557-b725-4876-8940-d8366e044220)

## 実践的な使用パターン

### 開発環境での活用

#### コードの整理パターン

本番環境での実践例（Swizec Teller氏の経験）：

- **垂直分割**：各ページフォルダは動作に必要なすべてを含む
- **コロケーション**：関連するコンポーネントと関数は階層の最も近い共有スペースに配置
- **`../../../`は悪臭**：長い相対パスインポートはコード設計の問題を示す

```
src/routes/
├── posts/
│   ├── index.tsx           # 投稿一覧ページ
│   ├── $postId.tsx         # 投稿詳細ページ
│   ├── -components/        # posts配下のコンポーネント
│   │   ├── PostCard.tsx
│   │   └── PostList.tsx
│   └── -hooks/             # posts配下のフック
│       └── usePostData.ts
```

**水平的関心事の扱い**：

- 共通データロード、UIアトムなどの横断的関心事はライブラリのように扱う
- 専用ディレクトリを作成（例：`/data/`、`/pages/-components`）
- パスエイリアスを使用して簡単にインポートできるようにする

**情報源**：

- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)

### データローディングパターン

TanStack Routerはルーターレベルでデータローダーをサポートし、サスペンスを第一級サポートしています。

**本番環境で実証されたルール**：

1. **ページ全体で必要なデータはローダーを使用**

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
  component: PostComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  // ローディング状態を処理する必要なし
  return <div>{post.title}</div>
}
```

2. **単一コンポーネントで使用するデータはサスペンスクエリを使用**

```typescript
function CommentSection({ postId }: { postId: string }) {
  // ルーターが調整を処理、ローディング/エラー状態は不要
  const { data: comments } = useSuspenseQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  })
  
  return <div>{comments.map(c => <Comment key={c.id} {...c} />)}</div>
}
```

3. **インタラクションに依存するデータは通常のクエリを使用**

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

4. **ローダーとクエリでコードを共有**

```typescript
// shared-queries.ts
export const postQueryOptions = (postId: string) => ({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
})

// ルートローダーで使用
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, context }) => {
    return context.queryClient.ensureQueryData(
      postQueryOptions(params.postId)
    )
  },
})

// コンポーネントでも使用
function PostDetail({ postId }: { postId: string }) {
  const { data } = useSuspenseQuery(postQueryOptions(postId))
  return <div>{data.title}</div>
}
```

**情報源**：

- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)

### 型安全なナビゲーション

TanStack Routerの最大の強みの1つは完全な型安全性です。

```typescript
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <>
      {/* ✅ 正しい：型チェックされる */}
      <Link to="/posts/$postId" params={{ postId: '123' }}>
        投稿を見る
      </Link>
      
      {/* ❌ エラー：存在しないパス */}
      <Link to="/non-existent-route">リンク</Link>
      
      {/* ❌ エラー：必須パラメータが不足 */}
      <Link to="/posts/$postId">リンク</Link>
      
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

**情報源**：

- [TanStack Router Full Course](https://www.youtube.com/watch?v=fpXOT8SNTpY)
- [The Beauty of TanStack Router - Reddit](https://www.reddit.com/r/reactjs/comments/1kv69fz/the_beauty_of_tanstack_router/)

## 移行のベストプラクティス

### React Routerからの移行

React Routerからの移行は段階的に行うことができます。

**移行戦略**：

1. **ルート構造のマッピング**

```typescript
// React Router v6
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/posts" element={<Posts />}>
    <Route path=":postId" element={<PostDetail />} />
  </Route>
  <Route path="/login" element={<AuthLayout />}>
    <Route index element={<Login />} />
  </Route>
</Routes>

// TanStack Router ファイル構造
// src/routes/
// ├── index.tsx          -> /
// ├── posts/
// │   ├── index.tsx      -> /posts
// │   └── $postId.tsx    -> /posts/:postId
// └── _auth/
//     ├── route.tsx      -> レイアウト
//     └── login.tsx      -> /login
```

2. **段階的な移行アプローチ**

- 小さなルートから始める（例：静的ページ）
- ルートごとに移行し、テストを実行
- データローディングパターンを段階的に採用
- 最後に複雑なネストルートを移行

**情報源**：

- [Migrating React Router to Tanstack Router's File-Based Routing](https://paths.grasp.study/public-courses/7348a52b-431d-46f3-be49-57877ff0037d/modules/2493c4f3-37ee-4c77-bf1e-beef1276a4eb/lessons/73434a2d-4ee0-4be1-a325-fff00ca5eeb9)

### 移行で学んだ教訓

コミュニティから報告された移行の教訓：

- **早めにプラグインを設定**：Viteプラグインを正しく設定しないと、ルート生成が動作しない
- **型定義を活用**：型エラーはバグを早期に発見するのに役立つ
- **段階的に採用**：一度にすべてを変更しようとしない
- **ドキュメントを読む**：TanStack Routerの概念（特にローダーとサスペンス）を理解することが重要

## パフォーマンス最適化

### 自動コード分割

ファイルベースルーティングは自動的にコード分割を有効にします。

**デフォルトの動作**：

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true, // デフォルトで有効
    }),
    react(),
  ],
})
```

**注意点**：

- `autoCodeSplitting`を有効にすると、ルートが遅延読み込みされる
- デフォルトのペンディング時間は500ms
- 初期レンダリング遅延が発生する可能性がある

**最適化のヒント**：

1. **ペンディングタイムの調整**

```typescript
export const Route = createFileRoute('/posts')({
  component: Posts,
  pendingMs: 200, // デフォルトの500msから短縮
})
```

2. **重要なルートはプリロード**

```typescript
import { Link } from '@tanstack/react-router'

<Link 
  to="/posts/$postId" 
  params={{ postId: '123' }}
  preload="intent" // ホバー時にプリロード
>
  投稿を見る
</Link>
```

3. **レイアウトの配置を最適化**

```typescript
// ❌ 遅い：レイアウトが __root.tsx にあり、ページと別にレンダリング
// __root.tsx
function RootComponent() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}

// ✅ 速い：レイアウトを _app に配置してページと一緒にレンダリング
// _app/route.tsx
function AppLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
```

**情報源**：

- [GitHub Issue: Initial Render Delay with TanStack Router](https://github.com/TanStack/router/discussions/1765)
- [TanStack Router Setup in Our React SaaS Template](https://dev.to/kiran_ravi_092a2cfcf60389/tanstack-router-setup-in-our-react-saas-template-2026-4b67)

### データローディングの最適化

```typescript
// クエリを並列化
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

**情報源**：

- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)

## トラブルシューティング

### よくある問題と解決策

#### 1. ルートが生成されない

**症状**：`routeTree.gen.ts`が生成されない、または更新されない

**解決策**：

- Viteプラグインが正しく設定されているか確認
- プラグインの順序を確認（`TanStackRouterVite()`が最初）
- 開発サーバーを再起動

```bash
# キャッシュをクリアして再起動
rm -rf node_modules/.vite
npm run dev
```

#### 2. ネストルートが動作しない

**症状**：ネストされたルートが正しくマッチしない

**解決策**：

- `<Outlet />`コンポーネントが親ルートに配置されているか確認
- ファイル命名規則を確認（`index.tsx`vs`route.tsx`）

```typescript
// 親ルート: posts/route.tsx
export const Route = createFileRoute('/posts')({
  component: () => (
    <div>
      <h1>投稿</h1>
      <Outlet /> {/* 子ルートはここにレンダリング */}
    </div>
  ),
})
```

#### 3. 型エラー：ルートが見つからない

**症状**：存在するルートにリンクしているのに型エラーが発生

**解決策**：

- `routeTree.gen.ts`が最新か確認
- TypeScriptサーバーを再起動
- プロジェクトを再ビルド

```bash
# TypeScript型を再生成
npm run build
```

#### 4. HMR（ホットモジュールリプレースメント）が動作しない

**症状**：`__root.tsx`やコンポーネントを編集してもHMRがトリガーされない

**解決策**：

- Viteプラグインのバージョンを確認（最新版にアップデート）
- 開発サーバーを再起動
- HMR関連の既知の問題を確認

**情報源**：

- [GitHub Issue: HMR is not working from root route](https://github.com/TanStack/router/issues/1992)
- [TanStack Router - How to Debug Common Router Issues](https://tanstack.com/router/latest/docs/framework/react/how-to/debug-router-issues)

#### 5. ルートIDのカスタマイズ

**症状**：生成されたルートIDを変更したい

**解決策**：

ファイルベースルーティングでルートIDを変更するには、定数を使用するか、コードベースルーティングと組み合わせる必要があります。

```typescript
// 定数を使用してルートIDを管理
export const ROUTE_IDS = {
  HOME: '/',
  POSTS: '/posts',
  POST_DETAIL: '/posts/$postId',
} as const

// ナビゲーションで使用
<Link to={ROUTE_IDS.POST_DETAIL} params={{ postId: '123' }}>
  投稿を見る
</Link>
```

**情報源**：

- [GitHub Issue: File Based Routing Issues #3282](https://github.com/TanStack/router/issues/3282)

### デバッグのベストプラクティス

1. **TanStack Router DevToolsを使用**

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

2. **ログを活用**

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    console.log('Loading post:', params.postId)
    const post = await fetchPost(params.postId)
    console.log('Post loaded:', post)
    return { post }
  },
})
```

3. **型エラーを無視しない**

型エラーは多くの場合、実際のバグを示しています。`@ts-ignore`を使う前に根本原因を調査してください。

## チーム開発での運用

### コーディング規約

**ファイル命名**：

- 一貫した命名規則を使用（kebab-case推奨）
- `index.tsx`はそのパスのメインページを表す
- `route.tsx`はレイアウトコンポーネントを表す
- コンポーネント名はPascalCaseを使用

**ディレクトリ構造**：

- 機能ごとにグループ化
- 共有コンポーネントは適切なレベルに配置
- プライベートコンポーネントには`-`プレフィックスを使用

```
src/routes/
├── posts/
│   ├── -components/    # postsルート専用コンポーネント
│   ├── -hooks/         # postsルート専用フック
│   ├── index.tsx
│   └── $postId.tsx
```

### レビューのポイント

コードレビュー時に確認すべき項目：

- [ ] ルート構造がURL構造と一致しているか
- [ ] データローディングが適切なレベル（loader vs query）で行われているか
- [ ] 型安全性が保たれているか（`any`の使用は最小限か）
- [ ] 不要な相対パスインポート（`../../../`）がないか
- [ ] コンポーネントが適切なレベルに配置されているか

### ドキュメント化

プロジェクトのルーティング構造をドキュメント化する：

```markdown
# ルーティング構造

## 公開ルート
- `/` - ホームページ
- `/about` - 会社概要
- `/posts` - 投稿一覧
- `/posts/:postId` - 投稿詳細

## 認証が必要なルート
- `/dashboard` - ダッシュボード
- `/profile` - プロフィール設定
- `/admin/*` - 管理画面

## レイアウト
- `_auth` - 認証ページのレイアウト
- `_app` - アプリケーションメインレイアウト
```

**情報源**：

- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)

## UX設計のガイドライン

本番環境での経験から得られたUX設計の原則：

### URL設計の原則

1. **すべての重要なUI状態にURLを割り当てる**

```typescript
// ✅ 良い：モーダルの状態もURLに反映
<Link 
  to="/posts" 
  search={{ modal: 'create' }}
>
  新規作成
</Link>

// ❌ 悪い：モーダルの状態がローカル
const [isOpen, setIsOpen] = useState(false)
```

2. **URLは独立している**

- ページ間の状態はパフォーマンスのためだけに使用
- Cmd+R（リロード）で常に再構築可能
- リンクを共有すると、同じものが表示される

3. **クリック数を減らす**

- フォームの最初のフィールドに自動フォーカス
- 一般的なタスクでキーボード操作をサポート
- フォーム送信後に次の論理的な場所に自動ナビゲート

**情報源**：

- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)

## まとめ

TanStack Routerのファイルベースルーティングは、型安全性、自動最適化、優れた開発者体験を提供する強力なソリューションです。コミュニティの実践から学ぶことで、スムーズな導入と効果的な活用が可能になります。

**重要なポイント**：

1. **セットアップ**：Viteプラグインを正しく設定し、自動生成ファイルを無視する
2. **構造**：ファイル構造がURL構造に直接マッピングされる
3. **データ**：ローダーとクエリを適切に使い分ける
4. **型安全性**：型エラーを活用してバグを早期発見
5. **パフォーマンス**：自動コード分割とプリロードを活用
6. **移行**：段階的にアプローチし、小さく始める
7. **チーム**：一貫した規約と明確なドキュメント

**参考リソース**：

- [TanStack Router公式ドキュメント](https://tanstack.com/router)
- [Tips from 8 months of TanStack/Router in production](https://swizec.com/blog/tips-from-8-months-of-tan-stack-router-in-production/)
- [TanStack Router GitHub Discussions](https://github.com/TanStack/router/discussions)
- [Reddit: r/reactjs - TanStack Router discussions](https://www.reddit.com/r/reactjs/)
