# Ant Design 公式ベストプラクティス

## 概要

Ant Design は、Ant Group が開発したエンタープライズ向け React UI ライブラリです。高品質なコンポーネントとデザインガイドラインを提供し、モダンでレスポンシブ、高性能な Web アプリケーションの構築を支援します。

### 主要機能

- 🌈 Web アプリケーション向けエンタープライズクラス UI デザイン
- 📦 すぐに使える高品質な React コンポーネントセット
- 🛡 予測可能な静的型を持つ TypeScript で記述
- ⚙️ デザインリソースと開発ツールの完全なパッケージ
- 🌍 数十の言語の国際化サポート
- 🎨 細部に至るまでの強力なテーマカスタマイズ

### 動作環境

- React 18 以上（v6 以降）
- モダンブラウザ（Edge、Firefox、Chrome、Safari 各最新2バージョン）
- サーバーサイドレンダリング対応
- Electron 対応

## 推奨設定

### 基本設定

#### インストール

```bash
# npm
npm install antd --save

# yarn
yarn add antd

# pnpm
pnpm add antd

# bun
bun add antd
```

#### 基本的な使用方法

```tsx
import React from 'react';
import { DatePicker } from 'antd';

const App = () => {
  return <DatePicker />;
};

export default App;
```

#### Tree Shaking（オンデマンドインポート）

antd は ES モジュールの Tree Shaking をサポートしています。使用しないコードは自動的に除外されます。

```tsx
// ✅ 推奨: 必要なコンポーネントのみインポート
import { Button, DatePicker } from 'antd';

// ❌ 非推奨: ファイル全体の読み込み（CDN利用時を除く）
// import antd from 'antd';
```

### App コンポーネントによるグローバル設定

`App` コンポーネントを使用することで、`message`、`notification`、`modal` の静的メソッドをコンテキスト付きで利用できます。

```tsx
import React from 'react';
import { App } from 'antd';

const MyPage: React.FC = () => {
  const { message, notification, modal } = App.useApp();

  const showMessage = () => {
    message.success('成功しました！');
  };

  const showNotification = () => {
    notification.info({ message: '通知', description: '詳細情報です' });
  };

  const showModal = () => {
    modal.confirm({ title: '確認', content: '実行しますか？' });
  };

  return (
    <div>
      <button onClick={showMessage}>メッセージ表示</button>
    </div>
  );
};

const MyApp: React.FC = () => (
  <App>
    <MyPage />
  </App>
);

export default MyApp;
```

### ConfigProvider との組み合わせ

App コンポーネントは ConfigProvider の Token を使用するため、両者をペアで配置する必要があります。

```tsx
import { ConfigProvider, App } from 'antd';

const MyApp = () => (
  <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
    <App>
      {/* アプリケーションのコンテンツ */}
    </App>
  </ConfigProvider>
);
```

### テーマ設定

#### Design Token によるテーマカスタマイズ

```tsx
import { ConfigProvider, Button, Space } from 'antd';

const App: React.FC = () => (
  <ConfigProvider
    theme={{
      token: {
        // Seed Token
        colorPrimary: '#00b96b',
        borderRadius: 2,

        // Alias Token
        colorBgContainer: '#f6ffed',
      },
    }}
  >
    <Space>
      <Button type="primary">Primary</Button>
      <Button>Default</Button>
    </Space>
  </ConfigProvider>
);
```

#### プリセットアルゴリズムの使用

```tsx
import { ConfigProvider, theme } from 'antd';

const App: React.FC = () => (
  <ConfigProvider
    theme={{
      // ダークモード
      algorithm: theme.darkAlgorithm,

      // 複数のアルゴリズムを組み合わせる場合
      // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
    }}
  >
    <YourApp />
  </ConfigProvider>
);
```

#### コンポーネント単位のトークンカスタマイズ

```tsx
<ConfigProvider
  theme={{
    components: {
      Button: {
        colorPrimary: '#00b96b',
        algorithm: true, // アルゴリズムを有効化
      },
      Input: {
        colorPrimary: '#eb2f96',
        algorithm: true,
      },
    },
  }}
>
  <YourApp />
</ConfigProvider>
```

#### ネストされたテーマ

```tsx
<ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
  <Space>
    <Button type="primary">テーマ1</Button>
    <ConfigProvider theme={{ token: { colorPrimary: '#00b96b' } }}>
      <Button type="primary">テーマ2</Button>
    </ConfigProvider>
  </Space>
</ConfigProvider>
```

#### Design Token の取得と使用

```tsx
import { theme } from 'antd';

const { useToken } = theme;

const App: React.FC = () => {
  const { token } = useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorPrimaryBg,
        padding: token.padding,
        borderRadius: token.borderRadius,
      }}
    >
      Design Token を使用したスタイリング
    </div>
  );
};
```

## コンポーネント使用ガイドライン

### 制御コンポーネントにおける undefined と null の違い

antd では、制御コンポーネントにおいて `undefined` と `null` の扱いが異なります。

- `undefined`: 非制御コンポーネントとして扱われる
- `null`: 空値を持つ制御コンポーネントとして扱われる

```tsx
// ✅ 値をクリアしたい場合は null を使用
<Select value={null} />

// ❌ undefined は非制御状態になる
<Select value={undefined} />
```

### Select-like コンポーネントの option 値

```tsx
// ✅ 推奨: string または number を使用
<Select options={[
  { value: 'option1', label: 'オプション1' },
  { value: 1, label: 'オプション2' },
]} />

// ❌ 非推奨: undefined や null を value に使用しない
<Select options={[
  { value: undefined, label: '未選択' }, // 避ける
]} />
```

### ポップアップコンポーネントのスクロール対応

ページスクロール時にポップアップが追従してしまう問題を解決するには：

```tsx
// コンポーネント単位での設定
<Select getPopupContainer={(trigger) => trigger.parentElement} />

// グローバル設定
<ConfigProvider getPopupContainer={(node) => {
  if (node) {
    return node.parentNode;
  }
  return document.body;
}}>
  <App />
</ConfigProvider>
```

親要素には `position: relative` または `position: absolute` を設定してください。

### 静的メソッドの制限事項

`message.xxx`、`notification.xxx`、`Modal.confirm` などの静的メソッドは、`ConfigProvider` のコンテキストを取得できません。

```tsx
// ❌ ConfigProvider の theme や prefixCls が適用されない
message.success('メッセージ');

// ✅ 推奨: useMessage、useNotification、useModal を使用
const [messageApi, contextHolder] = message.useMessage();

// または App.useApp() を使用
const { message } = App.useApp();
message.success('メッセージ');
```

## パフォーマンス

### アニメーションの無効化

パフォーマンスが重要な場合、アニメーションを無効化できます。

```tsx
<ConfigProvider theme={{ token: { motion: false } }}>
  <App />
</ConfigProvider>
```

### ゼロランタイムモード（v6.0.0以降）

```tsx
// CSS ファイルを手動でインポート
import 'antd/dist/antd.css';

export default () => (
  <ConfigProvider theme={{ zeroRuntime: true }}>
    <App />
  </ConfigProvider>
);
```

### サーバーサイドレンダリング

#### インラインスタイル方式

```tsx
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { renderToString } from 'react-dom/server';

const App = () => {
  const cache = React.useMemo(() => createCache(), []);
  const html = renderToString(
    <StyleProvider cache={cache}>
      <MyApp />
    </StyleProvider>
  );

  const styleText = extractStyle(cache);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${styleText}
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `;
};
```

#### 静的 CSS ファイルの事前生成

```tsx
// scripts/genAntdCss.tsx
import fs from 'fs';
import { extractStyle } from '@ant-design/static-style-extract';

const outputPath = './public/antd.min.css';
const css = extractStyle();

fs.writeFileSync(outputPath, css);
```

## アクセシビリティ

### RTL（右から左）サポート

```tsx
<ConfigProvider direction="rtl">
  <App />
</ConfigProvider>
```

### 国際化

```tsx
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja');

const App = () => (
  <ConfigProvider locale={jaJP}>
    <YourApp />
  </ConfigProvider>
);
```

対応言語: 日本語（ja_JP）、英語（en_US）、中国語（zh_CN, zh_TW）、韓国語（ko_KR）など60以上の言語

## セキュリティ

### Content Security Policy (CSP)

動的スタイルを使用する場合、CSP の nonce を設定できます。

```tsx
<ConfigProvider csp={{ nonce: 'YourNonceCode' }}>
  <Button>My Button</Button>
</ConfigProvider>
```

### holderRender による静的メソッドの設定

```tsx
ConfigProvider.config({
  holderRender: (children) => (
    <ConfigProvider
      prefixCls="ant"
      iconPrefixCls="anticon"
      theme={{ token: { colorPrimary: 'red' } }}
    >
      {children}
    </ConfigProvider>
  ),
});
```

## よくある落とし穴

### defaultValue の動的変更が機能しない

`defaultValue` は初回レンダリング時のみ有効です。動的に値を変更する場合は `value` と `onChange` を使用してください。

```tsx
// ❌ 動的変更が反映されない
<Input defaultValue={dynamicValue} />

// ✅ 制御コンポーネントとして使用
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

### props を変更可能な方法で変更してもコンポーネントが更新されない

antd は props の浅い比較を使用してパフォーマンスを最適化しています。状態を更新する際は常に新しいオブジェクトを渡してください。

```tsx
// ❌ 元のオブジェクトを直接変更
data.push(newItem);
setData(data);

// ✅ 新しい配列/オブジェクトを作成
setData([...data, newItem]);
```

### theme が undefined からオブジェクトに、またはその逆に変更されるとコンポーネントが再マウントされる

```tsx
// ❌ undefined と {} を切り替えると再マウントが発生
<ConfigProvider theme={isDark ? darkTheme : undefined}>

// ✅ 空オブジェクトを使用
<ConfigProvider theme={isDark ? darkTheme : {}}>
```

### Modal の getPopupContainer 設定時のエラー

```tsx
// ❌ triggerNode が undefined の場合がある
<ConfigProvider getPopupContainer={(trigger) => trigger.parentNode}>

// ✅ null チェックを追加
<ConfigProvider
  getPopupContainer={(node) => {
    if (node) {
      return node.parentNode;
    }
    return document.body;
  }}
>
```

### Next.js App Router でのサブコンポーネントエラー

```tsx
// ❌ サーバーコンポーネントでエラーが発生
<Form.Item>...</Form.Item>

// ✅ ファイル先頭に 'use client' を追加
'use client';

// または、ラッパーコンポーネントを作成して re-export
```

### Vite 本番モードでのロケール問題

```tsx
// ❌ 本番モードで問題が発生する可能性
import enUS from 'antd/locale/en_US';

// ✅ es ディレクトリから直接インポート
import enUS from 'antd/es/locale/en_US';
```

## v5 から v6 へのマイグレーション

### 事前確認

1. React 18 以上にアップグレード
2. @ant-design/icons を v6 にアップグレード
3. モダンブラウザのみをターゲットにする（IE は非サポート）

```bash
npm install --save antd@6 @ant-design/icons@6
```

### 主な非推奨 API（v7 で削除予定）

| コンポーネント | 非推奨 API | 代替 API |
|--------------|-----------|---------|
| Alert | closeText | closable.closeIcon |
| Alert | message | title |
| Card | bodyStyle | styles.body |
| Card | headStyle | styles.header |
| Modal | bodyStyle | styles.body |
| Modal | maskStyle | styles.mask |
| Modal | destroyOnClose | destroyOnHidden |
| Drawer | width/height | size |
| Select | dropdownClassName | classNames.popup.root |
| Select | dropdownStyle | styles.popup.root |
| Tooltip | overlayClassName | classNames.root |
| Tooltip | overlayStyle | styles.root |

### オーバーレイコンポーネントのブラー効果

v6 ではデフォルトでブラー効果が有効です。無効にする場合：

```tsx
<ConfigProvider
  modal={{ mask: { blur: false } }}
  drawer={{ mask: { blur: false } }}
>
  <App />
</ConfigProvider>
```

### Tag のマージン調整

v6 では Tag の末尾マージンが削除されました。以前のスタイルを維持する場合：

```tsx
<ConfigProvider
  tag={{
    styles: {
      root: { marginInlineEnd: 8 },
    },
  }}
>
  <Tag>Tag A</Tag>
  <Tag>Tag B</Tag>
</ConfigProvider>
```

## 参考リンク

- [公式ドキュメント](https://ant.design/)
- [GitHub リポジトリ](https://github.com/ant-design/ant-design)
- [テーマエディタ](https://ant.design/theme-editor)
- [Ant Design Pro](https://pro.ant.design/)
- [Pro Components](https://procomponents.ant.design/)
- [マイグレーションガイド（v5→v6）](https://ant.design/docs/react/migration-v6)
- [FAQ](https://ant.design/docs/react/faq)
- [Changelog](https://ant.design/changelog)
- [CodeSandbox テンプレート](https://u.ant.design/reproduce)
