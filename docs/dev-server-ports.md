# 開発サーバーのポート設定

バックエンド、フロントエンド、Storybookの各開発サーバーのポートを環境変数で指定できるようになりました。

## 設定方法

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください:

```bash
# Backend (Wrangler) dev server port
BACKEND_PORT=8787

# Frontend (Vite) dev server port  
FRONTEND_PORT=5173

# Storybook dev server port
STORYBOOK_PORT=6006
```

`.env.example` ファイルにデフォルト値が記載されています。

## デフォルトポート

環境変数が設定されていない場合は、以下のデフォルトポートが使用されます:

- **バックエンド**: 8787
- **フロントエンド**: 5173
- **Storybook**: 6006

## 使用例

他のプロジェクトとポートが競合する場合は、`.env` ファイルで別のポート番号を指定してください:

```bash
BACKEND_PORT=9000
FRONTEND_PORT=4000
STORYBOOK_PORT=7000
```
