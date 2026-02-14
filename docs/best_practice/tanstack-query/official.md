# TanStack Query 公式ベストプラクティス

TanStack Query の公式ドキュメントから抽出したベストプラクティス、推奨設定、注意事項をまとめています。

## 概要

TanStack Query (旧 React Query) は、Web アプリケーションにおけるサーバーステート管理のためのライブラリです。データフェッチング、キャッシング、同期、更新を簡潔に実現します。

### 主な機能

- **サーバーステート管理**: キャッシング、重複排除、バックグラウンド更新
- **自動リフェッチ**: ウィンドウフォーカス、ネットワーク再接続時の自動更新
- **楽観的更新**: UI の即座な反映とロールバック機能
- **パフォーマンス最適化**: ページネーション、無限スクロール、構造共有
- **開発者体験**: 専用 DevTools、TypeScript サポート

## 重要なデフォルト設定

TanStack Query は積極的かつ合理的なデフォルト設定を持っています。

### キャッシュとステール時間

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // デフォルトでは staleTime は 0（即座に古くなる）
      staleTime: 0,
      // 非アクティブなクエリは 5 分後にガベージコレクション
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```

**重要な動作**:

- クエリインスタンスはデフォルトでキャッシュデータを stale（古い）として扱う
- stale なクエリは以下のタイミングで自動的にバックグラウンドでリフェッチされる:
  - 新しいクエリインスタンスがマウントされたとき
  - ウィンドウが再フォーカスされたとき
  - ネットワークが再接続されたとき
  - `refetchInterval` が設定されている場合、定期的に

### リフェッチ設定

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  // 過度なリフェッチを避けるために staleTime を設定
  staleTime: 2 * 60 * 1000, // 2 minutes
  // またはリフェッチのタイミングをカスタマイズ
  refetchOnMount: true, // デフォルト: true
  refetchOnWindowFocus: true, // デフォルト: true
  refetchOnReconnect: true, // デフォルト: true
})
```

### リトライ動作

- クエリは失敗時に **3 回自動リトライ**される（指数バックオフ）
- エラーをすぐに表示したい場合は `retry: false` を設定

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  retry: false, // リトライを無効化
})
```

### ガベージコレクション

- 非アクティブなクエリは **5 分間**キャッシュに保持される
- 再利用の可能性を考慮してメモリに保持

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  // カスタムガベージコレクション時間
  gcTime: 10 * 60 * 1000, // 10 minutes
})
```

## QueryClient の推奨設定

### 基本設定

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// アプリケーションのルートで QueryClient を作成
function App() {
  // NEVER DO THIS:
  // const queryClient = new QueryClient()
  // ファイルルートレベルで作成すると、すべてのリクエスト間で
  // キャッシュが共有され、すべてのデータがすべてのユーザーに渡される
  
  // Instead do this:
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR では通常 staleTime を 0 以上に設定
            // クライアントでの即座のリフェッチを避けるため
            staleTime: 60 * 1000, // 1 minute
            // その他のデフォルト設定
            retry: 3,
            refetchOnWindowFocus: true,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* アプリケーションのコンポーネント */}
    </QueryClientProvider>
  )
}
```

### SSR/SSG での設定

```typescript
// SSR では staleTime を高めに設定して二重フェッチを避ける
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
})
```

## クエリキーのベストプラクティス

### 基本原則

クエリキーはトップレベルで必ず配列にする必要があります。

```typescript
// ✅ Good: 配列形式
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })

// ❌ Bad: 文字列のみ
useQuery({ queryKey: 'todos', queryFn: fetchTodos })
```

### 階層的なクエリキー

```typescript
// 単純なリスト
useQuery({ queryKey: ['todos'], queryFn: fetchTodoList })

// ID を含む個別のリソース
useQuery({ queryKey: ['todo', 5], queryFn: () => fetchTodoById(5) })

// 追加パラメータを含む
useQuery({ 
  queryKey: ['todos', { type: 'done', page: 1 }], 
  queryFn: () => fetchTodos({ type: 'done', page: 1 }) 
})
```

### クエリキーの決定論的ハッシュ化

オブジェクトのキー順序は関係ありません：

```typescript
// これらはすべて同じクエリとみなされる
useQuery({ queryKey: ['todos', { status, page }], ... })
useQuery({ queryKey: ['todos', { page, status }], ... })
useQuery({ queryKey: ['todos', { page, status, other: undefined }], ... })

// ただし、配列の順序は重要
useQuery({ queryKey: ['todos', status, page], ... }) // 異なる
useQuery({ queryKey: ['todos', page, status], ... }) // 異なる
```

### 変数の依存関係

クエリ関数で使用する変数は必ずクエリキーに含める：

```typescript
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos', todoId], // 変数を含める
    queryFn: () => fetchTodoById(todoId),
  })
}
```

## クエリ関数のベストプラクティス

### エラーハンドリング

クエリ関数は Promise を返す必要があり、エラー時には throw または reject する必要があります：

```typescript
const { error } = useQuery({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    const response = await fetch('/todos/' + todoId)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  },
})
```

### QueryFunctionContext の活用

```typescript
function fetchTodoList({ queryKey }) {
  const [_key, { status, page }] = queryKey
  // queryKey から変数を取得してクエリを実行
  return fetch(`/todos?status=${status}&page=${page}`).then(r => r.json())
}

useQuery({
  queryKey: ['todos', { status: 'done', page: 1 }],
  queryFn: fetchTodoList,
})
```

## Mutations のベストプラクティス

### 基本的な使用方法

```typescript
const mutation = useMutation({
  mutationFn: (newTodo) => axios.post('/todos', newTodo),
  onSuccess: () => {
    // クエリを無効化して再フェッチ
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

// mutation の実行
mutation.mutate({ title: 'New Todo' })
```

### サイドエフェクトの活用

```typescript
useMutation({
  mutationFn: addTodo,
  onMutate: async (newTodo) => {
    // 楽観的更新の前に進行中のリフェッチをキャンセル
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    
    // 前の値をスナップショット
    const previousTodos = queryClient.getQueryData(['todos'])
    
    // 楽観的に更新
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    
    // ロールバック用の値を返す
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // エラー時にロールバック
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    // 成功/失敗に関わらず再フェッチ
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Promise と async/await

```typescript
const mutation = useMutation({ mutationFn: addTodo })

try {
  const todo = await mutation.mutateAsync(todo)
  console.log(todo)
} catch (error) {
  console.error(error)
}
```

## クエリ無効化のベストプラクティス

### 基本的な無効化

```typescript
// すべてのクエリを無効化
queryClient.invalidateQueries()

// 'todos' で始まるすべてのクエリを無効化
queryClient.invalidateQueries({ queryKey: ['todos'] })
```

### 部分一致と完全一致

```typescript
// 部分一致（デフォルト）
queryClient.invalidateQueries({ queryKey: ['todos'] })
// 無効化される: ['todos'], ['todos', { type: 'done' }]

// 完全一致
queryClient.invalidateQueries({ 
  queryKey: ['todos'],
  exact: true 
})
// 無効化される: ['todos'] のみ
```

### 述語関数による無効化

```typescript
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10,
})
```

## 楽観的更新のベストプラクティス

### UI 経由の楽観的更新

シンプルな方法で、キャッシュを直接操作しない：

```typescript
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const { isPending, variables, mutate } = addTodoMutation

// レンダリング
return (
  <ul>
    {todoQuery.items.map((todo) => (
      <li key={todo.id}>{todo.text}</li>
    ))}
    {isPending && <li style={{ opacity: 0.5 }}>{variables}</li>}
  </ul>
)
```

### キャッシュ経由の楽観的更新

複数の場所で更新を反映させる必要がある場合：

```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

## パフォーマンス最適化

### Request Waterfall の回避

#### 悪い例: ネストされたコンポーネントウォーターフォール

```typescript
function Article({ id }) {
  const { data: articleData, isPending } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  if (isPending) return 'Loading...'

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <Comments id={id} /> {/* これは article が読み込まれるまで待つ */}
    </>
  )
}

function Comments({ id }) {
  const { data } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })
  // ...
}
```

#### 良い例: 並列フェッチ

```typescript
function Article({ id }) {
  // 両方のクエリを並列で実行
  const { data: articleData, isPending: articlePending } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  const { data: commentsData, isPending: commentsPending } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
  })

  if (articlePending) return 'Loading article...'

  return (
    <>
      <ArticleHeader articleData={articleData} />
      {commentsPending ? 'Loading comments...' : <Comments commentsData={commentsData} />}
    </>
  )
}
```

### Suspense での並列クエリ

```typescript
// ❌ Bad: シリアルに実行される
function App() {
  const usersQuery = useSuspenseQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useSuspenseQuery({ queryKey: ['teams'], queryFn: fetchTeams })
  const projectsQuery = useSuspenseQuery({ queryKey: ['projects'], queryFn: fetchProjects })
}

// ✅ Good: 並列に実行される
function App() {
  const [usersQuery, teamsQuery, projectsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['teams'], queryFn: fetchTeams },
      { queryKey: ['projects'], queryFn: fetchProjects },
    ],
  })
}
```

## プリフェッチのベストプラクティス

### イベントハンドラーでのプリフェッチ

```typescript
function ShowDetailsButton() {
  const queryClient = useQueryClient()

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['details'],
      queryFn: getDetailsData,
      staleTime: 60000, // プリフェッチには staleTime を設定
    })
  }

  return (
    <button onMouseEnter={prefetch} onFocus={prefetch} onClick={...}>
      Show Details
    </button>
  )
}
```

### コンポーネント内でのプリフェッチ

```typescript
function Article({ id }) {
  const queryClient = useQueryClient()
  
  const { data: articleData } = useQuery({
    queryKey: ['article', id],
    queryFn: getArticleById,
  })

  // コメントを事前にフェッチ
  useQuery({
    queryKey: ['article-comments', id],
    queryFn: getArticleCommentsById,
    notifyOnChangeProps: [], // 再レンダリングを避ける最適化
  })

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <Comments id={id} />
    </>
  )
}
```

### Router 統合でのプリフェッチ

```typescript
// TanStack Router での例
const articleRoute = new Route({
  path: 'article',
  loader: async ({ context: { queryClient } }) => {
    // 重要なデータはブロックして待つ
    await queryClient.prefetchQuery({
      queryKey: ['article'],
      queryFn: fetchArticle,
    })
    
    // セカンダリデータは非ブロック
    queryClient.prefetchQuery({
      queryKey: ['comments'],
      queryFn: fetchComments,
    })
  },
})
```

## SSR/SSG のベストプラクティス

### QueryClient のセットアップ

```typescript
// _app.tsx (Next.js Pages Router)
export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR では staleTime を設定してクライアントでの
            // 即座のリフェッチを避ける
            staleTime: 60 * 1000,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

### dehydrate/hydrate パターン

```typescript
// pages/posts.tsx
export async function getStaticProps() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
}

export default function PostsRoute({ dehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}
```

### 依存クエリのプリフェッチ

```typescript
export async function getServerSideProps() {
  const queryClient = new QueryClient()

  // 最初のクエリを実行
  const user = await queryClient.fetchQuery({
    queryKey: ['user', email],
    queryFn: getUserByEmail,
  })

  // 結果に基づいて条件付きでプリフェッチ
  if (user?.userId) {
    await queryClient.prefetchQuery({
      queryKey: ['projects', userId],
      queryFn: getProjectsByUser,
    })
  }

  return { props: { dehydratedState: dehydrate(queryClient) } }
}
```

## テストのベストプラクティス

### テスト環境のセットアップ

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // テストではリトライを無効化
    },
  },
})

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

test('custom hook', async () => {
  const { result } = renderHook(() => useCustomHook(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(result.current.data).toEqual('Hello')
})
```

### Jest での gcTime 設定

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity, // "Jest did not exit" エラーを防ぐ
    },
  },
})
```

## Network Mode のベストプラクティス

### オンラインモード（デフォルト）

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  networkMode: 'online', // デフォルト
})
```

- ネットワーク接続がない場合、クエリは実行されない
- `fetchStatus: 'paused'` になる

### オフラインファーストモード

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  networkMode: 'offlineFirst',
})
```

- Service Worker や HTTP キャッシングを活用する PWA に適している
- 最初の fetch を実行し、その後リトライを一時停止

### 常時モード

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  networkMode: 'always',
})
```

- オンライン/オフライン状態を無視して常にフェッチ
- AsyncStorage などネットワーク接続不要な環境に適している

## DevTools のベストプラクティス

### 開発環境での使用

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* アプリケーション */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### プロダクションでの遅延ロード

```typescript
const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
)

function App() {
  const [showDevtools, setShowDevtools] = React.useState(false)

  React.useEffect(() => {
    window.toggleDevtools = () => setShowDevtools((old) => !old)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Example />
      {showDevtools && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </React.Suspense>
      )}
    </QueryClientProvider>
  )
}
```

## よくある落とし穴

### 1. ファイルルートレベルでの QueryClient 作成

```typescript
// ❌ Bad: すべてのリクエスト間でキャッシュが共有される
const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}

// ✅ Good: 各リクエストで独立したキャッシュ
export default function MyApp({ Component, pageProps }) {
  const [queryClient] = React.useState(() => new QueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

### 2. クエリキーに変数を含めない

```typescript
// ❌ Bad: todoId が変わっても同じクエリが再利用される
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos'], // todoId が含まれていない
    queryFn: () => fetchTodoById(todoId),
  })
}

// ✅ Good: todoId が変わると新しいクエリが実行される
function Todos({ todoId }) {
  const result = useQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodoById(todoId),
  })
}
```

### 3. setQueryData での不変性違反

```typescript
// ❌ Bad: 既存データを直接変更
queryClient.setQueryData(['todos'], (oldData) => {
  oldData.push(newTodo) // NG: 直接変更
  return oldData
})

// ✅ Good: 新しいオブジェクトを返す
queryClient.setQueryData(['todos'], (oldData) => {
  return [...oldData, newTodo]
})
```

### 4. SSR でのデフォルト staleTime 未設定

```typescript
// ❌ Bad: クライアントで即座にリフェッチされる
const queryClient = new QueryClient()

// ✅ Good: SSR では staleTime を設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})
```

### 5. Suspense でのシリアルクエリ

```typescript
// ❌ Bad: 順番に実行される
const usersQuery = useSuspenseQuery({ queryKey: ['users'], queryFn: fetchUsers })
const teamsQuery = useSuspenseQuery({ queryKey: ['teams'], queryFn: fetchTeams })

// ✅ Good: 並列に実行される
const [usersQuery, teamsQuery] = useSuspenseQueries({
  queries: [
    { queryKey: ['users'], queryFn: fetchUsers },
    { queryKey: ['teams'], queryFn: fetchTeams },
  ],
})
```

## セキュリティ

### XSS 対策（SSR）

カスタム SSR セットアップでは、dehydrated state を安全にシリアライズする必要があります：

```typescript
// ❌ Bad: XSS 脆弱性
const serialized = JSON.stringify(dehydratedState)

// ✅ Good: serialize-javascript または devalue を使用
import serialize from 'serialize-javascript'
const serialized = serialize(dehydratedState)
```

### サーバーでのメモリ管理

```typescript
// サーバーでは gcTime のデフォルトは Infinity
// リクエスト完了後に手動でクリア
await queryClient.prefetchQuery(...)
const dehydratedState = dehydrate(queryClient)

// メモリを解放
queryClient.clear()

return { props: { dehydratedState } }
```

## 参考リンク

### 公式ドキュメント

- [TanStack Query 公式ドキュメント](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [QueryClient API](https://tanstack.com/query/latest/docs/reference/QueryClient)
- [Server Rendering & Hydration](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Performance & Request Waterfalls](https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls)

### コミュニティリソース

- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [React Query as a State Manager](https://tkdodo.eu/blog/react-query-as-a-state-manager)
- [Testing React Query](https://tkdodo.eu/blog/testing-react-query)
