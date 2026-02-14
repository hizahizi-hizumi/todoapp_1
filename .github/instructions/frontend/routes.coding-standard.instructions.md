---
description: 'routes ディレクトリのコーディング規約'
applyTo: 'frontend/src/routes/**/*.ts, frontend/src/routes/**/*.tsx'
---

# routes ディレクトリのコーディング規約

`routes` ディレクトリ内のファイルは、TanStack Router を使用してアプリケーションのルーティングをファイルベースで定義する。

## 責務

パスルーティングのみに責務を持つ。
コンポーネントロジックや UI は、対応する `pages` ディレクトリ内のコンポーネントに委譲する。

### 関連ディレクトリ

- **routes/**: ルーティング設定のみ（パス定義、loader、wrapper、型定義）
- **pages/**: 表示ロジックのみ（UIコンポーネント、ビジネスロジック）

## 禁止事項

- Flat Routes の使用禁止。
  - Directory Routes のみ使用する。

## ルーティング定義の命名規則

- 各ルートファイルは `route.tsx` または `route.lazy.tsx` と命名する。
  - ルートファイルはディレクトリ内に配置（例：`src/routes/about.tsx` -> `src/routes/about/route.tsx`）。
- ルートファイルは、対応する URL パスに基づいてディレクトリに配置する。
  - 例：`/about` ルートは `src/routes/about/route.tsx` に配置。

## URLパラメータの受け渡し

- URLパラメータは、`Route.useParams` フックを使用して取得する。
- 取得したパラメータはラッパーから props 経由でページコンポーネントに渡す。

```tsx
// src/routes/users/$id/route.tsx
import { createFileRoute } from '@tanstack/react-router'

import { IdPage } from '@/pages/users/IdPage'

export const Route = createFileRoute('/users/$id')({
  component: IdWrapper,
})

function IdWrapper() {
  const { id } = Route.useParams()

  return <IdPage id={id} />
}
```