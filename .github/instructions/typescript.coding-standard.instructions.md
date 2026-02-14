---
description: 'TypeScript のコーディング規約'
applyTo: '**/*.ts, **/*.tsx'
---

# TypeScript のコーディング規約

## 基本原則

- 1ファイル1エクスポート
- 関数定義は関数宣言を使用

## 命名規則

- 変数名、関数名、プロパティ名はキャメルケース（例: `myVariable`, `getUserName`）を使用してください。
- クラス名、インターフェース名、型エイリアス名はパスカルケース（例: `MyClass`, `IUser`）を使用してください。

## ファイル命名規則

- ts ファイルはエクスポート対象の名前をケバブケースに変換したものを使用してください（例: `export functions myFunction` -> `my-function.ts`）。
- tsx ファイルはコンポーネント名をそのままを使用してください（例: `export function MyComponent` -> `MyComponent.tsx`）。