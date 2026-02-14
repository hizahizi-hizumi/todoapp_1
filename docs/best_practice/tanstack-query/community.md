## 概要

TanStack Query（旧 React Query）は、React アプリケーションにおけるサーバー状態管理のデファクトスタンダードとして、コミュニティで高い評価を得ています。公式ドキュメントだけでなく、実際のプロダクション環境での使用経験から得られた数多くの知見がコミュニティで共有されています。

TanStack Query は単なるデータフェッチングライブラリではなく、キャッシング、バックグラウンド更新、リトライ、エラーハンドリング、リクエストのキャンセルなど、サーバー状態管理に必要なすべての機能を提供します。Apollo Client が GraphQL にもたらした革新を、REST API やあらゆる Promise ベースのデータソースで実現できるツールです。

## セットアップのベストプラクティス

### QueryClient の適切な設定

プロダクション環境では、デフォルト設定をプロジェクトの要件に合わせて調整することが推奨されます。

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 10, // 10分（v5から cacheTime が gcTime に改名）
      retry: 1, // プロダクションでは過度なリトライを避ける
      refetchOnWindowFocus: true, // ユーザーがタブに戻った時に最新データを取得
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* アプリケーション */}
    </QueryClientProvider>
  )
}
```

### React Query DevTools の活用

開発環境では必ず DevTools を有効にすることが強く推奨されています。クエリの状態、キャッシュの内容、バックグラウンドでのリフェッチを視覚的に確認できます。

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

## 実践的な使用パターン

### カスタムフックでクエリをカプセル化

TkDodo（TanStack Query のメンテナー）の推奨パターンとして、各クエリを専用のカスタムフックでラップすることが挙げられています。

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

**メリット**:
- データフェッチングロジックを UI から分離
- 同一クエリキーの使用箇所を一箇所に集約
- 設定変更やデータ変換を一箇所で管理可能

### クエリキーを依存配列のように扱う

クエリキーが変更されると、TanStack Query は自動的にリフェッチを実行します。これを活用して、状態変更に応じた自動更新を実現できます。

```typescript
function TodoList() {
  const [filter, setFilter] = useState<'all' | 'done' | 'open'>('all')
  
  // filter が変更されると自動的に新しいデータをフェッチ
  const { data } = useQuery({
    queryKey: ['todos', filter],
    queryFn: () => fetchTodos(filter),
  })

  return (
    <>
      <FilterButtons onFilterChange={setFilter} />
      <TodoItems todos={data} />
    </>
  )
}
```

**重要**: `refetch()` を手動で呼び出すのは、**まったく同じパラメータで再フェッチする場合のみ**です。パラメータが変わる場合は、クエリキーに含めて自動リフェッチを活用します。

### サーバー状態とクライアント状態の分離

TanStack Query から取得したデータを `useState` にコピーしてはいけません。これはバックグラウンド更新の恩恵を失う原因となります。

```typescript
// ❌ アンチパターン
function BadExample() {
  const { data } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  const [user, setUser] = useState()
  
  useEffect(() => {
    if (data) setUser(data)
  }, [data])
  
  return <div>{user?.name}</div>
}

// ✅ 推奨パターン
function GoodExample() {
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
  
  return <div>{user?.name}</div>
}
```

**例外**: フォームの初期値としてデータを使用する場合は、`staleTime: Infinity` を設定してバックグラウンド更新を無効化します。

### クエリキーファクトリーパターン

複雑なアプリケーションでは、クエリキーを体系的に管理するファクトリーパターンが推奨されています。

```typescript
const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}

// 使用例
queryClient.invalidateQueries({ queryKey: todoKeys.lists() }) // すべてのリストを無効化
queryClient.prefetchQuery({ queryKey: todoKeys.detail(5), queryFn: () => fetchTodo(5) })
queryClient.removeQueries({ queryKey: todoKeys.all }) // todos 関連のすべてを削除
```

### AbortSignal による自動リクエストキャンセル

TanStack Query は、コンポーネントがアンマウントされたりクエリが古くなった場合、自動的に `AbortSignal` を提供します。

```typescript
const fetchProjects = async ({ signal }: { signal?: AbortSignal }) => {
  const res = await fetch('/api/projects', { signal })
  return res.json()
}

function ProjectsList() {
  const { data } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })
  
  // コンポーネントがアンマウントされると、進行中のリクエストは自動的にキャンセルされる
  return <div>{/* プロジェクト表示 */}</div>
}
```

## CI/CD統合

### SSR/SSG での使用（Next.js との統合）

TanStack Query は Next.js の SSR/SSG と優れた統合を提供します。

```typescript
// app/posts/page.tsx (Next.js App Router)
import { QueryClient, dehydrate } from '@tanstack/react-query'

async function fetchPosts() {
  const r = await fetch('https://jsonplaceholder.typicode.com/posts')
  return r.json()
}

export default async function PostsPage() {
  const queryClient = new QueryClient()
  
  // サーバーサイドでデータをプリフェッチ
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Posts />
    </HydrationBoundary>
  )
}
```

### Prefetching パターン

ナビゲーション前にデータをプリフェッチすることで、UX を大幅に向上できます。

```typescript
function UserList() {
  const queryClient = useQueryClient()
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
  
  // ホバー時にユーザー詳細をプリフェッチ
  const handleMouseEnter = (userId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
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

## よくある問題と解決策

### 1. Redux/Context へのデータマッピング（アンチパターン）

Redux や Context から TanStack Query に移行する際、以前の習慣を引きずってデータを Redux に dispatch してしまうケースがあります。

```typescript
// ❌ アンチパターン
const useTodos = () => {
  const dispatch = useDispatch()

  return useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      dispatch(setLoading(true))
      const data = await apiService.getTodos()
      dispatch(setTodos(data))
      dispatch(setLoading(false))
      return data
    }
  })
}
```

**問題点**:
- 2つの状態が競合する
- TanStack Query のキャッシュ機構を活用できない
- 不要なレンダリングが発生

**解決策**: TanStack Query の結果をそのまま使用します。同じクエリキーを複数のコンポーネントで使用しても、リクエストは1回だけ実行されます。

### 2. refetch() の誤用

パラメータが変わるたびに `refetch()` を呼び出すのは誤りです。

```typescript
// ❌ アンチパターン
const [page, setPage] = useState(1)
const { refetch } = useQuery({
  queryKey: ['todos'], // ページが含まれていない
  queryFn: () => apiService.getTodos(page),
})

const onClick = () => {
  setPage(prev => prev + 1)
  refetch() // 古いページ番号でリフェッチされる可能性がある
}
```

**解決策**: パラメータをクエリキーに含めます。

```typescript
// ✅ 推奨パターン
const [page, setPage] = useState(1)
const { data } = useQuery({
  queryKey: ['todos', page],
  queryFn: () => apiService.getTodos(page),
})

const onClick = () => {
  setPage(prev => prev + 1) // クエリキーが変わり、自動的に新しいデータをフェッチ
}
```

### 3. ローディング状態とフェッチ状態の混同

`isLoading` と `isFetching` は異なる意味を持ちます。

- **isLoading**: 初回フェッチ時のみ `true`（キャッシュデータがない場合）
- **isFetching**: バックグラウンドリフェッチも含め、すべてのフェッチ時に `true`

```typescript
function UserProfile() {
  const { isLoading, isFetching, data } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => fetch('/api/user').then(res => res.json()),
  })

  if (isLoading) {
    return <div>Loading your profile...</div> // 初回のみ表示
  }

  return (
    <div>
      <h1>{data.name}</h1>
      {isFetching && <span>(Updating...)</span>} {/* バックグラウンド更新中 */}
      <p>{data.bio}</p>
    </div>
  )
}
```

### 4. staleTime と gcTime の混同

- **staleTime**: データが「fresh」から「stale」になるまでの時間。デフォルトは `0`（即座に stale）
- **gcTime** (旧 cacheTime): 非アクティブなクエリがキャッシュから削除されるまでの時間。デフォルトは `5分`

多くの場合、調整が必要なのは `staleTime` です。

```typescript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 1000 * 60 * 5, // 5分間は fresh として扱う（リフェッチしない）
})
```

## パフォーマンス最適化

### Structural Sharing による参照の最適化

TanStack Query は、データが変わらない場合、可能な限り元の参照を維持します。これにより、不要な再レンダリングを防ぎます。

### Select オプションによるデータ変換

`select` オプションを使用すると、選択したデータが変更された場合のみ再レンダリングが発生します。

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

**注意**: インライン関数として `select` を定義すると、毎レンダリングで実行されます。重い処理の場合は `useCallback` でメモ化してください。

### Request Waterfall の回避

コンポーネント内で連鎖的にクエリを実行すると、パフォーマンスが低下します。

```typescript
// ❌ アンチパターン（Waterfall）
function UserPosts() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
  })
  
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user.id),
    enabled: !!user, // user が取得されるまで待機
  })
}
```

**解決策**: プリフェッチやルーターレベルでのデータローディングを活用します。

### 無限スクロールとページネーション

`useInfiniteQuery` を使用して効率的な無限スクロールを実装できます。

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

const fetchPaginatedData = async ({ pageParam = 0 }) => {
  const response = await fetch(`/api/items?page=${pageParam}`)
  return response.json()
}

export function InfiniteScrollList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['infinite-items'],
    queryFn: fetchPaginatedData,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  return (
    <div>
      {data?.pages.map((page) => (
        page.items.map(item => <div key={item.id}>{item.name}</div>)
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## チーム開発での運用

### クエリキーの統一規約

チーム全体でクエリキーの命名規則を統一することが重要です。

**推奨される構造**:
```typescript
['feature', 'type', ...parameters]
```

例:
- `['todos', 'list', { filter: 'all' }]`
- `['todos', 'detail', 1]`
- `['users', 'list', { page: 1, limit: 20 }]`

### ファイル構成のベストプラクティス

クエリは機能ごとに配置し、`queries.ts` ファイルでカプセル化します。

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

### 楽観的更新パターン

ミューテーション後の即座な UI 更新により、UX を向上できます。

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useUpdateTodo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
      // 進行中のリフェッチをキャンセル
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      
      // 以前のデータを保存（ロールバック用）
      const previousTodos = queryClient.getQueryData(['todos'])
      
      // 楽観的更新
      queryClient.setQueryData(['todos'], (old) =>
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
}
```

## 参考リンク

### TkDodo の必読ブログシリーズ

TanStack Query のメンテナーである TkDodo による、コミュニティで最も評価されているブログシリーズ:

- [#1: Practical React Query](https://tkdodo.eu/blog/practical-react-query) - デフォルト設定の理解、enabled オプション、カスタムフック
- [#8: Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys) - クエリキーの構造化とファクトリーパターン
- [#12: Mastering Mutations in React Query](https://tkdodo.eu/blog/mastering-mutations-in-react-query) - ミューテーションと楽観的更新
- [#16: React Query meets React Router](https://tkdodo.eu/blog/react-query-meets-react-router) - ルーターとの統合パターン

完全なシリーズ（30記事以上）: https://tkdodo.eu/blog/all

### コミュニティリソース

- [公式 Community Resources](https://tanstack.com/query/v5/docs/community-resources) - TanStack Query 公式ドキュメント
- [Avoiding Common Mistakes with TanStack Query Part 1](https://buncolak.com/posts/avoiding-common-mistakes-with-tanstack-query-part-1/) - 典型的なアンチパターンの解説
- [3 TanStack Query Features That Transform Production React Apps](https://dev.to/martinrojas/3-tanstack-query-features-that-transform-production-react-apps-196b) - プロダクション向け高度な機能
- [Boost Next.js Performance with TanStack Query](https://www.aniq-ui.com/en/blog/boost-nextjs-performance-tanstack-query) - Next.js との統合ベストプラクティス

### 動画リソース

- [TanStack Query - How to Master God-Tier React Query](https://www.youtube.com/watch?v=KkxPtimqaew) - 90分の包括的チュートリアル
- [React Query: It's Time to Break up with your Global State!](https://www.youtube.com/watch?v=seU46c6Jz7E) - Tanner Linsley による基調講演
- [All About React Query (with Tanner Linsley)](https://www.learnwithjason.dev/all-about-react-query) - Learn With Jason

### 公式コース

- [Query.gg - The Official React Query Course](https://query.gg/?s=dom) - TkDodo と ui.dev による公式コース
