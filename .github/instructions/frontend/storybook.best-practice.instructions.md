---
description: 'Storybook を使用した UI コンポーネント開発・テスト・ドキュメント化のベストプラクティス'
applyTo: '**/*.stories.@(js|jsx|ts|tsx|mdx), .storybook/**/*.@(js|ts|json)'
---

# Storybook ベストプラクティス

Storybook は UI コンポーネントとページを分離して開発するためのフロントエンドワークショップです。コンポーネント駆動開発（CDD）を実現し、開発・テスト・ドキュメント化を統合的に行います。

## 目的とスコープ

このファイルは、Storybook を活用した効率的で保守性の高いコンポーネント開発を実現するための指示を提供します。React、Vue、Angular、Svelte などの主要フレームワークに対応します。

## 基本原則

### コンポーネント駆動開発（CDD）

- アプリケーション全体を実行せずにコンポーネントを分離して開発する
  **根拠**: 開発速度が向上し、依存関係による問題を早期に発見できる
- 各コンポーネントの主要な状態とエッジケースをストーリーとして定義する
  **根拠**: テストとドキュメントの基礎となり、品質が向上する
- ストーリーはコンポーネントの使用例として機能させる
  **根拠**: 新メンバーのオンボーディングが効率化され、デザイナー・QA との連携が円滑化する

### Component Story Format (CSF) の採用

- CSF（ES6 モジュールベース）形式でストーリーを記述する
- `storiesOf` API は使用しない（非推奨）
  **根拠**: TypeScript の型サポートが充実し、テストツールとの統合が容易

**推奨**:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Button',
    primary: true,
  },
};
```

**非推奨**:
```typescript
// ❌ 古い API
storiesOf('Components/Button', module)
  .add('Primary', () => <Button label="Primary" />);
```

## ファイル構成とプロジェクト構造

### コロケーション原則

- コンポーネントファイルとストーリーファイルを同一ディレクトリに配置する
  **根拠**: コンポーネント移動・削除時にストーリーも一緒に管理でき、メンテナンス性が向上する

**推奨**:
```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.stories.tsx
│   └── Button.test.tsx
```

**非推奨**:
```
components/
├── Button.tsx
stories/
├── Button.stories.tsx
```

### 命名規約

- ストーリーファイル名は `[ComponentName].stories.[js|jsx|ts|tsx]` 形式を使用する
- ストーリーの export 名は UpperCamelCase を使用する
- Storybook のメニュー構造（`title`）はアプリケーションのフォルダ構造に一致させる
  **根拠**: ストーリーの検索が容易になり、コード構造の理解が進む

**推奨**:
```typescript
// src/components/forms/Input/Input.stories.tsx
const meta = {
  title: 'Components/Forms/Input',
  component: Input,
} satisfies Meta<typeof Input>;

export const Default: Story = { ... };
export const WithError: Story = { ... };
```

### プロジェクト階層構造

```
my-project/
├── .storybook/
│   ├── main.ts          # メイン設定ファイル
│   ├── preview.ts       # プレビュー設定
│   └── manager.ts       # UI 設定（オプション）
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.stories.tsx
```

## ストーリー作成のベストプラクティス

### 1 コンポーネント 1 ストーリーファイル

- 各コンポーネントに対して 1 つのストーリーファイルを作成する
- 複数のストーリーでコンポーネントの各バリエーションを表現する
  **根拠**: コンポーネントの全体像が把握しやすく、変更時の影響範囲が明確

```typescript
const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// デフォルトストーリー（必須 props のみ）
export const Default: Story = {
  args: {
    label: 'Button',
  },
};

// Playground ストーリー（全 props を調整可能）
export const Playground: Story = {
  args: {
    label: 'Customize me',
    variant: 'primary',
    size: 'medium',
    disabled: false,
  },
};

// 特定の状態を示すストーリー
export const Primary: Story = {
  args: { label: 'Primary', variant: 'primary' },
};

export const Disabled: Story = {
  args: { label: 'Disabled', disabled: true },
};
```

### Args の活用

- 動的に編集可能な引数（args）を使用する
- メタレベルで共通のデフォルト値を定義し、ストーリーレベルで上書きする
- スプレッド構文で既存ストーリーの args を再利用する
  **根拠**: コード量が削減され、テストコードで args を上書き可能になる

```typescript
const meta = {
  component: Button,
  args: {
    // デフォルト値
    primary: false,
    size: 'medium',
  },
} satisfies Meta<typeof Button>;

export const Large: Story = {
  args: {
    ...Primary.args,
    size: 'large',
  },
};
```

### 関数のモック

- イベントハンドラには `fn()` を使用してスパイ化する
  **根拠**: Actions パネルで自動的にログ記録され、インタラクションテストで検証可能

```typescript
import { fn } from '@storybook/test';

const meta = {
  component: Button,
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;
```

### カスタムレンダリング

- コンポーネントをラッパーコンポーネント内で表示する必要がある場合、`render` プロパティを使用する
- メタレベルで定義すると全ストーリーに適用される

```typescript
export const PrimaryInAlert: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
  render: (args) => (
    <Alert>
      Alert text
      <Button {...args} />
    </Alert>
  ),
};
```

## Decorators（デコレーター）

### デコレーターの適用レベル

- グローバル: `.storybook/preview.ts` で全ストーリーに適用
- コンポーネント: メタで特定コンポーネントの全ストーリーに適用
- ストーリー: 個別のストーリーにのみ適用

### 一般的なパターン

```typescript
// スタイリングデコレーター
const meta = {
  component: Button,
  decorators: [
    (Story) => (
      <div style={{ margin: '3em' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Button>;

// コンテキストプロバイダーデコレーター
const meta = {
  component: MyComponent,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof MyComponent>;
```

### グローバルデコレーター

- アプリケーション全体で共通のコンテキストやスタイルを提供する場合は `.storybook/preview.ts` で定義する

```typescript
// .storybook/preview.ts
export const decorators = [
  (Story) => (
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  ),
];
```

## Parameters（パラメータ）

- アドオンや Storybook の機能を設定するための静的メタデータとして使用する
- レベル別（グローバル/コンポーネント/ストーリー）で設定を上書き可能

```typescript
// グローバルレベル（.storybook/preview.ts）
export default {
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};

// コンポーネントレベル
const meta = {
  component: Button,
  parameters: {
    backgrounds: {
      values: [
        { name: 'red', value: '#ff0000' },
        { name: 'blue', value: '#0000ff' },
      ],
    },
  },
} satisfies Meta<typeof Button>;

// ストーリーレベル
export const OnDark: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
```

## インタラクションテスト

### Play Function の基本

- `play` 関数でユーザー操作をシミュレートする
- Testing Library のクエリを優先順位に従って使用する
  **根拠**: アクセシビリティを優先し、実際のユーザー体験に近いテストを実現

```typescript
import { expect, userEvent, within } from '@storybook/test';

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const emailInput = canvas.getByLabelText('Email');
    const passwordInput = canvas.getByLabelText('Password');
    const submitButton = canvas.getByRole('button');

    await userEvent.type(emailInput, 'email@provider.com');
    await userEvent.type(passwordInput, 'a-random-password');
    await userEvent.click(submitButton);

    await expect(
      canvas.getByText('Everything is perfect!')
    ).toBeInTheDocument();
  },
};
```

### クエリの優先順位

アクセシビリティを優先した順序:

1. `getByRole` — アクセシブルロールで検索（最推奨）
2. `getByLabelText` — ラベルテキストで検索
3. `getByPlaceholderText` — プレースホルダーで検索
4. `getByText` — テキストコンテンツで検索
5. `getByDisplayValue` — 現在の値で検索
6. `getByAltText` — alt 属性で検索
7. `getByTitle` — title 属性で検索
8. `getByTestId` — data-testid で検索（最終手段）

**非推奨**: `data-testid` に過度に依存しない
**根拠**: アクセシビリティを優先したクエリを使用することで、実装の変更に強く、ユーザー視点でのテストが可能

### 関数のスパイ

```typescript
import { fn, expect } from '@storybook/test';

const meta = {
  component: LoginForm,
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof LoginForm>;

export const Submits: Story = {
  play: async ({ args, canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    
    // ... フォーム入力 ...
    
    await userEvent.click(canvas.getByRole('button'));
    
    await expect(args.onSubmit).toHaveBeenCalled();
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'email@provider.com',
      password: 'a-random-password',
    });
  },
};
```

### ステップ機能による構造化

- 複雑なフローは `step` 関数でグループ化する
  **根拠**: テストの意図が明確になり、失敗時のデバッグが容易

```typescript
export const ComplexFlow: Story = {
  play: async ({ canvasElement, step, userEvent }) => {
    const canvas = within(canvasElement);
    
    await step('Enter email and password', async () => {
      await userEvent.type(canvas.getByTestId('email'), 'hi@example.com');
      await userEvent.type(canvas.getByTestId('password'), 'supersecret');
    });

    await step('Submit form', async () => {
      await userEvent.click(canvas.getByRole('button'));
    });

    await step('Verify success message', async () => {
      await expect(canvas.getByText('Success!')).toBeInTheDocument();
    });
  },
};
```

### ライフサイクルフック

- `beforeEach` で各ストーリーの前処理とクリーンアップを定義する
- `mount` 関数でレンダリング前後の処理を分離する

```typescript
const meta = {
  component: Page,
  async beforeEach() {
    MockDate.set('2024-02-14');
    
    // クリーンアップ関数を返す
    return () => {
      MockDate.reset();
    };
  },
} satisfies Meta<typeof Page>;

export const WithMockedData: Story = {
  play: async ({ mount, userEvent }) => {
    // コンポーネントレンダリング前の処理
    MockDate.set('2024-12-25');
    
    // レンダリング
    await mount();
    
    // レンダリング後の操作
    await userEvent.click(...);
  },
};
```

## ビジュアルテスト

### Chromatic の活用

- Chromatic を使用して全ストーリーのピクセル単位の比較を実行する
  **根拠**: 意図しない視覚的変更を自動検出し、UI の一貫性を保証

```bash
# Chromatic のインストール
npx storybook@latest add @chromatic-com/storybook

# デプロイとテスト実行
npx chromatic --project-token=<your-project-token>
```

### CI 統合

```yaml
# GitHub Actions の例
- name: Run Chromatic
  uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### ベースライン管理

- ローカルで変更を承認してベースラインを更新する
- CI で自動テストを実行し、PR でレビューする
- 承認された変更は自動的に CI のベースラインに反映される

## アクセシビリティテスト

### 有効化

- Testing widget で Accessibility チェックボックスを有効化する
- `@storybook/addon-a11y` アドオンをインストールして自動チェックを有効化する

```bash
npm install @storybook/addon-a11y
```

```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-a11y'],
};
```

### 自動チェック項目

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切な色コントラスト
- ARIA 属性の正しい使用
- セマンティック HTML の使用

### カスタム設定

```typescript
export const AccessibilityTest: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

## ドキュメント化

### Autodocs の活用

- `tags: ['autodocs']` を追加して自動ドキュメント生成を有効化する
  **根拠**: コンポーネントの説明、Props テーブル、全ストーリーのプレビューが自動生成される

```typescript
const meta = {
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;
```

### MDX によるカスタムドキュメント

- デザイントークン、使用ガイドライン、複雑な使用例は MDX で文書化する

```mdx
{/* Button.mdx */}
import { Meta, Canvas, Story } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

ボタンコンポーネントは、ユーザーのアクションを受け付けるための主要な UI 要素です。

## 使用タイミング

- フォーム送信
- モーダルの表示・非表示
- ナビゲーション操作

## 使用方法

<Canvas of={ButtonStories.Default} />

## バリエーション

### Primary Button

<Canvas of={ButtonStories.Primary} />

主要なアクションに使用します（例: 送信、保存）。

## アクセシビリティ

- すべてのボタンには適切なラベルが必要です
- 無効状態では `aria-disabled` 属性を使用します
```

### フォルダでコンポーネントをグループ化

- Storybook のナビゲーションを階層化し、コンポーネントを見つけやすくする

```typescript
// 階層構造の例
export default {
  title: 'Components/Forms/Button',
  component: Button,
};
```

ナビゲーション構造:
```
📁 Components
  📁 Forms
    📄 Button
    📄 Input
  📁 Layout
    📄 Card
```

## パフォーマンス最適化

### ビルダーの選択

- 大規模プロジェクトでは SWC または Vite ビルダーを採用する
  **根拠**: Webpack と比較してビルド時間が 2〜5 倍高速化される

```bash
# SWC ビルダーのインストール
npx storybook@latest add @storybook/addon-webpack5-compiler-swc
```

```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-webpack5-compiler-swc'],
  swc: config => ({
    ...config,
    jsc: {
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
  }),
}
```

### 開発モードでのアドオンとドキュメントのスキップ

- 開発中は必要最小限のアドオンのみを有効化する
  **根拠**: 起動・リロード時間を大幅に短縮できる

```javascript
// .storybook/main.js
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  addons: isDevelopment
    ? ['@storybook/addon-webpack5-compiler-swc']
    : [
        '@storybook/addon-webpack5-compiler-swc',
        '@storybook/addon-essentials',
        '@storybook/addon-a11y',
      ],
  typescript: {
    check: !isDevelopment,
    reactDocgen: isDevelopment ? false : 'react-docgen-typescript',
  },
};
```

```json
// package.json
{
  "scripts": {
    "storybook": "NODE_ENV=production storybook dev -p 6006",
    "storybook:dev": "NODE_ENV=development storybook dev -p 6006"
  }
}
```

### Lazy Compilation の有効化

- Webpack 5 の lazy compilation 機能により、必要なストーリーのみがコンパイルされる

```javascript
// .storybook/main.js
module.exports = {
  core: {
    builder: {
      name: 'webpack5',
      options: {
        lazyCompilation: true,
      },
    },
  },
};
```

### 特定のストーリーのみを読み込む

- 開発中は作業中のストーリーのみを読み込む
  **根拠**: 大規模プロジェクトで起動時間を大幅に短縮できる

```javascript
// .storybook/main.js
module.exports = {
  stories: process.env.STORY_PATH
    ? [process.env.STORY_PATH]
    : ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
};
```

```bash
# 特定のストーリーのみを起動
STORY_PATH='src/components/Button/**/*.stories.tsx' npm run storybook:dev
```

## セキュリティ

### 環境変数の取り扱い

- 機密情報（API キー、トークン、パスワード）を環境変数で Storybook に渡さない
  **根拠**: ビルドされたバンドルに含まれ、公開される可能性がある（CVE-2025-68429）

**推奨**: `STORYBOOK_` プレフィックスを使用（機密情報を含めない）

```bash
# .env
STORYBOOK_API_ENDPOINT=https://api.example.com
```

```typescript
const apiEndpoint = process.env.STORYBOOK_API_ENDPOINT;
```

**推奨**: `env` プロパティで明示的に指定

```javascript
// .storybook/main.js
module.exports = {
  env: (config) => ({
    ...config,
    API_ENDPOINT: 'https://api.example.com',
  }),
};
```

### Storybook のアップグレード

- 最新の安全なバージョンに定期的にアップグレードする
  **根拠**: セキュリティパッチが適用され、既知の脆弱性を回避できる

```bash
# 最新バージョンへのアップグレード
npm install storybook@latest

# 推奨バージョン: 7.6.21+, 8.6.15+, 9.1.17+, 10.1.10+
```

### テレメトリーの無効化

- プライバシーポリシーに従ってテレメトリーを無効化する（必要に応じて）

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  core: {
    disableTelemetry: true,
  },
};
```

## CI/CD 統合

### Storybook の公開

**Chromatic へのデプロイ（推奨）**:

```bash
# Chromatic のインストール
npm install chromatic --save-dev

# デプロイ
npx chromatic --project-token=<your-project-token>
```

**GitHub Pages へのデプロイ**:

```yaml
# .github/workflows/deploy-storybook.yml
name: Build and Publish Storybook to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./storybook-static

      - name: Deploy to GitHub Pages
        id: deploy
        uses: actions/deploy-pages@v4
```

### CI でのテスト実行

```yaml
# .github/workflows/test-storybook.yml
name: Test Storybook

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Run Storybook tests
        run: npx test-storybook
```

## 設定ファイル

### main.ts（メイン設定）

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
    '@storybook/addon-a11y',
  ],
  
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  staticDirs: ['../public'],
  
  typescript: {
    check: false,
    checkOptions: {},
  },
};

export default config;
```

### preview.ts（プレビュー設定）

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  
  decorators: [
    (Story) => (
      <div style={{ margin: '3em' }}>
        <Story />
      </div>
    ),
  ],
  
  async beforeEach() {
    return () => {
      // クリーンアップ
    };
  },
};

export default preview;
```

## よくある落とし穴

### ストーリーとコンポーネントの配置が分離している

**問題**: ストーリーを別のディレクトリに配置すると、コンポーネント移動時に同期が取れなくなる

**解決策**: コロケーション原則に従う

### data-testid に過度に依存する

**問題**: `data-testid` に依存すると、アクセシビリティが軽視され、実装の変更に脆弱になる

**解決策**: `getByRole`、`getByLabelText` などのアクセシブルなクエリを優先する

### 巨大な単一ストーリーファイル

**問題**: すべてのバリエーションを 1 つのストーリーファイルに詰め込むと、保守性が低下する

**解決策**: 複数の export で各バリエーションを独立したストーリーとして表現する

### グローバル状態への直接依存

**問題**: ストーリーがグローバル状態に直接依存すると、分離して動作しない

**解決策**: デコレーターまたはモックで状態を提供する

### ビジュアルテストなしでのスタイル変更

**問題**: スタイル変更時にビジュアルテストを実行しないと、意図しない変更を見逃す

**解決策**: ビジュアルリグレッションテストを CI に統合する

### ドキュメント化の欠如

**問題**: ストーリーだけではコンポーネントの使用方法や制約が伝わりにくい

**解決策**: `tags: ['autodocs']` を追加し、必要に応じて MDX でリッチなドキュメントを作成する

### 環境変数に機密情報を含める

**問題**: `.env` ファイルに機密情報を含めてビルドすると、バンドルに含まれて公開される

**解決策**: 機密情報は環境変数で Storybook に渡さず、モックを使用する

### デフォルト設定のまま大規模プロジェクトを運用する

**問題**: デフォルト設定では、大規模プロジェクトでビルド時間が長くなる

**解決策**: パフォーマンス最適化セクションの推奨事項を適用する（高速ビルダー、アドオン最小化、Lazy Compilation）

## 参考資料

- [Storybook 公式ドキュメント](https://storybook.js.org/docs)
- [Storybook チュートリアル](https://storybook.js.org/tutorials)
- [Learn Storybook](https://www.learnstorybook.com/)
- [Chromatic（ビジュアルテスト）](https://www.chromatic.com/storybook)
- [Storybook Discord コミュニティ](https://discord.gg/storybook)
- [Awesome Storybook](https://github.com/lauthieb/awesome-storybook)
- [CVE-2025-68429 - NIST NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-68429)
