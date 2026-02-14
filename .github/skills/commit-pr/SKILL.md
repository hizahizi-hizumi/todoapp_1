---
name: commit-pr
description: '未コミット差分を分析し、PR粒度ルール、コミット粒度ルールに沿ってPRとコミット計画と作成を行う'
argument-hint: baseBranch(Conditional: main以外のブランチにいる場合に必須) preview(Optional)
---

# 未コミット差分のコミットとプルリクエスト作成

## 目的
作業ツリー（未コミット差分）を分析し、ルールに沿って **適切な粒度のコミット列** と **適切な粒度のプルリクエスト** を作成する。

## 入力（条件付き必須）
- ${input:baseBranch:main} : PR作成時のベースブランチ
  - `main` 以外のブランチにいる場合に必須
- ${input:preview:false} : プレビュー モード
  - true の場合、フェーズ6をスキップし計画のみを出力する

## 出力
各プルリクエストについて:
- ブランチ名: `<type>/<short-description>-<timestamp>`
- コミット列: ルールに準拠したコミットメッセージ付き
- ドラフトPR: `gh pr create --draft` で作成

## 手順

### フェーズ 0: タスクの登録（必須）

1. #tool:todo を使用してタスクを登録
  - 入力検証
  - ルールの読み込み
  - 未コミット差分の把握
  - プルリクエスト計画の作成
  - コミット計画の作成
  - プルリクエストとコミットの作成

### フェーズ 1: 入力検証（必須）
${currentBranch} を `git branch --show-current` で取得し、次の条件で検証する。

- リポジトリ直下でない、または Git 管理下でない場合は停止して報告する。
- ${input:baseBranch} が指定されている場合
  - ${currentBranch} が `${input:baseBranch}` と異なる場合
    - `git branch --list ${input:baseBranch}` を実行
      - ${input:baseBranch} が存在しない場合
        - 処理を停止し、「指定された baseBranch が存在しません」と報告する。
      - ${input:baseBranch} が存在する場合
        - ${isCreateBranch} を false に設定する
  - ${currentBranch} が `${input:baseBranch}` と同じ場合
    - ${isCreateBranch} を true に設定する
- ${input:baseBranch} が指定されていない場合
  - ${currentBranch} が `main` でない場合
    - 処理を停止し、「baseBranch を指定してください」と報告する。
  - ${currentBranch} が `main` の場合
    - ${isCreateBranch} を true に設定する

### フェーズ 2: ルール、PRテンプレートの読み込み（必須）
1. ./instructions/commit.instructions.md を読み、以降の判断基準として適用する。
2. ./instructions/pr.instructions.md を読み、以降の判断基準として適用する。
3. ` find . -type f -iname "*pull_request*template*"` を実行し、PRテンプレートのパスを取得。
4. #tool:read/readFile で PRテンプレートを読み込み、PR作成時のテンプレートとして適用する。


### フェーズ 3: 未コミット差分の把握（必須）
次の情報を収集し、要点を短く要約する。
- 変更状況
  - `git status --porcelain=v1 -uall`
  - `git diff --name-status`
  - `git diff --stat`
  - `git diff`（必要に応じて）
  - `git diff --staged`（必要に応じて）
  - ファイル移動の可能性がある場合（削除+追加の組み合わせ）:
    - `git show HEAD:<削除ファイルパス> | diff -u - <追加ファイルパス>` で内容比較
    - 移動のみか、移動+内容変更かを判別する

### フェーズ 4: プルリクエスト計画の作成（必須）
未コミット差分を分析し、以下の観点でプルリクエスト境界を設計する。
- 論理単位: 1 プルリクエスト = 1 つの論理的変更群（1 文で説明できる単位）
- 関連性: 変更内容が密接に関連するものをまとめる
- リスク分離: ロールバックのリスクが異なるものは分割する
- レビュアー: レビュアーが変わりそうなら分割する

### フェーズ 5: コミット計画の作成（必須）
各プルリクエスト内でのコミット境界を以下の観点で設計する。
- 論理単位: 1 コミット = 1 つの論理的変更（1 文で説明できる単位）
- 種別分離:
  - 機械的変更（整形・リネーム・移動） vs 意味のある変更（ロジック・仕様）
  - リファクタ（挙動不変） vs 挙動変更（機能追加・修正）
  - 依存更新 / CI / 開発環境 vs アプリ挙動
- リスク分離:
  - ロールバックのリスクが異なるものは分割する
  - レビュアーが変わりそうなら分割する
- 履歴品質:
  - 可能な範囲で各コミットが単体でビルド・テスト可能になるように順序を組む

### フェーズ 6: プルリクエストとコミットの作成（必須）
${input:preview} が true の場合、計画内容を報告して処理を終了する。

設計したプルリクエスト計画とコミット計画に基づいて、必要数のプルリクエストとコミットを作成する。
- プルリクエストごとに以下を実行する。
  - この処理でPRを未作成で ${isCreateBranch} が true の場合
    - 新しいブランチを作成し、${input:baseBranch} から分岐させる。
    - ブランチ名は `<type>/<short-description>-<timestamp>` 形式
      - `<type>`: プルリクエストの主な変更種別
      - `<short-description>`: 変更内容を簡潔に表すキーワード
  - この処理ですでにPRを作成済みの場合
    - ベースブランチを現在のブランチに設定する。
    - 新しいブランチを作成し、現在のブランチから分岐させる。
  - 設計したコミット計画に基づいて、各コミットを順次に作成する。
  - `git push --set-upstream origin <branch-name>` でリモートにプッシュする。
  - `gh pr create --draft` コマンドを使用してプルリクエストを作成する。

## エラー処理
- Git コマンドが失敗した場合:
  1. エラー内容を報告
  2. 処理を停止
  3. ユーザーに確認を求める
- PR作成が失敗した場合:
  1. すでに作成されたコミットを保持
  2. 失敗理由を報告
  3. 手動での対処方法を提案