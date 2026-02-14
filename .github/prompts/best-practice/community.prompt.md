---
name: best-practice.community
description: 'ウェブ検索でコミュニティのベストプラクティスをまとめて community.md を作成'
argument-hint: tool, additionalUrls(Optional)
tools: ['read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'web/fetch', 'ms-vscode.vscode-websearchforcopilot/websearch']
---

# コミュニティのベストプラクティスを収集

ウェブ検索を使用して指定されたツール・技術のコミュニティで推奨されるベストプラクティスを収集し、`community.md` として体系化します。

## 主な目的

公式ドキュメント以外の情報源（ブログ記事、技術記事、Stack Overflow、GitHub Discussions など）から実践的なベストプラクティスを収集し、コミュニティの知見を文書化します。

## 必須入力

- `tool`: ツールまたは技術の名前 (例: Bun, Biome, Vitest)

## 任意入力

- `additionalUrls`: 追加で探索すべきドキュメントのURLリスト（カンマ区切り）

## 入力検証

入力が不足している場合は、ユーザーにツール名の正確な表記を確認してから作業を開始してください。

## 実行ワークフロー

### Phase 1: ウェブ検索の実行

1. **ディレクトリ準備**
   - `docs/best_practice/${input:tool}/` ディレクトリが存在することを確認
   - 存在しない場合は作成

2. **複数の検索クエリを実行**
   - #tool:ms-vscode.vscode-websearchforcopilot/websearch を使用
   - 以下の検索キーワードで並行検索を実行：
     - `"${input:tool}" best practices`
     - `"${input:tool}" production guide`
     - `"${input:tool}" security recommendations`
     - `"${input:tool}" performance optimization`
     - `"${input:tool}" common pitfalls`
     - `"${input:tool}" tips and tricks`
   - ${input:additionalUrls} が指定されている場合は、それらのURLからも #tool:web/fetch でコンテンツを取得

3. **検索結果の評価**
   - 信頼性の高い情報源を優先（公式ブログ、有名技術サイト、実績のある開発者のブログ）
   - 少なくとも5つ以上の異なる情報源から知見を収集
   - 古い情報と新しい情報を区別

### Phase 2: 情報の分析と整理

1. **共通パターンの抽出**
   - 複数の情報源で言及されているベストプラクティスを特定
   - ${input:additionalUrls} からの情報も分析に含める
   - 実践的な使用例やパターンを収集
   - コミュニティで議論されている問題点を把握

2. **カテゴリ分類**
   - セットアップと初期設定
   - 日常的な使用パターン
   - トラブルシューティング
   - パフォーマンス最適化
   - チーム開発での運用
   - 移行とアップグレード

### Phase 3: ドキュメント作成

1. **community.md の作成**
   - `docs/best_practice/${input:tool}/community.md` を作成
   - 既存ファイルがある場合は内容を更新
   - 日本語で記述

2. **構成要件**
   - H2（`##`）から始まる階層構造
   - 各セクションは以下を含む：
     - コミュニティ推奨事項
     - 実践例（コードブロック付き）
     - 情報源へのリンク
   - 公式ドキュメントにない実践的な知見を重視

## 出力構造

作成する `docs/best_practice/${input:tool}/community.md` は以下の構造に従ってください：

```markdown
## 概要

[コミュニティでの評価と主な使用シーン]

## セットアップのベストプラクティス

[実際のプロジェクトで推奨される設定]

## 実践的な使用パターン

### 開発環境での活用

[開発者の経験から得られた知見]

### CI/CD統合

[実際の統合例とコツ]

## よくある問題と解決策

[コミュニティで報告された問題とその解決方法]

## パフォーマンス最適化

[実測値に基づく最適化手法]

## チーム開発での運用

[実際のチームでの運用事例]

## 参考リンク

[情報源となったブログ記事や技術記事へのリンク]
```

## 要件

- すべてのMarkdownファイルは `.github/instructions/markdown.instructions.md` の標準に準拠
- コードサンプルは適切なシンタックスハイライトを使用
- 情報源として参考URLを明記（信頼性の確認可能性）
- 公式情報とコミュニティ情報を明確に区別
- 日本語で自然で読みやすい文章

## 完了条件

- [ ] 少なくとも5つ以上の異なる情報源から知見を収集している
- [ ] `docs/best_practice/${input:tool}/community.md` が作成または更新されている
- [ ] community.md が実践的で具体的な内容である
- [ ] 参考リンクが適切に記載されている
- [ ] 公式ドキュメントにない独自の知見が含まれている

## エラー処理

### 検索結果が不十分な場合
1. 検索キーワードを調整して再試行
2. 英語での検索を試行
3. 関連技術での検索も実施
4. 収集できた情報をユーザーに報告

### 情報の信頼性が不明な場合
1. 複数の情報源で確認
2. 公式ドキュメントとの整合性を確認
3. 不確実な情報は「要検証」として明示

## 禁止事項

- 未検証の情報を事実として記載しない
- 古いバージョンの情報を最新のものとして扱わない
- 信頼性の低い情報源のみに依存しない
- 矛盾する情報がある場合は両論を併記し、判断材料を提供

## 参考資料

- リポジトリ内の既存ドキュメント: `docs/best_practice/` ディレクトリ
- Markdown標準: `.github/instructions/markdown.instructions.md`
