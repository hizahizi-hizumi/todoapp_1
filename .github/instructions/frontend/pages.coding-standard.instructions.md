---
description: 'pages ディレクトリのコーディング規約'
applyTo: 'frontend/src/pages/**/*.ts, frontend/src/pages/**/*.tsx'
---

# pages ディレクトリのコーディング規約

`pages` ディレクトリ内のファイルは `routes` ディレクトリ内のルーティング設定に1対1で対応し、対応する表示ロジックを実装します。

## 責務

UI コンポーネントとビジネスロジックの実装に責務を持つ。
パスルーティングロジックは、対応する `routes` ディレクトリ内のルートファイルが担います。


### 関連ディレクトリ

- **routes/**: ルーティング設定のみ（パス定義、loader、wrapper、型定義）
- **pages/**: 表示ロジックのみ（UIコンポーネント、ビジネスロジック）

## 命名規則

- 各ページコンポーネントファイルは、対応するルート名に基づいて命名してください
  - 例
    - `routes/about/route.tsx` -> `pages/AboutPage.tsx`
    - `routes/users/$id/route.tsx` -> `pages/users/IdPage.tsx`
- 各ページコンポーネントは、`<RouteName>Page` という名前でエクスポートしてください
  - 例
    - `AboutPage`
    - `IdPage`

## URLパラメータの取得

- URLパラメータは props 経由で取得する。

```tsx
// src/pages/users/IdPage.tsx
type IdPageProps = {
  id: string;
};

export function IdPage({ id }: IdPageProps) {
  return <div>User ID: {id}</div>;
}
```