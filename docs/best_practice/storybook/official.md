# Storybook 公式ベストプラクティス

Storybook 公式ドキュメントに基づく、コンポーネント開発・テスト・ドキュメント化のベストプラクティスをまとめます。

## 概要

Storybook は UI コンポーネントとページを分離して開発するためのフロントエンドワークショップです。コンポーネント駆動開発（Component-Driven Development）を実現し、UI 開発、テスト、ドキュメント化を統合的に行えます。

### 主要機能

- **開発環境**: コンポーネントを分離して開発・プレビュー
- **テスト**: インタラクション、ビジュアル、アクセシビリティテストを実行
- **ドキュメント**: コンポーネントを自動的に文書化
- **共有**: チーム全体でコンポーネントライブラリを共有

## インストールと初期設定

### 推奨インストール方法

既存プロジェクトに Storybook をインストール、または新規プロジェクトを作成:

```bash
npm create storybook@latest
```

このコマンドは以下を自動的に実行:

- プロジェクトタイプを検出
- 必要な依存関係をインストール
- 設定ファイルを生成
- サンプルストーリーを作成

### サポートされているフレームワーク

公式サポート:

- **React**: Vite、Webpack、Next.js（Vite版・非Vite版）
- **Vue**: Vite、Nuxt（コミュニティメンテナンス）
- **Angular**: 公式サポート
- **Svelte**: SvelteKit 対応
- **Web Components**: 各種ビルダー対応
- **Preact**: Vite 対応

### プロジェクト構造

```
project/
├── .storybook/
│   ├── main.ts          # メイン設定ファイル
│   ├── preview.ts       # プレビュー設定
│   └── manager.ts       # UI 設定（オプション）
├── src/
│   └── components/
│       ├── Button/
│       │   ├── Button.tsx
│       │   └── Button.stories.tsx
│       └── ...
```

## Component Story Format (CSF)

### CSF の基本構造

CSF（Component Story Format）は ES6 モジュールベースの標準フォーマットです。

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// メタデータ（デフォルトエクスポート）
const meta = {
  component: Button,
  // オプション設定
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

// ストーリー（名前付きエクスポート）
export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    label: '😄👍😍💯',
  },
};
```

### ストーリーの配置

**推奨**: コンポーネントファイルと同じディレクトリにストーリーファイルを配置

```
components/
├── Button/
│   ├── Button.tsx
│   └── Button.stories.tsx
```

**理由**:

- コンポーネントとストーリーの関連性が明確
- コンポーネント削除時にストーリーも一緒に削除しやすい
- コロケーション原則に従う

### メタデータ設定のベストプラクティス

```typescript
const meta = {
  component: Button,
  
  // 自動ドキュメント生成を有効化
  tags: ['autodocs'],
  
  // パラメータでアドオンを設定
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#333333' },
      ],
    },
  },
  
  // ArgTypes でコントロールをカスタマイズ
  argTypes: {
    backgroundColor: { control: 'color' },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;
```

## Args（引数）のベストプラクティス

### Args を使用する理由

- **動的編集**: UI で引数を動的に変更可能
- **コード量削減**: 複数のストーリー間で args を再利用
- **テスト容易性**: テストコードで args を上書き可能

### Args の定義

```typescript
// メタレベル（全ストーリーに適用）
const meta = {
  component: Button,
  args: {
    // デフォルト値
    primary: false,
    size: 'medium',
  },
} satisfies Meta<typeof Button>;

// ストーリーレベル（個別のストーリーに適用）
export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

// Args のスプレッド（再利用）
export const Large: Story = {
  args: {
    ...Primary.args,
    size: 'large',
  },
};
```

### Args 使用時の注意点

- **関数のモック**: `fn()` を使用してイベントハンドラをスパイ化

```typescript
import { fn } from 'storybook/test';

const meta = {
  component: Button,
  args: {
    onClick: fn(), // 自動的にログ記録される
  },
} satisfies Meta<typeof Button>;
```

## カスタムレンダリング

### シンプルなラッパー

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

### メタレベルでの共通レンダリング

```typescript
const meta = {
  component: Button,
  render: (args) => (
    <Alert>
      Alert text
      <Button {...args} />
    </Alert>
  ),
} satisfies Meta<typeof Button>;

// 全てのストーリーが Alert 内でレンダリングされる
export const Primary: Story = {
  args: { primary: true, label: 'Button' },
};
```

## Decorators（デコレーター）

### 目的

コンポーネントをラップして追加のマークアップやコンテキストを提供します。

### パターン例

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

### デコレーターの適用レベル

- **グローバル**: `.storybook/preview.ts` で全ストーリーに適用
- **コンポーネント**: メタで特定コンポーネントの全ストーリーに適用
- **ストーリー**: 個別のストーリーにのみ適用

## Parameters（パラメータ）

### 用途

アドオンや Storybook の機能を設定するための静的メタデータ。

### レベル別設定

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

```typescript
import { expect } from 'storybook/test';

export const FilledForm: Story = {
  play: async ({ canvas, userEvent }) => {
    // 要素を取得
    const emailInput = canvas.getByTestId('email');
    const passwordInput = canvas.getByTestId('password');
    const submitButton = canvas.getByRole('button');

    // ユーザー操作をシミュレート
    await userEvent.type(emailInput, 'email@provider.com');
    await userEvent.type(passwordInput, 'a-random-password');
    await userEvent.click(submitButton);

    // アサーション
    await expect(
      canvas.getByText('Everything is perfect!')
    ).toBeInTheDocument();
  },
};
```

### クエリの優先順位

Testing Library の推奨に従い、**アクセシビリティを優先**:

1. `getByRole` — アクセシブルロールで検索（最推奨）
2. `getByLabelText` — ラベルテキストで検索
3. `getByPlaceholderText` — プレースホルダーで検索
4. `getByText` — テキストコンテンツで検索
5. `getByDisplayValue` — 現在の値で検索
6. `getByAltText` — alt 属性で検索
7. `getByTitle` — title 属性で検索
8. `getByTestId` — data-testid で検索（最終手段）

### 関数のスパイ

```typescript
import { fn, expect } from 'storybook/test';

const meta = {
  component: LoginForm,
  args: {
    onSubmit: fn(), // スパイ関数を作成
  },
} satisfies Meta<typeof LoginForm>;

export const Submits: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // ... フォーム入力 ...
    
    await userEvent.click(submitButton);
    
    // スパイ関数の呼び出しを確認
    await expect(args.onSubmit).toHaveBeenCalled();
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'email@provider.com',
      password: 'a-random-password',
    });
  },
};
```

### ステップ機能による構造化

複雑なフローは `step` 関数でグループ化:

```typescript
export const ComplexFlow: Story = {
  play: async ({ canvas, step, userEvent }) => {
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

#### beforeEach（コンポーネントレベル）

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
```

#### mount 関数の活用

```typescript
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

### セットアップ

```bash
npx storybook@latest add @chromatic-com/storybook
```

### 特徴

- **自動スナップショット**: 全ストーリーのピクセル単位の比較
- **クロスブラウザ**: 複数ブラウザでのテスト
- **メンテナンス不要**: テストコード不要
- **統合**: Storybook UI 内で差分確認

### CI 統合

```yaml
# GitHub Actions の例
- name: Run Chromatic
  uses: chromaui/action@latest
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### ベースライン管理

- ローカルで変更を承認 → ベースライン更新
- CI で自動テスト → PR でレビュー
- 承認された変更は自動的に CI のベースラインに反映

## アクセシビリティテスト

### 有効化

Testing widget で Accessibility チェックボックスを有効化。

### 自動チェック項目

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切な色コントラスト
- ARIA 属性の正しい使用
- セマンティック HTML の使用

### デバッグ

Accessibility パネルで違反を確認し、該当要素をハイライト表示。

### 法規制対応

- European Accessibility Act（2025年6月施行予定）
- Americans with Disabilities Act (ADA)
- Section 508 of the Rehabilitation Act

## テストカバレッジ

### 確認方法

Testing widget でカバレッジサマリーを確認、クリックで詳細レポートを表示。

### CI での実行

```json
{
  "scripts": {
    "test": "vitest --coverage"
  }
}
```

### カバレッジの考え方

- **目標**: 100% を目指す必要はない
- **指標**: 変更の健全性を判断するバロメーター
- **ギャップ**: テストされていない重要な状態や相互作用を特定

## ドキュメント化

### Autodocs

タグを追加するだけで自動ドキュメント生成:

```typescript
const meta = {
  component: Button,
  tags: ['autodocs'], // 自動ドキュメント有効化
} satisfies Meta<typeof Button>;
```

生成されるドキュメント:

- コンポーネントの説明
- Props テーブル
- 全ストーリーのプレビュー
- コードサンプル

### MDX によるカスタムドキュメント

```mdx
{/* Button.mdx */}
import { Meta, Canvas, Story } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

ボタンコンポーネントは、ユーザーアクションをトリガーするために使用します。

<Canvas of={ButtonStories.Primary} />

## 使用方法

\```tsx
import { Button } from './Button';

<Button primary label="Click me" onClick={() => alert('Clicked!')} />
\```

## バリエーション

<Canvas of={ButtonStories.Secondary} />
<Canvas of={ButtonStories.Large} />
```

## 設定ファイル

### main.ts（メイン設定）

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // ストーリーファイルの場所
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  
  // アドオン
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  
  // フレームワーク設定
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  // 静的ファイルディレクトリ
  staticDirs: ['../public'],
  
  // 機能フラグ
  features: {
    backgrounds: true,
    controls: true,
  },
  
  // TypeScript 設定
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
  // グローバルパラメータ
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
  
  // グローバルデコレーター
  decorators: [
    (Story) => (
      <div style={{ margin: '3em' }}>
        <Story />
      </div>
    ),
  ],
  
  // グローバルライフサイクルフック
  async beforeAll() {
    // 全ストーリーの前に1回実行
  },
  
  async beforeEach() {
    // 各ストーリーの前に実行
    return () => {
      // クリーンアップ
    };
  },
};

export default preview;
```

## アドオン

### Essentials（デフォルト含まれる）

- **Actions**: イベントハンドラのログ記録
- **Backgrounds**: 背景色の切り替え
- **Controls**: Props の動的編集
- **Highlight**: 要素のハイライト
- **Measure & outline**: 要素のサイズ測定とアウトライン表示
- **Toolbars & globals**: グローバル設定のツールバー
- **Viewport**: ビューポートサイズの切り替え

### 推奨アドオン

```bash
# インタラクションテスト
npm install @storybook/addon-interactions

# アクセシビリティテスト
npm install @storybook/addon-a11y

# ビジュアルテスト
npm install @chromatic-com/storybook

# Vitest統合
npm install @storybook/addon-vitest
```

### 個別機能の無効化

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  features: {
    backgrounds: false, // Backgrounds機能を無効化
  },
};
```

## パフォーマンス最適化

### ビルドの最適化

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  build: {
    test: {
      // テスト機能を除外してビルド時間短縮
    },
  },
};
```

### Zip デプロイ（大規模プロジェクト）

```json
// chromatic.config.json
{
  "zip": true // Chromatic への ZIP アップロード有効化
}
```

## CI/CD統合

### GitHub Actions の例

```yaml
name: Storybook Tests
on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      
      # Vitest addon を使用したテスト
      - name: Run tests
        run: npm run test-storybook -- --coverage
      
      # ビジュアルテスト
      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### テストスクリプト

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test-storybook": "vitest --project=storybook"
  }
}
```

## 複数コンポーネントのストーリー

### パターン1: カスタムレンダリング

```typescript
export const ListWithItems: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem />
      <ListItem />
      <ListItem />
    </List>
  ),
};
```

### パターン2: 子コンポーネントのストーリーを再利用

```typescript
import * as ListItemStories from './ListItem.stories';

export const ManyItems: Story = {
  render: (args) => (
    <List {...args}>
      <ListItem {...ListItemStories.Selected.args} />
      <ListItem {...ListItemStories.Unselected.args} />
      <ListItem {...ListItemStories.Unselected.args} />
    </List>
  ),
};
```

## 命名規則とベストプラクティス

### ストーリー名

```typescript
// UpperCamelCase を使用
export const Primary: Story = { ... };
export const SmallSize: Story = { ... };

// カスタム表示名（必要な場合のみ）
export const Primary: Story = {
  name: 'Primary Button',
  ...
};
```

### 階層構造

```typescript
const meta = {
  // スラッシュで階層を作成
  title: 'Design System/Atoms/Button',
  component: Button,
} satisfies Meta<typeof Button>;
```

### ファイル命名

- コンポーネント: `Button.tsx`
- ストーリー: `Button.stories.tsx`
- テスト: `Button.test.tsx`

## セキュリティとプライバシー

### テレメトリー

デフォルトで有効。無効化する場合:

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  core: {
    disableTelemetry: true,
  },
};
```

### 環境変数

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  env: (config) => ({
    ...config,
    STORYBOOK_API_URL: process.env.API_URL,
  }),
};
```

プレフィックス `STORYBOOK_` を付けることで自動的に公開されます。

## トラブルシューティング

### よくある問題

**Q: インタラクションテストとビジュアルテストの違いは？**
A: インタラクションテストは機能的側面をテストし、ビジュアルテストは見た目の変更を検出します。併用することで包括的なカバレッジを実現。

**Q: ストーリーとコンポーネントが大きくなりすぎた場合は？**
A: 複数のストーリーファイルに分割するか、MDX でドキュメントを整理します。

**Q: TypeScript エラーが発生する**
A: `satisfies` キーワードを使用して型安全性を確保:

```typescript
const meta = {
  component: Button,
} satisfies Meta<typeof Button>;
```

## マイグレーション

### Storybook 7.x → 8.x → 10.x

公式マイグレーションツールを使用:

```bash
npx storybook@latest upgrade
npx storybook@latest migrate
```

主な変更点:

- CSF 3 が標準
- Vite がデフォルトビルダー
- 自動マイグレーションスクリプト対応

## まとめ

### 開発フロー推奨パターン

1. **コンポーネント作成** → コンポーネントファイルを作成
2. **ストーリー作成** → 基本的なストーリーを追加
3. **インタラクション追加** → play 関数でテストを追加
4. **ドキュメント化** → autodocs タグを追加
5. **ビジュアルテスト** → Chromatic で変更を確認
6. **CI統合** → 自動テストをセットアップ

### 必須のベストプラクティス

- ✅ Component Story Format (CSF) を使用
- ✅ ストーリーをコンポーネントと同じディレクトリに配置
- ✅ Args を活用して再利用性を高める
- ✅ インタラクションテストで機能を検証
- ✅ アクセシビリティテストを有効化
- ✅ Autodocs で自動ドキュメント生成
- ✅ CI/CD パイプラインに統合

### アンチパターン

- ❌ data-testid に依存しすぎる（アクセシブルなクエリを優先）
- ❌ 巨大な単一ストーリーファイル（適切に分割）
- ❌ グローバル状態への直接依存（モックやデコレーターを使用）
- ❌ ビジュアルテストなしでのスタイル変更
- ❌ ドキュメント化の欠如

## 参考リンク

- [公式ドキュメント](https://storybook.js.org/docs)
- [チュートリアル](https://storybook.js.org/tutorials)
- [アドオンカタログ](https://storybook.js.org/addons)
- [GitHub リポジトリ](https://github.com/storybookjs/storybook)
- [Discord コミュニティ](https://discord.gg/storybook)
- [Chromatic（ビジュアルテスト）](https://www.chromatic.com/storybook)
