---
name: best-practice.update-instructions
description: 'official.md と community.md を基に既存の instructions ファイルを更新'
argument-hint: tool
tools: ['read/readFile', 'edit/editFiles']
---

# ベストプラクティスから既存の instructions ファイルを更新

`official.md` と `community.md` に記載されたベストプラクティスを統合し、既存の GitHub Copilot 用 instructions ファイルを更新します。

## 主な目的

公式ドキュメントとコミュニティの知見を組み合わせ、既存の instructions ファイルに不足している情報を追加し、古い情報を更新します。

## 必須入力

- `${input:tool}`: ツールまたは技術の名前 (例: Bun, Biome, Vitest)

## 入力検証

入力が不足している場合は、ユーザーにツール名の正確な表記を確認してから作業を開始してください。

## 前提条件チェック

作業開始前に以下のファイルが存在することを確認：

1. `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` （更新対象）
2. `docs/best_practice/${input:tool}/official.md` （ソース情報）
3. `docs/best_practice/${input:tool}/community.md` （ソース情報）

### 更新対象ファイルが存在しない場合

`.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` が存在しない場合は、以下のメッセージをユーザーに表示し、作業を中断：

```
指定されたツール「${input:tool}」の instructions ファイルが見つかりません。
新規作成する場合は、以下のプロンプトを実行してください：
#file:create-instructions.prompt.md
```

### ソースファイルが存在しない場合

`official.md` または `community.md` が存在しない場合は、以下のメッセージをユーザーに表示し、作業を中断：

- `official.md` が不足している場合：

```
「${input:tool}」の公式ドキュメントベストプラクティスが見つかりません。
先に以下のプロンプトを実行してください：
#file:official.prompt.md
```

- `community.md` が不足している場合：

```
「${input:tool}」のコミュニティベストプラクティスが見つかりません。
先に以下のプロンプトを実行してください：
#file:community.prompt.md
```

## 命名規則

instructions ファイル名は `${input:tool}` からケバブケースを導出して使用します：

- 変換ルール: 小文字化 → 英数字以外は `-` に置換 → `-` の連続は1つに圧縮 → 先頭末尾の `-` を除去
- 例: `Google Cloud` → `google-cloud`、`MyTool` → `my-tool`、`my_tool` → `my-tool`

最終的なファイル名: `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md`

## 実行ワークフロー

### Phase 1: 既存内容の確認

1. **既存 instructions の読み込み**
   - #tool:read/readFile で `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` を読み込む
   - 現在のセクション構成と内容を把握
   - frontmatter (`description`, `applyTo`) を確認

2. **official.md の読み込み**
   - #tool:read/readFile で `docs/best_practice/${input:tool}/official.md` を読み込む
   - 公式推奨事項を抽出

3. **community.md の読み込み**
   - #tool:read/readFile で `docs/best_practice/${input:tool}/community.md` を読み込む
   - コミュニティの実践的な知見を抽出

### Phase 2: 差分分析

1. **不足情報の特定**
   - official.md / community.md にあって、既存 instructions にない情報をリストアップ
   - 特に以下の観点で確認：
     - 新しいベストプラクティス
     - セキュリティ上の考慮事項
     - パフォーマンス最適化手法
     - よくある落とし穴と回避方法

2. **古い情報の特定**
   - 既存 instructions にあって、official.md / community.md で推奨されていない、または変更された情報を特定
   - 非推奨となった設定やパターン
   - バージョンアップにより不要となった回避策

3. **改善可能な箇所の特定**
   - 抽象的すぎる指示を具体化できる箇所
   - コード例が不足している箇所
   - 説明が不十分な箇所

### Phase 3: instructions ファイルの更新

1. **Frontmatter の更新（必要に応じて）**
   - `description` が不正確な場合は修正
   - `applyTo` パターンが不足している場合は追加

2. **本文の更新**
   - 不足している情報を適切なセクションに追加
   - 古い情報を削除または更新
   - 抽象的な指示を具体化
   - コード例を追加または改善
   - `.github/instructions/instructions.instructions.md` のガイドラインに準拠

3. **整合性の確保**
   - セクション間で矛盾がないか確認
   - 命令形の統一（「使用する」「避ける」「検証する」）
   - コードブロックのシンタックスハイライトの統一

## 更新方針

### 追加する内容

- 新しいベストプラクティス（official または community から）
- 具体的なコード例（既存の抽象的な指示を補完）
- セキュリティやパフォーマンスに関する重要な考慮事項
- よくある落とし穴とその回避方法

### 更新する内容

- 古くなった設定やパターン
- 不正確または曖昧な記述
- 非推奨となった手法

### 保持する内容

- 既存の正確で有用な情報
- プロジェクト固有のルール（official/community と矛盾しない限り）
- 既存のコード例（改善の余地がない場合）

### 削除する内容

- 明確に非推奨となった情報
- official/community と矛盾する情報（公式を優先）
- 重複する記述

## 要件

- すべての指示は `.github/instructions/instructions.instructions.md` のガイドラインに準拠
- Markdown標準は `.github/instructions/markdown.instructions.md` に準拠
- 日本語で自然で読みやすい文章
- コード例は適切なシンタックスハイライトを使用
- 各指示に「なぜ」の説明を1-2文で補足（該当する場合）
- 既存の構造とトーンを尊重

## 完了条件

- [ ] `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` が存在することを確認
- [ ] `docs/best_practice/${input:tool}/official.md` を読み込んでいる
- [ ] `docs/best_practice/${input:tool}/community.md` を読み込んでいる
- [ ] 不足している情報を追加している
- [ ] 古い情報を更新または削除している
- [ ] Frontmatter が適切である
- [ ] 指示が具体的で実行可能である
- [ ] 推奨例と非推奨例が適切に含まれている
- [ ] 公式とコミュニティの知見が統合されている

## 品質チェックリスト

更新後、以下を確認：

- [ ] 各指示は単一の概念を表現している
- [ ] 抽象的な表現（「適切に」「必要に応じて」など）を避けている
- [ ] 命令形の動詞で始まっている（「使用する」「避ける」など）
- [ ] コード例が実際に動作する内容である
- [ ] applyTo パターンが適切なファイルをターゲットしている
- [ ] 他の instructions ファイルと矛盾していない
- [ ] 既存の有用な情報が失われていない

## エラー処理

### 更新対象ファイルが見つからない場合
1. ファイルパスを確認
2. ユーザーに #file:create-instructions.prompt.md を実行するよう案内
3. 作業を中断

### ソースファイルが見つからない場合
1. 不足しているファイルを特定
2. ユーザーに該当するプロンプト（official または community）を先に実行するよう依頼
3. 作業を中断

### 矛盾する情報がある場合
1. 公式 > コミュニティ > 既存 instructions の優先順位で判断
2. 両論を併記する場合は、どちらが公式見解かを明示
3. ユーザーに判断を求める場合は、選択肢を明確に提示

## 禁止事項

- 既存の有用な情報を無断で削除しない
- 検証していない情報を追加しない
- 既存の構造を大幅に変更しない（改善の余地がある場合を除く）
- 抽象的で曖昧な指示を追加しない
- 複数の概念を1つの指示にまとめない

## 更新履歴の記録

更新完了後、ユーザーに以下の情報を提供：

1. **追加した内容の概要**
   - 新しく追加したセクションやベストプラクティス

2. **更新した内容の概要**
   - 修正した古い情報

3. **削除した内容の概要**（該当する場合）
   - 非推奨となった情報

## 参考資料

- Instructions作成ガイドライン: `.github/instructions/instructions.instructions.md`
- Markdown標準: `.github/instructions/markdown.instructions.md`
- 既存の instructions ファイル: `.github/instructions/` ディレクトリ
