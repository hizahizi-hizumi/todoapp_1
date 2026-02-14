---
name: coding-pattern.create
description: 'glob パターンに一致するファイルを分析してコーディング規約 instructions ファイルを作成'
argument-hint: 'glob=glob パターン fileName=生成されるファイル名（拡張子なし）'
tools: ['search/fileSearch', 'read', 'edit/createFile', 'todo']
---
​
# コーディング規約作成
​
## 目的
指定された glob パターンに一致するファイルを分析し、共通するパターンとベストプラクティスを抽出して `.github/instructions/` ディレクトリにコーディング規約ファイルを作成
​
## 入力
- glob:例: `functions/storages/*.py` - 分析対象ファイルの glob パターン
- fileName:例: `python` - 生成されるコーディング規約ファイル名（拡張子なし）
​
## 入力検証
glob パターンが欠落している場合:
1. ユーザーに有効な glob パターンの入力を求める
2. 例を提示: `functions/storages/*.py`, `functions/**/utils/*.py`
3. パターンが提供されるまで実行を停止
​
## ワークフロー
​
### フェーズ 0: todo リスト作成
下記のタスクを #tool:todo で管理し実行する
​
1. ファイル収集と分析
2. パターン抽出
3. Instructions ファイル規約の理解
4. コーディング規約ファイル作成
​
### フェーズ 1: ファイル収集と分析
1. #tool:search/fileSearch で `${input:glob}` に一致するファイルを検索
2. 一致するファイルが 0 件の場合、ユーザーに報告して停止
3. #tool:read/readFile で各ファイルの内容を読み取る（並列実行可能）
​
### フェーズ 2: パターン抽出
各ファイルのコードを分析し、以下の共通パターンを特定:
- 命名規則（クラス、メソッド、変数、ファイル名）
- コード構造とアーキテクチャパターン
- 一般的な実装パターン
- エラーハンドリングのアプローチ
- ドキュメンテーションスタイル
- テストパターン（該当する場合）
​
### フェーズ 3: Instructions ファイル規約の理解
#tool:read/readFile を使用して `.github/instructions/instructions.instructions.md` を読み込み、instructions ファイルの作成規約を理解
​
### フェーズ 4: コーディング規約ファイル作成
1. 抽出したパターンに基づき、`.github/instructions/` ディレクトリに新しい `${input:fileName}.coding-pattern.instructions.md` ファイルを作成
2. frontmatter の `applyTo` フィールドに `${input:glob}` を設定
3. frontmatter の `description` フィールドに規約の要約を記載
​
## 出力構造
​
作成するファイル: `.github/instructions/${input:fileName}.coding-pattern.instructions.md`
​
```markdown
---
description: '[領域の説明]'
applyTo: '${input:glob}'
---
​
# [領域名] コーディング規約
​
## 概要
[この規約の目的と適用範囲]
​
## 命名規則
[抽出した命名規則]
​
## アーキテクチャパターン
[抽出したアーキテクチャパターン]
​
## 実装パターン
[抽出した実装パターン]
​
## エラーハンドリング
[抽出したエラーハンドリングのアプローチ]
​
## ドキュメンテーション
[抽出したドキュメンテーションスタイル]
​
## テスト（該当する場合）
[抽出したテストパターン]
​
## 例
[良い例と悪い例]
```
​
## 要件
- 抽出したパターンは具体的なコード例を含める
- 推奨される実装と非推奨の実装を明確に区別
- 既存コードとの一貫性を保つための具体的なガイドラインを提供
- instructions.instructions.md の規約に準拠した frontmatter を使用
​
## エラーハンドリング
​
### ファイルが見つからない場合
1. ユーザーに glob パターンが正しいか確認
2. プロジェクトルートからの相対パスであることを確認
3. 修正したパターンの入力を求めて停止
​
### 分析可能なパターンが不十分な場合
1. 少なくとも 3 件以上のファイルが必要であることを報告
2. より広範な glob パターンの使用を提案
3. ユーザーの判断を求める