---
name: best-practice.official
description: '公式ドキュメントからベストプラクティスをまとめて official.md を作成'
argument-hint: tool, url, additionalUrls(Optional)
tools: ['read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'web/fetch', 'agent']
---

# 公式ドキュメントからベストプラクティスを収集

指定されたツール・技術について、公式ドキュメントを探索してベストプラクティスをまとめ、`official.md` として体系化します。

## 主な目的

公式ドキュメントから推奨される設定、パターン、考慮事項を収集し、包括的なベストプラクティスドキュメントを作成します。

## 必須入力

- `tool`: ツールまたは技術の名前 (例: Bun, Biome, Vitest)
- `url`: 公式ドキュメントのベースURL (例: https://bun.com/docs)

## 任意入力

- `additionalUrls`: 追加で探索すべき公式ドキュメントやチェンジログのURLリスト（カンマ区切り）

## 入力検証

入力が不足している場合は、ユーザーに以下を確認してから作業を開始してください：
- ツール名の正確な表記
- 公式ドキュメントの有効なURL

## 実行ワークフロー

### Phase 1: 公式ドキュメントの探索

1. **ディレクトリ準備**
   - `docs/best_practice/${input:tool}/` ディレクトリが存在することを確認
   - 存在しない場合は作成

2. **URL一覧の作成**
   - #tool:agent/runSubagent を使用してサブエージェントに委譲
   - 指示内容: `#tool:web/fetch を使用し ${input:tool} の公式ドキュメント ${input:url} を再帰的に探索し、ベストプラクティス作成に参考にするべきドキュメントのURLをまとめる。まとめた結果を docs/best_practice/${input:tool}/url.md に記載する`
   - ${input:additionalUrls} が指定されている場合は、それらのURLも探索対象に含める
   - 既存の `url.md` がある場合は内容を更新

3. **URL一覧の読み込み**
   - #tool:read/readFile で `docs/best_practice/${input:tool}/url.md` を読み込む
   - 10件以上のURLがリストされていることを確認

### Phase 2: 公式ドキュメントの取得と整理

1. **ドキュメントの取得**
   - #tool:web/fetch を使用し、url.md に記載された主要URLからコンテンツを取得
   - ${input:additionalUrls} で指定されたURLからもコンテンツを取得
   - 重要度の高いページ（Getting Started, Best Practices, Configuration など）を優先

2. **ベストプラクティスの抽出**
   - 公式推奨の設定やパターン
   - セキュリティとパフォーマンスの考慮事項
   - 非推奨事項とマイグレーションガイド
   - よくある落とし穴と回避方法

### Phase 3: ドキュメント作成

1. **official.md の作成**
   - `docs/best_practice/${input:tool}/official.md` を作成
   - 既存ファイルがある場合は内容を更新
   - 日本語で記述

2. **構成要件**
   - H2（`##`）から始まる階層構造
   - 各セクションは以下を含む：
     - 公式推奨事項
     - 設定例（コードブロック付き）
     - 注意点や制約
   - 具体的なコード例とアンチパターン

## 出力構造

作成する `docs/best_practice/${input:tool}/official.md` は以下の構造に従ってください：

```markdown
## 概要

[ツールの公式説明と主要機能]

## 推奨設定

### 基本設定

[公式推奨の基本設定]

### 環境別設定

[開発環境、本番環境など]

## セキュリティ

[公式のセキュリティガイドライン]

## パフォーマンス

[公式のパフォーマンス最適化推奨事項]

## よくある落とし穴

[公式ドキュメントで警告されている内容]

## 参考リンク

[公式ドキュメントへのリンク]
```

## 要件

- すべてのMarkdownファイルは `.github/instructions/markdown.instructions.md` の標準に準拠
- コードサンプルは適切なシンタックスハイライトを使用
- 情報源として公式ドキュメントのURLを明記
- 日本語で自然で読みやすい文章

## 完了条件

- [ ] `docs/best_practice/${input:tool}/url.md` に10件以上の関連URLがリストされている
- [ ] `docs/best_practice/${input:tool}/official.md` が作成または更新されている
- [ ] official.md が包括的で実践的な内容である
- [ ] 公式推奨事項が明確に記載されている
- [ ] コード例が適切に含まれている

## エラー処理

### 公式ドキュメントへのアクセス失敗
1. ユーザーにURLの確認を求める
2. 代替URLを提案
3. 手動での情報提供を依頼

### 情報が不十分な場合
1. 追加の探索が必要なセクションを特定
2. 検索範囲を拡大
3. 不足部分をユーザーに報告

## 参考資料

- リポジトリ内の既存ドキュメント: `docs/best_practice/` ディレクトリ
- Markdown標準: `.github/instructions/markdown.instructions.md`
