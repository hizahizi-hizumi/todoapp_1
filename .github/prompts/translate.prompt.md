---
description: '構造を維持したまま英語の技術プロンプト文書を日本語に翻訳するための再利用可能なワークフロー。YAMLフロントマター、Markdown構造、コードブロック、特殊ディレクティブを処理し、技術ドキュメントの翻訳に関するベストプラクティスに従います。'
tools: [execute/getTerminalOutput, execute/runInTerminal, read/terminalSelection, read/terminalLastCommand, read/readFile, 'context7/*', edit/createDirectory, edit/createFile, edit/editFiles, search, web, todo]
argument-hint: 'filePath(required)
---

# Technical Prompt Translation Instructions

## Mission
You WILL translate English technical prompt documents into natural Japanese while preserving semantics, structure, and metadata. You WILL focus on `*.chatmode.md`, `*.prompts.md`, `*.instructions.md`, and other Markdown-based technical files.

## Scope & Inputs
- You MUST accept a single Markdown file path as an argument per run, using the `${input:filePath}` variable (e.g., `/translate: filePath=docs/example.md`).
- You MUST inspect YAML front matter, Markdown headings, tables, lists, callouts, HTML blocks, and embedded directives such as `<!-- <example> -->` in the specified file.
- You MUST detect non-translatable regions (code fences, inline code, file paths, URLs, CLI commands, JSON/YAML snippets) and preserve them in the original language.


## Argument Handling
- You MUST reference the file to translate using the `${input:filePath}` variable throughout the prompt.
- If `${input:filePath}` is not provided, you MUST halt and request the user to specify a file path argument.

## Process Requirements

### 1. Intake Analysis
- You MUST read the entire source file specified by `${input:filePath}` before translating.
- You MUST identify:
  - File metadata (front matter keys and values)
  - Structural markers (headings hierarchy, lists, tables)
  - Special directives (XML-style tags, anchors, reference links)
  - Existing Japanese segments that must remain unchanged
- You MUST log any ambiguities or missing context in your summary section.

- You MUST fetch and review the latest Google Developer Documentation translation best practices (https://developers.google.com/style/translation, updated 2025-04-02) before starting any translation work.
- You WILL follow these best practices: keep sentences clear, precise, and unambiguous; prefer active voice; avoid idioms; ensure consistent terminology.
- You MUST produce concise Japanese suitable for technical documentation: direct tone, plain style, avoid honorifics, keep sentences short.
- You MUST retain product names, API names, and proper nouns in English unless an established Japanese localization exists.
- You MUST translate headings, list items, table content, and prose while preserving punctuation and numbering.
- You MUST expand abbreviations on first occurrence if the Japanese audience might not recognize them, appending the English acronym in parentheses.

### 3. Terminology & Consistency
- You MUST build a terminology note while translating for recurring terms.
- You MUST reuse identical Japanese phrasing for identical English concepts within the same file.
- You MUST note any terms left in English with justification in the QA section.

### 4. Formatting Preservation
- You MUST copy YAML front matter verbatim except for values that require translation (for example, `description`).
- You MUST preserve Markdown syntax, indentation, bullet hierarchy, tables, code fences, inline code, HTML tags, and custom directives.
- You MUST maintain link targets and update link text if translated.
- You MUST ensure line breaks around headings and lists mirror the source to avoid Markdown rendering regressions.

### 5. Quality Assurance
- You MUST proofread the Japanese output for accuracy, natural flow, and consistency.
- You MUST review for typographical errors, missing translations, duplicated punctuation, or mismatched brackets.
- You MUST verify that every English sentence intended for translation has a Japanese counterpart.
- You MUST flag any unresolved issues with remediation suggestions.

## Output Requirements
- You MUST create a sibling file in the same directory as `${input:filePath}` using the pattern `<original-name>.ja.md`.
- You MUST place the fully translated content in that file, maintaining the original structure.
- You MUST provide a response summary containing:
  1. `Translated File`: Relative path to the new file.
  2. `Key Decisions`: Bullet points describing terminology or stylistic choices.
  3. `Outstanding Items`: Bullet list of caveats or `なし` if none.

<!-- <example> -->
**入力例**: `/translate: filePath=docs/example.instructions.md` のようにファイルパス引数を指定して実行する。

**期待される処理**:
1. `${input:filePath}` で指定されたファイルの Front Matter のキーは維持し、翻訳が必要な値のみ日本語化する。
2. コードブロックやコマンドは英語のまま保持する。
3. 出力ファイルを `docs/example.instructions.ja.md` として作成し、構造を保った日本語訳を格納する。
<!-- </example> -->

## Response Template
You MUST structure your reply as follows:

```
## 翻訳結果
- Translated File: `<path>`

### 主な判断
- ...

### 残課題
- ... / なし
```

## Validation Workflow
- You MUST run a diff check comparing the original and translated files to confirm structural parity.
- You SHOULD request peer verification if critical terminology uncertainty remains.
- You MUST halt and request clarification before translating if the source contains mixed languages or ambiguous instructions you cannot resolve confidently.
