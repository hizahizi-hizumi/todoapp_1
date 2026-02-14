## 開発サーバー起動

.env からポート番号を指定して起動
```sh
bun --env-file=.env run dev
```

## ローカルでのデプロイ手順

### フロントエンド

プロジェクトルートにて

初回実行時にのみPagesの初期化が必要
```sh
bun --env-file=.env run deploy:init-frontend
```

```sh
bun --env-file=.env run build:frontend
bun --env-file=.env run deploy:frontend
```