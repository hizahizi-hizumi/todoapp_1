---
description: 'TanStack Query を使用した型安全で効率的なサーバーステート管理のベストプラクティス'
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# TanStack Query ベストプラクティス

TanStack Query（旧 React Query）を使用して、型安全で保守性が高く、パフォーマンスに優れたサーバーステート管理を実現するための指針。

## 目的とスコープ

このドキュメントは、TanStack Query を使用した React アプリケーション開発において、以下を実現するためのベストプラクティスを定義します：

- データフェッチング、キャッシング、同期の効率的な実装
- Request Waterfall の回避とパフォーマンス最適化
- クエリキーの体系的な管理と保守性の向上
- 楽観的更新による優れたユーザー体験
- SSR/SSG との適切な統合

## 基本原則

### QueryClient の適切な初期化

- コンポーネント内で `useState` を使用して QueryClient を作成する
- ファイルルートレベルでの作成は絶対に避ける（SSR でのキャッシュ共有問題）
- デフォルト設定をプロジェクト要件に合わせてカスタマイズする

**根拠**: ファイルレベルで QueryClient を作成すると、SSR 環境ですべてのリクエスト間でキャッシュが共有され、ユーザー間でデータが漏洩する重大なセキュリティリスクとなります。

**推奨**:
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function App() {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1分
            gcTime: 5 * 60 * 1000, // 5分
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* アプリケーション */}
    </QueryClientProvider>
  )
}
```

**非推奨**:
```typescript
// ❌ SSR でキャッシュが共有される危険なパターン
const queryClient = new QueryClient()

export default function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}
```

### クエリキーの構造化

- クエリキーは必ず配列形式で定義する
- クエリ関数で使用するすべての変数をクエリキーに含める
- 階層的な構造を採用する（`['feature', 'type', ...parameters]`）
- クエリキーファクトリーパターンを使用して一元管理する

**根拠**: クエリキーは依存配列として機能し、変数が変更されると自動的にリフェッチが実行されます。変数を含めないと、古いデータが表示され続ける原因となります。

**推奨**:
```typescript
// クエリキーファクトリーパターン
const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}

// 使用例
function TodoList({ filter }: { filter: string }) {
  const { data } = useQuery({
    queryKey: todoKeys.list(filter),
    queryFn: () => fetchTodos(filter),
  })
}
```

**非推奨**:
```typescript
// ❌ 変数がクエリキーに含まれていない
function TodoDetail({ todoId }: { todoId: number }) {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetchTodoById(todoId), // todoId が変わっても再フェッチされない
  })
}
```

### カスタムフックでのカプセル化

- 各クエリを専用のカスタムフックでラップする
- データフェッチングロジックを UI から分離する
- クエリキーの使用箇所を一箇所に集約する

**根拠**: カスタムフックを使用することで、データフェッチングロジックの変更が容易になり、同一クエリキーの使用箇所を一元管理できます。

**推奨**:
```typescript
// features/todos/queries.ts
import { useQuery } from '@tanstack/react-query'

const fetchTodos = async (state: 'all' | 'open' | 'done') => {
  const response = await fetch(`/api/todos/${state}`)
  if (!response.ok) throw new Error('Failed to fetch todos')
  return response.json()
}

export const useTodosQuery = (state: 'all' | 'open' | 'done') =>
  useQuery({
    queryKey: ['todos', state],
    queryFn: () => fetchTodos(state),
  })
```

**非推奨**:
```typescript
// ❌ コンポーネント内に直接記述
function TodoList() {
  const { data } = useQuery({
    queryKey: ['todos', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/todos/all')
      return res.json()
    },
  })
}
```

## デフォルト設定の理解

### staleTime と gcTime の違い

- **staleTime**: データが fresh から stale になるまでの時間（デフォルト: 0）
- **gcTime**: 非アクティブなクエリがキャッシュから削除されるまでの時間（デフォルト: 5分）

**重要な動作**:
- `staleTime: 0` の場合、クエリインスタンスがマウントされると即座にバックグラウンドリフェッチが実行される
- stale なクエリは、ウィンドウフォーカス、ネットワーク再接続時にも自動リフェッチされる
- 多くの場合、調整が必要なのは `staleTime` です

**推奨**:
```typescript
useQuery({
  queryKey: ['user-profile'],
  queryFn: fetchUserProfile,
  staleTime: 1000 * 60 * 5, // 5分間は fresh として扱う（リフェッチしない）
})
```

### リフェッチのタイミング制御

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 2 * 60 * 1000, // 2分
  refetchOnMount: true, // マウント時にリフェッチ（デフォルト: true）
  refetchOnWindowFocus: true, // ウィンドウフォーカス時（デフォルト: true）
  refetchOnReconnect: true, // ネットワーク再接続時（デフォルト: true）
})
```

### リトライ動作

- デフォルトでは失敗時に 3 回自動リトライされる（指数バックオフ）
- プロダクション環境では過度なリトライを避ける

**推奨**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // プロダクションでは 1 回に制限
    },
  },
})
```

## パフォーマンス最適化

### Request Waterfall の回避

- ネストされたコンポーネントで連鎖的にクエリを実行しない
- 複数のクエリを並列で実行する
- Suspense 使用時は `useSuspenseQueries` で並列化する

**根拠**: クエリの連鎖実行はパフォーマンスを著しく低下させ、ユーザー体験を損ないます。

**非推奨**:
```typescript
// ❌ シリアルに実行される（Waterfall）
function Article({ id }: { id: number }) {
  const { data: articleData, isPending } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticleById(id),
  })

  if (isPending) return 'Loading...'

  return (
    <>
      <ArticleHeader articleData={articleData} />
      <Comments id={id} /> {/* article が完了するまで待つ */}
    </>
  )
}

function Comments({ id }: { id: number }) {
  const { data } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: () => getArticleCommentsById(id),
  })
}
```

**推奨**:
```typescript
// ✅ 並列に実行される
function Article({ id }: { id: number }) {
  const { data: articleData, isPending: articlePending } = useQuery({
    queryKey: ['article', id],
    queryFn: () => getArticleById(id),
  })

  const { data: commentsData, isPending: commentsPending } = useQuery({
    queryKey: ['article-comments', id],
    queryFn: () => getArticleCommentsById(id),
  })

  if (articlePending) return 'Loading article...'

  return (
    <>
      <ArticleHeader articleData={articleData} />
      {commentsPending ? 'Loading comments...' : <Comments data={commentsData} />}
    </>
  )
}
```

### Suspense での並列化

**非推奨**:
```typescript
// ❌ シリアルに実行される
function App() {
  const usersQuery = useSuspenseQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const teamsQuery = useSuspenseQuery({ queryKey: ['teams'], queryFn: fetchTeams })
}
```

**推奨**:
```typescript
// ✅ 並列に実行される
function App() {
  const [usersQuery, teamsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['teams'], queryFn: fetchTeams },
    ],
  })
}
```

### select オプションによる最適化

- `select` オプションを使用してデータ変換を行う
- 選択したデータが変更された場合のみ再レンダリングが発生する
- 重い処理の場合は `useCallback` でメモ化する

**推奨**:
```typescript
function TodoCount() {
  const { data: count } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.length, // count だけが変わった場合のみ再レンダリング
  })

  return <div>Total: {count}</div>
}
```

## サーバー状態とクライアント状態の分離

### useState へのコピー禁止

- TanStack Query から取得したデータを `useState` にコピーしない
- バックグラウンド更新の恩恵を失う原因となる

**根拠**: データを useState にコピーすると、バックグラウンドでの自動更新が UI に反映されなくなり、古いデータが表示され続けます。

**非推奨**:
```typescript
// ❌ バックグラウンド更新が反映されない
function BadExample() {
  const { data } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  const [user, setUser] = useState()
  
  useEffect(() => {
    if (data) setUser(data)
  }, [data])
  
  return <div>{user?.name}</div>
}
```

**推奨**:
```typescript
// ✅ バックグラウンド更新が自動反映される
function GoodExample() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  
  return <div>{user?.name}</div>
}
```

**例外**: フォームの初期値として使用する場合は、`staleTime: Infinity` を設定してバックグラウンド更新を無効化します。

```typescript
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: Infinity, // フォーム編集中のバックグラウンド更新を防ぐ
})

const [formData, setFormData] = useState(user)
```

## Mutations のベストプラクティス

### 基本的な使用方法

```typescript
const mutation = useMutation({
  mutationFn: (newTodo: NewTodo) => axios.post('/todos', newTodo),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

mutation.mutate({ title: 'New Todo' })
```

### 楽観的更新

- ミューテーション成功を待たずに UI を即座に更新する
- エラー時のロールバック処理を必ず実装する
- `onSettled` で最新データをリフェッチする

**推奨**:
```typescript
const updateTodoMutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // 進行中のリフェッチをキャンセル
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    
    // 以前のデータを保存（ロールバック用）
    const previousTodos = queryClient.getQueryData(['todos'])
    
    // 楽観的更新
    queryClient.setQueryData(['todos'], (old: Todo[]) =>
      old?.map(todo => todo.id === newTodo.id ? newTodo : todo)
    )
    
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // エラー時にロールバック
    queryClient.setQueryData(['todos'], context?.previousTodos)
  },
  onSettled: () => {
    // 成功・失敗に関わらず、最新データをリフェッチ
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### setQueryData での不変性の保持

**非推奨**:
```typescript
// ❌ 既存データを直接変更
queryClient.setQueryData(['todos'], (oldData) => {
  oldData.push(newTodo) // 直接変更は NG
  return oldData
})
```

**推奨**:
```typescript
// ✅ 新しいオブジェクトを返す
queryClient.setQueryData(['todos'], (oldData: Todo[]) => {
  return [...oldData, newTodo]
})
```

## クエリ無効化のベストプラクティス

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

## プリフェッチのベストプラクティス

### イベントハンドラーでのプリフェッチ

- ホバーやフォーカス時にデータをプリフェッチする
- プリフェッチには `staleTime` を設定する

**推奨**:
```typescript
function UserList() {
  const queryClient = useQueryClient()
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
  
  const handleMouseEnter = (userId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 60 * 1000, // プリフェッチには staleTime を設定
    })
  }
  
  return (
    <ul>
      {users?.map(user => (
        <li key={user.id} onMouseEnter={() => handleMouseEnter(user.id)}>
          <Link to={`/users/${user.id}`}>{user.name}</Link>
        </li>
      ))}
    </ul>
  )
}
```

## SSR/SSG のベストプラクティス

### staleTime の設定

- SSR では必ず `staleTime` を 0 以上に設定する
- クライアントでの即座のリフェッチを避ける

**根拠**: SSR でサーバーからデータを取得しているにもかかわらず、クライアントで即座にリフェッチが実行されると、無駄なリクエストが発生します。

**推奨**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // SSR では最低 1 分設定
    },
  },
})
```

### dehydrate/hydrate パターン

```typescript
// Next.js Pages Router での例
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

export default function PostsRoute({ dehydratedState }: { dehydratedState: unknown }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}
```

### サーバーでのメモリ管理

```typescript
// サーバーでは gcTime のデフォルトは Infinity
// リクエスト完了後に手動でクリア
await queryClient.prefetchQuery(...)
const dehydratedState = dehydrate(queryClient)

queryClient.clear() // メモリを解放

return { props: { dehydratedState } }
```

## エラーハンドリング

### クエリ関数でのエラー処理

- クエリ関数はエラー時に必ず throw または reject する
- HTTP レスポンスのエラーチェックを必ず行う

**推奨**:
```typescript
const { error } = useQuery({
  queryKey: ['todos', todoId],
  queryFn: async () => {
    const response = await fetch(`/todos/${todoId}`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  },
})
```

### AbortSignal による自動キャンセル

```typescript
const fetchProjects = async ({ signal }: { signal?: AbortSignal }) => {
  const res = await fetch('/api/projects', { signal })
  return res.json()
}

function ProjectsList() {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects, // コンポーネントアンマウント時に自動キャンセル
  })
}
```

## 開発体験の向上

### React Query DevTools の使用

- 開発環境では必ず DevTools を有効にする
- クエリの状態、キャッシュの内容を視覚的に確認する

**推奨**:
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

## よくある落とし穴

### 1. refetch() の誤用

- パラメータが変わる場合は `refetch()` を呼び出さない
- クエリキーに含めて自動リフェッチを活用する

**非推奨**:
```typescript
// ❌ 古いページ番号でリフェッチされる可能性がある
const [page, setPage] = useState(1)
const { refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: () => apiService.getTodos(page),
})

const onClick = () => {
  setPage(prev => prev + 1)
  refetch() // NG: クエリキーにページが含まれていない
}
```

**推奨**:
```typescript
// ✅ クエリキーが変わり、自動的に新しいデータをフェッチ
const [page, setPage] = useState(1)
const { data } = useQuery({
  queryKey: ['todos', page],
  queryFn: () => apiService.getTodos(page),
})

const onClick = () => {
  setPage(prev => prev + 1) // 自動的にリフェッチ
}
```

### 2. isLoading と isFetching の混同

- **isLoading**: 初回フェッチ時のみ `true`（キャッシュデータがない場合）
- **isFetching**: バックグラウンドリフェッチも含め、すべてのフェッチ時に `true`

```typescript
function UserProfile() {
  const { isLoading, isFetching, data } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
  })

  if (isLoading) {
    return <div>Loading your profile...</div> // 初回のみ表示
  }

  return (
    <div>
      <h1>{data?.name}</h1>
      {isFetching && <span>(Updating...)</span>} {/* バックグラウンド更新中 */}
    </div>
  )
}
```

### 3. Redux/Context へのデータマッピング

- TanStack Query のデータを Redux や Context に dispatch しない
- 2つの状態が競合し、不要なレンダリングが発生する

**根拠**: TanStack Query 自体が状態管理ライブラリであり、同じクエリキーを複数のコンポーネントで使用しても、リクエストは1回だけ実行されます。

**非推奨**:
```typescript
// ❌ 2つの状態が競合する
const useTodos = () => {
  const dispatch = useDispatch()

  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const data = await apiService.getTodos()
      dispatch(setTodos(data)) // 不要な dispatch
      return data
    }
  })
}
```

**推奨**:
```typescript
// ✅ TanStack Query の結果をそのまま使用
const useTodos = () => {
  return useQuery({
    queryKey: ['todos'],
    queryFn: apiService.getTodos,
  })
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
      gcTime: Infinity, // "Jest did not exit" エラーを防ぐ
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

test('custom hook', async () => {
  const { result } = renderHook(() => useCustomHook(), { wrapper })

  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(result.current.data).toEqual('Hello')
})
```

## セキュリティ

### XSS 対策（SSR）

- dehydrated state を安全にシリアライズする
- `JSON.stringify` ではなく `serialize-javascript` または `devalue` を使用する

**非推奨**:
```typescript
// ❌ XSS 脆弱性
const serialized = JSON.stringify(dehydratedState)
```

**推奨**:
```typescript
// ✅ serialize-javascript または devalue を使用
import serialize from 'serialize-javascript'
const serialized = serialize(dehydratedState)
```

## ファイル構成

### 機能ごとの配置

```
src/
  features/
    Profile/
      index.tsx
      queries.ts
    Todos/
      index.tsx
      queries.ts
```

## 参考資料

### 公式ドキュメント

- [TanStack Query 公式ドキュメント](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [Server Rendering & Hydration](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Performance & Request Waterfalls](https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls)

### コミュニティリソース

- [Practical React Query - TkDodo](https://tkdodo.eu/blog/practical-react-query)
- [Effective React Query Keys - TkDodo](https://tkdodo.eu/blog/effective-react-query-keys)
- [Mastering Mutations in React Query - TkDodo](https://tkdodo.eu/blog/mastering-mutations-in-react-query)
- [TkDodo ブログシリーズ（30記事以上）](https://tkdodo.eu/blog/all)
