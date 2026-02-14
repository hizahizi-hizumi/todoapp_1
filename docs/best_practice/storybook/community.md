## 概要

Storybook は、UI コンポーネントを分離して開発・テスト・ドキュメント化できるオープンソースツールです。コミュニティでは、React、Vue、Angular などの主要フレームワークに対応し、デザインシステムの構築やコンポーネントライブラリの管理に広く活用されています。

60,000 以上の公開 Storybook が存在し、Intuit、BBC iPlayer、Audi など大規模組織から個人開発者まで幅広く採用されています。

### 主な利点

- コンポーネントを分離開発できる（アプリケーション全体を実行する必要がない）
- インタラクティブなプレビュー環境
- 自動ドキュメント生成
- テストツール（Jest、Testing Library、Playwright）との統合
- 複数フレームワークに対応したアドオンエコシステム

### 参照情報源

- [Storybook 公式ブログ - Structuring your Storybook](https://storybook.js.org/blog/structuring-your-storybook/)
- [DEV.to - 10 Storybook Best Practices](https://dev.to/rafaelrozon/10-storybook-best-practices-5a97)
- [Storybook 公式ドキュメント](https://storybook.js.org/docs)
- [UXPin - Storybook Best Practices](https://www.uxpin.com/studio/blog/storybook-best-practices-2/)

## セットアップのベストプラクティス

### インストールと初期設定

最新バージョンのインストール:

```bash
# 既存プロジェクトへのインストール
npm create storybook@latest

# または
npx storybook@latest init
```

自動検出機能により、フレームワークに応じた設定が生成されます。

- `.storybook/` フォルダに設定ファイルが作成される
- `main.js`: ストーリーの場所とアドオン設定
- `preview.js`: Storybook プレビュー画面のカスタマイズ

### 推奨プロジェクト構造

```
my-project/
├── .storybook/
│   ├── main.js
│   └── preview.js
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.test.tsx
│   │   └── Card/
│   │       ├── Card.tsx
│   │       └── Card.stories.tsx
```

**ベストプラクティス**: コンポーネントとストーリーをコロケーション（同一フォルダ内に配置）する。これにより、コンポーネント移動時にストーリーも一緒に移動でき、メンテナンスが容易になります。

### ビルダーの選択

大規模プロジェクトでは、SWC や Vite ビルダーの採用でパフォーマンスが大幅に改善されます。

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

**パフォーマンス比較**: Vite や SWC を使用することで、Webpack と比較してビルド時間が大幅に短縮されます（プロジェクト規模によって異なりますが、2〜5倍の高速化が期待できます）。

### 参照情報源

- [Divotion - Implementing Storybook in Enterprise Project](https://www.divotion.com/blog/storybook-in-your-enterprise-project)
- [Denieler - Efficient Storybook for Large Repositories](https://denieler.com/blog/efficient-storybook-for-large-repositories)

## 実践的な使用パターン

### 開発環境での活用

#### 1. コンポーネントごとに1つのストーリーファイル

**基本原則**: 各コンポーネントに対して1つのストーリーファイルを作成します。

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

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
  args: {
    label: 'Primary',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary',
    variant: 'secondary',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
  },
};
```

**ストーリー構成のポイント**:
- **Default ストーリー**: 必須 props のみで構成され、コンポーネントの基本表示を示す
- **Playground ストーリー**: すべての props を調整可能にし、コンポーネントの動作を実験できる
- **特定状態ストーリー**: 各バリエーション（Primary、Secondary、Error など）を明示的に示す

#### 2. Component Story Format (CSF) の採用

**推奨**: Storybook メンテナが推奨する CSF 形式を使用します。`storiesOf` API ではなく、標準的な JavaScript/TypeScript のエクスポートを使用します。

```typescript
// ❌ 古い書き方（storiesOf API）
storiesOf('Components/Button', module)
  .add('Primary', () => <Button label="Primary" />);

// ✅ 推奨の書き方（CSF）
export const Primary: Story = {
  args: {
    label: 'Primary',
  },
};
```

CSF のメリット:
- コードが簡潔で読みやすい
- TypeScript の型サポートが充実
- 将来の機能拡張に対応しやすい
- テストツールとの統合が容易

#### 3. 命名規約の統一

**ファイル命名**: `[ComponentName].stories.[js|jsx|tsx]` の形式を採用します。

```
Button.stories.tsx
Card.stories.tsx
Modal.stories.tsx
```

これにより、エディタでのファイル検索が容易になり、`index.stories.tsx` のような重複ファイル名を避けられます。

#### 4. ストーリー構造とコードベース構造の一致

Storybook のメニュー構造をアプリケーションのフォルダ構造に一致させます。

```typescript
// src/components/forms/Input/Input.stories.tsx
export default {
  title: 'Components/Forms/Input',  // フォルダ構造と一致
  component: Input,
};
```

これにより以下が実現できます:
- ストーリーの検索が容易
- コード構造の理解が進む
- 新メンバーのオンボーディングが効率化

#### 5. デコレーターの効果的な活用

デコレーターを使用して、ストーリーに一貫したコンテキストやスタイリングを提供します。

```typescript
// ストーリーレベルのデコレーター
export const WithBackground: Story = {
  args: {
    label: 'Button',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '3rem', backgroundColor: '#f0f0f0' }}>
        <Story />
      </div>
    ),
  ],
};

// コンポーネントレベルのデコレーター
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <div style={{ margin: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

// グローバルデコレーター（.storybook/preview.js）
export const decorators = [
  (Story) => (
    <ThemeProvider theme={theme}>
      <Story />
    </ThemeProvider>
  ),
];
```

適用優先順位: ストーリー > コンポーネント > グローバル

### チーム開発での運用

#### 1. 新コンポーネントには必ずストーリーを作成

PR チェックリストに Storybook の作成を含めることを推奨します。これにより:
- コンポーネントライブラリが自然に構築される
- 一貫したドキュメントが維持される
- デザイナーや QA とのコミュニケーションが円滑化

#### 2. 一貫した開発環境の維持

開発モードと本番モードで異なる設定を使用します。

```json
// package.json
{
  "scripts": {
    "storybook": "NODE_ENV=production storybook",
    "storybook:dev": "NODE_ENV=development storybook"
  }
}
```

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
    check: !isDevelopment,  // 開発時は型チェックをスキップ
  },
};
```

**理由**: 開発時はアドオンやドキュメント生成を無効化することで、起動・リロード時間を大幅に短縮できます。

#### 3. ストーリーを単体テストとして活用

Storybook と Testing Library、Vitest、Playwright を統合することで、ストーリーをそのままテストケースとして活用できます。

```typescript
// Button.stories.tsx
export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
  },
};
```

```bash
# ストーリーをテストとして実行
npm run test-storybook
```

### 参照情報源

- [DEV.to - A Guide to Storybook UI Development](https://dev.to/austinwdigital/a-guide-to-storybook-ui-development-testing-and-documentation-3ogd)
- [Atomic Object - Storybook Tips](https://spin.atomicobject.com/storybook-tips/)

## ドキュメント化のベストプラクティス

### ドキュメントページの活用

#### 1. イントロダクションページの作成

各コンポーネントカテゴリに対して、MDX でドキュメントページを作成します。

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

### Secondary Button

<Canvas of={ButtonStories.Secondary} />

補助的なアクションに使用します（例: キャンセル、戻る）。

## アクセシビリティ

- すべてのボタンには適切なラベルが必要です
- 無効状態では `aria-disabled` 属性を使用します
- キーボード操作（Enter、Space）に対応しています
```

#### 2. デザイントークンとガイドラインの文書化

```mdx
{/* Colors.mdx */}
import { Meta, ColorPalette, ColorItem } from '@storybook/blocks';

<Meta title="Design System/Colors" />

# Color Palette

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="主要なブランドカラー"
    colors={{ Primary: '#007bff' }}
  />
  <ColorItem
    title="Secondary"
    subtitle="補助カラー"
    colors={{ Secondary: '#6c757d' }}
  />
</ColorPalette>
```

#### 3. フォルダでコンポーネントをグループ化

Storybook のナビゲーションを階層化し、コンポーネントを見つけやすくします。

```typescript
// src/components/Button/Button.stories.tsx
export default {
  title: 'Components/Forms/Button',
  component: Button,
};

// src/components/Input/Input.stories.tsx
export default {
  title: 'Components/Forms/Input',
  component: Input,
};

// src/components/Card/Card.stories.tsx
export default {
  title: 'Components/Layout/Card',
  component: Card,
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

### 実例から学ぶ

**BBC iPlayer**: 
- 完全なコンポーネント監査を実施
- デザイナーと開発者の単一の真実の情報源として Storybook を活用
- コードと Markdown を組み合わせたクロス分野のストーリー作成

**Audi**:
- 330 以上のストーリーを含む React UI コンポーネントを文書化
- ブランドイメージと実際のユースケースを結びつけた説明文を追加

### 参照情報源

- [Supernova - Top Storybook Documentation Examples](https://supernova-io.medium.com/top-storybook-documentation-examples-and-the-lessons-you-can-learn-ebf4dd21914e)
- [Storybook 公式 - How to document components](https://storybook.js.org/docs/writing-docs)

## パフォーマンス最適化

### 大規模プロジェクト向けの最適化

#### 1. SWC コンパイラの採用

Webpack は強力ですが、大規模プロジェクトでは遅くなります。Rust で書かれた SWC コンパイラに切り替えることで、ビルド時間を大幅に短縮できます。

```bash
npx storybook@latest add @storybook/addon-webpack5-compiler-swc
```

#### 2. 開発モードでのアドオンとドキュメントのスキップ

開発中は必要最小限のアドオンのみを有効化します。

```javascript
// .storybook/main.js
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  addons: isDevelopment
    ? ['@storybook/addon-webpack5-compiler-swc']
    : [
        '@storybook/addon-webpack5-compiler-swc',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-a11y',
      ],
  typescript: {
    check: !isDevelopment,
    reactDocgen: isDevelopment ? false : 'react-docgen-typescript',
  },
};
```

#### 3. lazyCompilation の有効化

Webpack 5 の lazy compilation 機能により、必要なストーリーのみがコンパイルされます。

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

#### 4. 特定のストーリーのみを読み込む

開発中は作業中のストーリーのみを読み込みます。

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

#### 5. 本番ビルドの最適化

```bash
# テスト用に最適化されたビルド
npm run build-storybook -- --test
```

これにより、ドキュメント生成がスキップされ、ビルド時間が短縮されます。

### パフォーマンスアドオンの活用

```bash
npm install @storybook/addon-performance
```

```typescript
// Button.stories.tsx
export const PerformanceTest: Story = {
  parameters: {
    performance: {
      allowedGroups: ['client'],  // クライアントサイドのみ測定
    },
  },
};
```

**推奨**: 本番ビルドで正確なパフォーマンス測定を実施します。

### 参照情報源

- [Denieler - Efficient Storybook for Large Repositories](https://denieler.com/blog/efficient-storybook-for-large-repositories)
- [Storybook 公式 - Performance Addon](https://storybook.js.org/addons/storybook-addon-performance)
- [Storybook Blog - Vite vs Webpack Performance](https://storybook.js.org/blog/storybook-performance-from-webpack-to-vite/)

## セキュリティ推奨事項

### 環境変数の取り扱い

#### CVE-2025-68429: 環境変数の意図しないバンドル

**脆弱性の概要**: Storybook 7.0.0 〜 7.6.20、8.0.0 〜 8.6.14、9.0.0 〜 9.1.16、10.0.0 〜 10.1.9 では、`.env` ファイルの環境変数が `storybook build` で作成されるバンドルに意図せず含まれる可能性があります。

**影響範囲**:
- `.env` ファイルが存在するディレクトリで `storybook build` を実行
- ビルドした Storybook をウェブに公開

**影響を受けないケース**:
- `.env` ファイルなしでビルド（CI 環境で環境変数をプラットフォーム経由で提供）
- `storybook dev`（開発環境）
- リポジトリを共有するデプロイ済みアプリケーション

#### 対策

**1. Storybook のアップグレード（必須）**

```bash
# 最新の安全なバージョンにアップグレード
npm install storybook@latest

# 対応バージョン
# 7.6.21+, 8.6.15+, 9.1.17+, 10.1.10+
```

**2. 機密情報の監査とローテーション**

`.env` ファイルに含まれていた機密情報（API キー、トークンなど）を特定し、ローテーションします。

**3. 環境変数の安全な参照方法**

環境変数を Storybook で使用する場合は、以下のいずれかの方法を採用します:

**方法 A: `STORYBOOK_` プレフィックスの使用**

```bash
# .env
STORYBOOK_API_ENDPOINT=https://api.example.com
```

```typescript
// 自動的にバンドルに含まれる（機密情報を含めない）
const apiEndpoint = process.env.STORYBOOK_API_ENDPOINT;
```

**方法 B: `env` プロパティで明示的に指定**

```javascript
// .storybook/main.js
module.exports = {
  env: (config) => ({
    ...config,
    API_ENDPOINT: 'https://api.example.com',
  }),
};
```

**⚠️ 重要**: どちらの方法でも、機密情報（API キー、トークン、パスワードなど）は含めないでください。これらの値はビルドされたバンドルに含まれ、公開されます。

### 依存関係のセキュリティ

#### セキュリティアドバイザリの報告

脆弱性を発見した場合:
- GitHub の Security Advisory 機能を使用して報告
- X（Twitter）または Bluesky で Storybook メンテナーに連絡

**注意**: 依存関係の脆弱性のみを理由にセキュリティアドバイザリを開かないでください。Storybook 自体に実際のセキュリティリスクがあることを明確に説明する必要があります。

#### サポートバージョン

- 主に最新リリースのみにセキュリティパッチを提供
- 高リスク脆弱性の場合、最新メジャーリリースから最新マイナーバージョンまでバックポート

### 参照情報源

- [CVE-2025-68429 - NIST NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-68429)
- [Storybook Security Policy](https://github.com/storybookjs/storybook/security)
- [Chromatic - Storybook Security Advisory](https://www.chromatic.com/blog/storybook-security-advisory/)

## トラブルシューティング

### よくある問題と解決策

#### 1. 初期設定が複雑で時間がかかる

**問題**: Storybook のセットアップに時間がかかり、特に初めての場合は複雑に感じる。

**解決策**:
- `npx storybook@latest init` の自動検出機能を活用
- 公式チュートリアル「Learn Storybook」を参照
- コミュニティのスターターテンプレートを利用

**推奨リソース**:
- [Learn Storybook](https://www.learnstorybook.com/)
- [Awesome Storybook](https://github.com/lauthieb/awesome-storybook)

#### 2. 大量のストーリーの管理が困難

**問題**: プロジェクトの成長に伴い、ストーリーの検索や整理が難しくなる。

**解決策**:
- 一貫した命名規約を採用
- フォルダ構造をアプリケーションと一致させる
- MDX でカテゴリごとのイントロダクションページを作成
- `title` プロパティで階層構造を明確化

```typescript
// 推奨する階層構造
export default {
  title: 'Design System/Components/Forms/Button',
  component: Button,
};
```

#### 3. フレームワークやライブラリの互換性問題

**問題**: 使用している特定のフレームワークやライブラリで Storybook が正常に動作しない。

**解決策**:
- Storybook の公式サポートフレームワークを確認
- コミュニティメンテナンスのフレームワーク（Analog、Nuxt、SolidJS）を検討
- GitHub Issues で同様の問題を検索
- Discord コミュニティで質問

**サポートフレームワーク**:
- React（Vite / Webpack / Next.js）
- Vue（Vite）
- Angular
- Svelte（Vite / SvelteKit）
- Web Components

#### 4. アドオンが Composed Storybook で動作しない

**問題**: 複数の Storybook を統合（composition）した場合、アドオンが動作しない。

**現状**: Storybook 6.0+ の composition 機能には制限があり、アドオンは現在サポートされていません。

**回避策**:
- 各個別 Storybook でアドオンを使用
- 統合 Storybook は表示用途に限定
- 将来のアップデートを待つ

#### 5. 本番ビルドで「No Preview」エラー

**問題**: `serve` パッケージで本番ビルドを確認すると「No Preview」エラーが表示される。

**原因**: `serve` のリライト処理により `/iframe.html` が `/iframe` にリライトされる。

**解決策**: `http-server` を使用します。

```bash
npx http-server storybook-static
```

#### 6. MDX のスタイルが正しく適用されない

**問題**: MDX でコードブロックを使用する際、改行によってスタイルが崩れる。

**解決策**: 改行の位置を調整します。

```mdx
{/* ❌ 動作しない */}
<style>{`
  .class1 { ... }
  .class2 { ... }
`}</style>

{/* ✅ 動作する */}
<style>
  {`
    .class1 { ... }
    .class2 { ... }
  `}
</style>
```

### 参照情報源

- [Storybook FAQ](https://storybook.js.org/docs/faq)
- [Clean Commit - Benefits and Frustrations of Using Storybook](https://cleancommit.io/blog/the-benefits-and-frustrations-of-using-storybook/)

## アドオンエコシステム

### 推奨アドオン

Storybook のアドオン API により、機能を無限に拡張できます。クロスフレームワーク対応のため、React プロジェクトで作成したアドオンを Vue や Angular でも再利用できます。

#### 必須アドオン（Essentials）

```bash
# デフォルトでインストール済み
@storybook/addon-essentials
```

含まれるアドオン:
- **Docs**: 自動ドキュメント生成
- **Controls**: props の動的変更
- **Actions**: イベントハンドラーのログ
- **Viewport**: レスポンシブデザインのテスト
- **Backgrounds**: 背景色の変更
- **Toolbars**: カスタムツールバーの追加

#### アクセシビリティ

```bash
npm install @storybook/addon-a11y
```

```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-a11y'],
};
```

コンポーネントのアクセシビリティ問題を自動検出します（axe-core を使用）。

#### インタラクションテスト

```bash
npm install @storybook/addon-interactions @storybook/test
```

```typescript
import { userEvent, within, expect } from '@storybook/test';

export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    
    await userEvent.click(button);
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
  },
};
```

#### デザインツール連携

**Figma**:
```bash
npm install storybook-addon-designs
```

**Zeplin / Adobe XD / Sketch**:
コミュニティアドオンが利用可能です。

#### パフォーマンス測定

```bash
npm install @storybook/addon-performance
```

コンポーネントのレンダリング性能を測定します。

#### ビジュアルリグレッションテスト

**Chromatic**（公式推奨）:
```bash
npm install chromatic
npx chromatic --project-token=<your-project-token>
```

UI の視覚的変更を自動検出し、PR でレビューできます。

### カスタムアドオンの作成

```typescript
// .storybook/my-addon/register.tsx
import { addons, types } from '@storybook/manager-api';
import { AddonPanel } from '@storybook/components';

addons.register('my-addon', () => {
  addons.add('my-addon/panel', {
    type: types.PANEL,
    title: 'My Addon',
    render: ({ active, key }) => (
      <AddonPanel active={active} key={key}>
        <div>Custom Addon Content</div>
      </AddonPanel>
    ),
  });
});
```

**アドオン作成のメリット**:
- 数時間で作成可能
- 組織固有のツールやワークフローと統合
- クロスフレームワークで再利用可能

### アドオン活用事例

**Intuit**: 
- デザインとドキュメントの標準化テンプレート
- テーマサポートの統合

**Naver**:
- React、Vue、Angular の複数フレームワークでコード表示

**Whitespace**:
- HTML アドオンでバックエンド開発者との連携を効率化

**EatWith**:
- 複数ビューポート同時プレビューでレスポンシブデザインを確保

### 参照情報源

- [LinkedIn - Revamping Storybook's Addon Ecosystem](https://www.linkedin.com/pulse/revamping-storybooks-addon-ecosystem-dominic-nguyen)
- [Storybook Community - GitHub](https://github.com/storybook-community)
- [Storybook Addon Catalog](https://storybook.js.org/integrations)

## CI/CD とデプロイ

### Storybook の公開

#### 静的サイトとしてのビルド

```bash
# 本番ビルド
npm run build-storybook

# ビルド結果のプレビュー
npx http-server ./storybook-static
```

#### Chromatic へのデプロイ（推奨）

Chromatic は Storybook の公式ホスティング・視覚テストサービスです。

```bash
# Chromatic のインストール
npm install chromatic --save-dev

# デプロイ
npx chromatic --project-token=<your-project-token>
```

**メリット**:
- 自動視覚リグレッションテスト
- PR への自動コメント
- コンポーネント履歴とバージョニング
- コミット単位での比較

#### GitHub Pages へのデプロイ

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

concurrency:
  group: 'pages'
  cancel-in-progress: false

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

#### その他のホスティングオプション

- **Netlify**: ドラッグ&ドロップでデプロイ可能
- **Vercel**: Git 統合で自動デプロイ
- **AWS S3**: 静的ホスティング
- **Azure Static Web Apps**: Microsoft 環境での統合

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

### バージョニングと履歴管理

Chromatic を使用すると:
- コミット単位でのコンポーネント履歴
- ブランチ間でのビジュアル比較
- 過去バージョンとの比較

これにより、実装レビュー時に異なるブランチやコミット間でコンポーネントを比較できます。

### 参照情報源

- [Storybook 公式 - Publishing Storybook](https://storybook.js.org/docs/sharing/publish-storybook)
- [Nx - Storybook Best Practices](https://nx.dev/docs/technologies/test-tools/storybook/guides/best-practices)

## テスト戦略

### Storybook を中心としたテストピラミッド

Storybook はストーリーを UI テストの起点として活用できます。

```
       E2E Tests (Playwright/Cypress)
              ↑
      Integration Tests (Testing Library)
              ↑
   Visual Regression Tests (Chromatic)
              ↑
    Interaction Tests (play function)
              ↑
         Stories (Storybook)
```

### インタラクションテスト

```typescript
import { userEvent, within, expect } from '@storybook/test';

export const FormSubmission: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // フォームに入力
    await userEvent.type(canvas.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    
    // 送信ボタンをクリック
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
    
    // 成功メッセージを確認
    await expect(canvas.getByText('Success!')).toBeInTheDocument();
  },
};
```

### ビジュアルリグレッションテスト

**Chromatic を使用した自動化**:

```bash
# Chromatic でビジュアルテストを実行
npx chromatic --exit-zero-on-changes
```

PR で新規・変更されたストーリーを自動スキャンし、ビジュアル変更をレビューできます。

### API モッキング

```typescript
import { http, HttpResponse } from 'msw';

export const WithMockedAPI: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/user', () => {
          return HttpResponse.json({
            id: 1,
            name: 'John Doe',
          });
        }),
      ],
    },
  },
};
```

### アクセシビリティテスト

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

### スナップショットテスト

```bash
# Storybook のストーリーからスナップショットを生成
npm run test-storybook -- --coverage
```

### E2E テストとの統合

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// button.spec.ts
import { test, expect } from '@playwright/test';

test('Button story renders correctly', async ({ page }) => {
  await page.goto('http://localhost:6006/iframe.html?id=components-button--primary');
  
  const button = page.locator('button');
  await expect(button).toHaveText('Primary');
  await expect(button).toBeVisible();
});
```

### テスト戦略の推奨事項

1. **ストーリーを単体テストの基礎として使用**: すべての主要な状態とエッジケースをストーリーで網羅
2. **インタラクションテストで基本動作を確認**: ユーザー操作をシミュレート
3. **ビジュアルリグレッションで UI の一貫性を保証**: 意図しない視覚的変更を検出
4. **E2E テストは重要なユーザーフローに限定**: 完全なアプリケーションコンテキストで検証

### 参照情報源

- [Medium - Next Level Component Testing with Storybook](https://medium.com/towardsdev/next-level-component-testing-with-storybook-5c11381c7c97)
- [Storybook 公式 - Testing](https://storybook.js.org/docs/writing-tests)

## まとめ

### 重要ポイント

1. **1コンポーネント1ストーリーファイル**: コンポーネントとストーリーをコロケーションで管理
2. **CSF 形式の採用**: Component Story Format で標準的な記述
3. **命名規約の統一**: `[ComponentName].stories.[tsx|jsx]` 形式
4. **構造の一致**: Storybook メニューとコードベース構造を一致させる
5. **パフォーマンス最適化**: SWC/Vite の採用、開発モードでのアドオン無効化
6. **セキュリティ対策**: 環境変数の適切な管理、最新バージョンへのアップグレード
7. **ドキュメント化**: MDX でリッチなドキュメントを作成
8. **テスト戦略**: ストーリーをテストの基礎として活用
9. **CI/CD 統合**: 自動デプロイとビジュアルテストの実装
10. **アドオン活用**: エコシステムを活用して生産性向上

### 避けるべきアンチパターン

❌ すべてのコンポーネントを1つのストーリーファイルにまとめる
❌ `storiesOf` API を使用する（非推奨）
❌ ストーリー内にドキュメントを詰め込みすぎる
❌ デフォルト設定のまま大規模プロジェクトを運用する
❌ 機密情報を環境変数で Storybook に渡す
❌ ストーリーをテストとして活用しない
❌ アドオンやドキュメント生成を常に有効化する

### 次のステップ

1. プロジェクトに Storybook をインストール
2. 既存コンポーネントのストーリーを作成
3. MDX でドキュメントページを追加
4. インタラクションテストを実装
5. CI/CD パイプラインに統合
6. Chromatic でビジュアルテストを導入
7. チームでベストプラクティスを共有

### コミュニティリソース

- [Storybook 公式ドキュメント](https://storybook.js.org/docs)
- [Learn Storybook](https://www.learnstorybook.com/)
- [Awesome Storybook](https://github.com/lauthieb/awesome-storybook)
- [Storybook Discord](https://discord.gg/invite/storybook)
- [Storybook GitHub Discussions](https://github.com/storybookjs/storybook/discussions)

---

**最終更新**: 2026年2月1日  
**収集した情報源**: 15+ のコミュニティ記事、公式ドキュメント、実装ガイド
