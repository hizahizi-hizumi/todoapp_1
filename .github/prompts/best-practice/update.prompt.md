---
name: best-practice.update
description: '技術ツールのベストプラクティスをまとめた instructions ファイルを更新'
argument-hint: tool, officialUrl, additionalOfficialUrls(Optional), additionalCommunityUrls(Optional)
tools: ['read/readFile', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'web/fetch', 'agent', 'ms-vscode.vscode-websearchforcopilot/websearch', 'todo']
---

# ベストプラクティス instructions ファイルの更新

指定された技術ツールに関するベストプラクティスをまとめた GitHub Copilot 用 instructions ファイルを更新します。

## 必須入力

- `tool`: ツールまたは技術の名前 (例: Bun, Biome, Vitest)
- `officialUrl`: 公式ドキュメントのベースURL (例: https://bun.com/docs)

## 任意入力

- `additionalOfficialUrls`: 追加で探索すべき公式ドキュメントやチェンジログのURLリスト（カンマ区切り）
- `additionalCommunityUrls`: 追加で探索すべきコミュニティドキュメントのURLリスト（カンマ区切り）

## 入力検証

入力が不足している場合は、ユーザーに以下を確認してから作業を開始してください：

- ツール名の正確な表記
- 公式ドキュメントの有効なURL

## 手順

### 0. タスクの登録

#tool:todo を使用してタスクを登録

1. 公式ドキュメントからベストプラクティスの収集
2. コミュニティからベストプラクティスの収集
3. instructions ファイルの更新

### 1. 公式のベストプラクティスの収集
- #tool:agent/runSubagent を使用してサブエージェントに委譲
- 指示内容: #file:official.prompt.md を `tool=${input:tool} officialUrl=${input:officialUrl}` で実行し、`docs/best_practice/${input:tool}/official.md` を更新
- ${input:additionalOfficialUrls} が指定されている場合は `additionalUrls=${input:additionalOfficialUrls}` も渡す

### 2. コミュニティのベストプラクティスの収集
- #tool:agent/runSubagent を使用してサブエージェントに委譲
- 指示内容: #file:community.prompt.md を `tool=${input:tool}` で実行し、`docs/best_practice/${input:tool}/community.md` を更新
- ${input:additionalCommunityUrls} が指定されている場合は `additionalUrls=${input:additionalCommunityUrls}` も渡す

### 3. instructions ファイルの更新
- #tool:agent/runSubagent を使用してサブエージェントに委譲
- 指示内容: #file:update-instructions.prompt.md を `tool=${input:tool}` で実行し、`.github/instructions/<kebab-case(${input:tool})>.best-practice.instructions.md` を更新