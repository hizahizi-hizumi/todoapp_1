---
name: best-practice.create-instructions
description: 'official.md と community.md を基に instructions ファイルを作成'
argument-hint: tool
tools: ['read/readFile', 'edit/createFile', 'edit/editFiles']
---

# ベストプラクティスから instructions ファイルを作成

`official.md` と `community.md` に記載されたベストプラクティスを統合し、GitHub Copilot 用の高品質な instructions ファイルを作成します。

## 主な目的

公式ドキュメントとコミュニティの知見を組み合わせ、実用的で明確な instructions ファイルを生成します。このファイルは GitHub Copilot がコードを生成する際のガイドラインとして機能します。

## 必須入力

- `${input:tool}`: ツールまたは技術の名前 (例: Bun, Biome, Vitest)

## 入力検証

入力が不足している場合は、ユーザーにツール名の正確な表記を確認してから作業を開始してください。

## 前提条件チェック

作業開始前に以下のファイルが存在する/しないことを確認：

1. `docs/best_practice/${input:tool}/official.md` （ソース情報）
2. `docs/best_practice/${input:tool}/community.md` （ソース情報）
3. `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` （作成対象）

### 作成対象ファイルが既に存在する場合

`.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` が既に存在する場合は、以下のメッセージをユーザーに表示し、作業を中断：

```
指定されたツール「${input:tool}」の instructions ファイルは既に存在します。
更新する場合は、以下のプロンプトを実行してください：
#file:update-instructions.prompt.md
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

### Phase 1: ベストプラクティスの読み込み

1. **official.md の読み込み**
   - #tool:read/readFile で `docs/best_practice/${input:tool}/official.md` を読み込む
   - 公式推奨事項を抽出

2. **community.md の読み込み**
   - #tool:read/readFile で `docs/best_practice/${input:tool}/community.md` を読み込む
   - コミュニティの実践的な知見を抽出

### Phase 2: コンテンツの統合と整理

1. **重複の排除**
   - official.md と community.md で重複する内容を特定
   - より具体的または実践的な記述を優先

2. **優先順位付け**
   - 公式推奨事項を最優先
   - コミュニティの知見で補完
   - 矛盾がある場合は公式を優先し、コミュニティの視点を補足として追加

3. **実行可能な指示への変換**
   - 抽象的な記述を具体的な指示に変換
   - 各指示は単一の概念を表現
   - 命令形で記述（「使用する」「避ける」「検証する」）

### Phase 3: instructions ファイルの作成

1. **Frontmatter の作成**
   - `description`: ツールの目的を50-150文字で記述
   - `applyTo`: このツールが主に適用されるファイルパターンを指定

2. **本文の構造化**
   - `.github/instructions/instructions.instructions.md` のガイドラインに従う
   - 以下のセクションを含める：
     - 目的とスコープ
     - 基本原則
     - コーディング規約
     - セキュリティ（該当する場合）
     - パフォーマンス（該当する場合）
     - よくある落とし穴

3. **具体例の追加**
   - 推奨パターンと非推奨パターンを並記
   - コードブロックに適切な言語指定

## 出力構造

作成する instructions ファイルは以下の構造に従ってください：

````markdown
---
description: '[ツール名] の[主な用途]のベストプラクティス'
applyTo: '**/*.{ext}'
---

# [ツール名] ベストプラクティス

[1文でファイルの目的を説明]

## 目的とスコープ

[このinstructionsファイルが適用される範囲と目的]

## 基本原則

- [原則1: 具体的で実行可能な指示]
- [原則2: 単一の概念を表現]
- [原則3: 命令形で記述]

## [ツール固有のセクション]

### [サブセクション]

- [具体的な指示]
  **根拠**: [なぜこの指示が重要か]

**推奨**:
```[言語]
[良い例のコード]
```

**非推奨**:
```[言語]
[悪い例のコード]
```

## よくある落とし穴

- [落とし穴1とその回避方法]
- [落とし穴2とその回避方法]

## 参考資料

- [official.md, community.md, 公式ドキュメントへのリンク]
````

## applyTo パターンの例

ツールの種類に応じて適切なパターンを使用：

- **リンター/フォーマッター**: `**/*.{js,ts,jsx,tsx,json}` (Biome など)
- **テストフレームワーク**: `**/*.test.{ts,js}, **/*.spec.{ts,js}, **/tests/**/*` (Vitest など)
- **ランタイム/パッケージマネージャ**: `**/package.json, **/bun.lock*, **/*.{ts,js}` (Bun など)
- **型チェッカー**: `**/*.py, **/pyproject.toml` (mypy など)
- **ビルドツール**: `**/vite.config.*, **/*.{ts,tsx,js,jsx}` (Vite など)

## 要件

- すべての指示は `.github/instructions/instructions.instructions.md` のガイドラインに準拠
- Markdown標準は `.github/instructions/markdown.instructions.md` に準拠
- 日本語で自然で読みやすい文章
- コード例は適切なシンタックスハイライトを使用
- 各指示に「なぜ」の説明を1-2文で補足（該当する場合）

## 完了条件

- [ ] `docs/best_practice/${input:tool}/official.md` を読み込んでいる
- [ ] `docs/best_practice/${input:tool}/community.md` を読み込んでいる
- [ ] `.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` が作成または更新されている
- [ ] Frontmatter に適切な `description` と `applyTo` が含まれている
- [ ] 指示が具体的で実行可能である
- [ ] 推奨例と非推奨例が適切に含まれている
- [ ] 公式とコミュニティの知見が統合されている

## 品質チェックリスト

作成後、以下を確認：

- [ ] 各指示は単一の概念を表現している
- [ ] 抽象的な表現（「適切に」「必要に応じて」など）を避けている
- [ ] 命令形の動詞で始まっている（「使用する」「避ける」など）
- [ ] コード例が実際に動作する内容である
- [ ] applyTo パターンが適切なファイルをターゲットしている
- [ ] 他の instructions ファイルと矛盾していない

## エラー処理

### ソースファイルが見つからない場合
1. ファイルの存在を確認
2. ユーザーに該当するプロンプト（official または community）を先に実行するよう依頼
3. 作業を中断

### 内容が不十分な場合
1. 不足しているセクションを特定
2. ユーザーに追加情報の必要性を報告
3. 可能な範囲で作成し、不足部分をコメントで明示

### applyTo パターンが不明な場合
1. ツールの種類から推測
2. 類似ツールの既存 instructions ファイルを参照
3. ユーザーに確認を求める

## 禁止事項

- 抽象的で曖昧な指示を作成しない
- 複数の概念を1つの指示にまとめない
- コード例なしで複雑な概念を説明しない
- 公式とコミュニティで矛盾する内容を無批判に併記しない

## 参考資料

- Instructions作成ガイドライン: `.github/instructions/instructions.instructions.md`
- Markdown標準: `.github/instructions/markdown.instructions.md`
- 既存の instructions ファイル: `.github/instructions/` ディレクトリ
