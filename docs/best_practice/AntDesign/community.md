## 概要

Ant Design（antd）は、Alibaba 傘下の Ant Group が開発した React UI ライブラリで、GitHub スター数 90,000 以上を誇る世界で 2 番目に人気の React UI フレームワークである。エンタープライズ向けの管理画面やダッシュボード構築に特に強みを持ち、Alibaba、Tencent、Baidu など多くの大企業で採用されている。

コミュニティでは以下の点が高く評価されている：

- 豊富なコンポーネント群と一貫したデザインシステム
- TypeScript との完全な互換性
- 充実したドキュメントとエコシステム（Ant Design Pro、Pro Components、Ant Design Charts など）
- 50 以上の言語に対応した国際化サポート

## セットアップのベストプラクティス

### 推奨ディレクトリ構成

コミュニティで広く採用されている構成パターン：

```
src/
├── components/     # 再利用可能な React コンポーネント
├── pages/          # ルートまたはページコンポーネント
├── layouts/        # レイアウトコンポーネント
├── services/       # API 通信モジュール
├── utils/          # ユーティリティ関数
├── styles/         # グローバルスタイル、テーマ設定
├── assets/         # 静的アセット（画像、フォント）
└── context/        # Context API 定義（オプション）
```

### ファイル命名規則

- **コンポーネント**: PascalCase（例: `UserProfile.tsx`）
- **スタイル**: kebab-case（例: `user-profile.module.css`）
- **モジュール**: camelCase（例: `dateFormatter.ts`）

### インストールとセットアップ

```bash
npm install antd
# または
yarn add antd
# または
bun add antd
```

### ConfigProvider によるグローバル設定

```tsx
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ConfigProvider
    locale={jaJP}
    theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
    }}
  >
    <App />
  </ConfigProvider>
);
```

## 実践的な使用パターン

### フォーム管理

#### Form コンポーネントの基本パターン

```tsx
import { Form, Input, Button } from 'antd';

const MyForm = () => {
  const [form] = Form.useForm();

  const onFinish = (values: FormValues) => {
    console.log('Form values:', values);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="email"
        label="メールアドレス"
        rules={[
          { required: true, message: 'メールアドレスを入力してください' },
          { type: 'email', message: '有効なメールアドレスを入力してください' },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          送信
        </Button>
      </Form.Item>
    </Form>
  );
};
```

#### フォーム最適化のポイント

- `Form.Item` の `dependencies` プロパティを適切に使用し、不要な再検証を防ぐ
- リアルタイムバリデーションにはデバウンスを実装する
- 必要な場合のみ制御コンポーネントを使用する（パフォーマンス向上のため）

#### undefined と null の使い分け

antd では `undefined` と `null` の扱いが異なる：

- `undefined`: 非制御コンポーネントとして扱われる
- `null`: 空の値を持つ制御コンポーネントとして扱われる

```tsx
// allowClear などで値をクリアする場合は null を使用
form.setFieldsValue({ fieldName: null });
```

#### 日付フィールドの扱い

```tsx
import dayjs from 'dayjs';
import { DatePicker, Form } from 'antd';

const getFormattedDate = (date: dayjs.Dayjs | null) =>
  date ? dayjs(date).format('YYYY-MM-DD') : undefined;

const DateForm = ({ initialDate }: { initialDate?: string }) => {
  const [form] = Form.useForm();

  const initialValues = {
    date: initialDate ? dayjs(initialDate) : undefined,
  };

  const onFinish = (values: { date: dayjs.Dayjs }) => {
    const formattedDate = getFormattedDate(values.date);
    // API に送信
  };

  return (
    <Form form={form} initialValues={initialValues} onFinish={onFinish}>
      <Form.Item name="date" label="日付">
        <DatePicker />
      </Form.Item>
    </Form>
  );
};
```

### テーブル・リスト

#### Virtual Table による大規模データの表示

v5 以降、Table コンポーネントは `virtual` プロパティをサポートしており、大規模データセットでのパフォーマンスが大幅に向上している：

```tsx
import { Table } from 'antd';

<Table
  virtual
  scroll={{ x: 2000, y: 500 }}
  dataSource={largeDataset}
  columns={columns}
  rowKey="id"
/>;
```

Virtual Table の特徴：

- 固定カラム（Fixed columns）対応
- 展開可能な行（Expandable）対応
- 行・列の結合（RowSpan & ColSpan）対応

#### テーブルパフォーマンス改善のヒント

- `rowKey` を必ず指定し、不要な再レンダリングを防ぐ
- 非表示カラムはレンダリングしない
- 300 行以上のデータには仮想スクロールを検討する

```tsx
// rowKey の指定
<Table
  dataSource={data}
  columns={columns}
  rowKey="id" // または rowKey={(record) => record.id}
/>
```

#### react-window との併用（高度なカスタマイズ）

デフォルトの Virtual Table で要件を満たせない場合：

```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedTable = ({ data, columns }) => {
  const Row = ({ index, style }) => (
    <div style={style}>{renderRow(data[index], columns)}</div>
  );

  return (
    <List height={400} itemCount={data.length} itemSize={35} width="100%">
      {Row}
    </List>
  );
};
```

### モーダル・ドロワー

#### ポップアップのスクロール問題対策

ポップアップコンポーネント（Select、DatePicker、Popover など）がスクロールに追従してしまう問題の解決：

```tsx
// 個別のコンポーネントで設定
<Select getPopupContainer={(trigger) => trigger.parentElement!} />

// アプリ全体で設定
<ConfigProvider getPopupContainer={(trigger) => trigger?.parentElement || document.body}>
  <App />
</ConfigProvider>
```

親要素には `position: relative` または `position: absolute` を設定する必要がある。

#### Static メソッドとフックの使い分け

`message`、`notification`、`Modal.confirm` の静的メソッドは ConfigProvider の影響を受けないため、フックベースの API を推奨：

```tsx
import { App, Button } from 'antd';

const MyComponent = () => {
  const { message, notification, modal } = App.useApp();

  const showMessage = () => {
    message.success('成功しました！');
  };

  return <Button onClick={showMessage}>メッセージ表示</Button>;
};

// アプリのルートで App コンポーネントでラップ
const Root = () => (
  <App>
    <MyComponent />
  </App>
);
```

## パフォーマンス最適化

### コンポーネントの遅延ロード

```tsx
import React, { Suspense } from 'react';
import { Spin } from 'antd';

const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

const MyPage = () => (
  <Suspense fallback={<Spin size="large" />}>
    <HeavyComponent />
  </Suspense>
);
```

### バンドルサイズの最適化

#### Tree-shaking に対応したインポート

```tsx
// ✅ 推奨: 必要なコンポーネントのみインポート
import { Button, Table } from 'antd';

// ❌ 非推奨: ライブラリ全体のインポート（bundler が対応していない場合）
import * as antd from 'antd';
```

v5 以降は ES Modules をサポートしているため、モダンなバンドラー（Vite、webpack 5 など）では自動的に Tree-shaking が適用される。

### メモ化とキャッシング

```tsx
import React, { useMemo, useCallback } from 'react';
import { Table } from 'antd';

const OptimizedTable = ({ data, onRowClick }) => {
  // 高コストな計算結果をメモ化
  const processedData = useMemo(() => processData(data), [data]);

  // イベントハンドラをメモ化
  const handleRowClick = useCallback(
    (record) => {
      onRowClick(record);
    },
    [onRowClick]
  );

  // カラム定義をメモ化
  const columns = useMemo(
    () => [
      { title: '名前', dataIndex: 'name' },
      { title: '年齢', dataIndex: 'age' },
    ],
    []
  );

  return (
    <Table
      dataSource={processedData}
      columns={columns}
      onRow={(record) => ({ onClick: () => handleRowClick(record) })}
    />
  );
};

export default React.memo(OptimizedTable);
```

### アニメーションの無効化

パフォーマンスが重要な場面ではモーションを無効化：

```tsx
<ConfigProvider theme={{ token: { motion: false } }}>
  <App />
</ConfigProvider>
```

## カスタマイズパターン

### テーマカスタマイズ

#### Design Token を使用したカスタマイズ

```tsx
import { ConfigProvider, theme } from 'antd';

const App = () => (
  <ConfigProvider
    theme={{
      // Seed Token（ベースとなる値）
      token: {
        colorPrimary: '#1677ff',
        colorSuccess: '#52c41a',
        colorWarning: '#faad14',
        colorError: '#ff4d4f',
        borderRadius: 6,
        fontSize: 14,
      },
      // コンポーネント固有のトークン
      components: {
        Button: {
          colorPrimary: '#00b96b',
          algorithm: true,
        },
        Input: {
          colorBorder: '#d9d9d9',
        },
      },
      // アルゴリズム（ダークモードなど）
      algorithm: theme.defaultAlgorithm,
    }}
  >
    <MyApp />
  </ConfigProvider>
);
```

#### ダークモードの実装

```tsx
import { ConfigProvider, theme } from 'antd';
import { useState } from 'react';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <MyApp onToggleTheme={() => setIsDarkMode(!isDarkMode)} />
    </ConfigProvider>
  );
};
```

### コンポーネント拡張

#### HOC パターンによる拡張

```tsx
import { Button, ButtonProps } from 'antd';

interface LoadingButtonProps extends ButtonProps {
  loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  loadingText = '処理中...',
  children,
  ...props
}) => (
  <Button loading={loading} {...props}>
    {loading ? loadingText : children}
  </Button>
);

export default LoadingButton;
```

#### 型定義の取得

```tsx
import type { GetProps, GetRef, GetProp } from 'antd';
import type { Checkbox, CheckboxProps, Input } from 'antd';

// Props 型の取得
type CheckboxGroupProps = GetProps<typeof Checkbox.Group>;

// 特定の Prop 型の取得
type CheckboxValue = GetProp<CheckboxProps, 'value'>;

// Ref 型の取得
type InputRef = GetRef<typeof Input>;
```

## トラブルシューティング

### よくある問題と解決方法

#### defaultValue が動的に変更されない

`defaultValue` は初回レンダリング時のみ適用される React の仕様：

```tsx
// ❌ 動作しない
const [value, setValue] = useState('initial');
<Input defaultValue={value} />;

// ✅ 制御コンポーネントを使用
<Input value={value} onChange={(e) => setValue(e.target.value)} />;
```

#### 内部 API の使用について

ドキュメントに記載されていない内部 API の使用は非推奨。バージョンアップ時に破壊的変更が発生する可能性がある。

#### CSS-in-JS と Tailwind CSS の競合

CSS の優先度を調整して対応：

```tsx
import { StyleProvider } from '@ant-design/cssinjs';

<StyleProvider hashPriority="high">
  <App />
</StyleProvider>;
```

#### Next.js App Router での問題

サブコンポーネント（`Select.Option`、`Form.Item` など）を使用すると発生するエラーへの対処：

```tsx
'use client';

// クライアントコンポーネントとしてマーク
export default function Page() {
  return (
    <Form>
      <Form.Item>
        <Input />
      </Form.Item>
    </Form>
  );
}
```

または、ラッパーコンポーネントを作成：

```tsx
'use client';

import { Typography as OriginTypography } from 'antd';

export const Title = OriginTypography.Title;
export const Paragraph = OriginTypography.Paragraph;
```

#### レガシーブラウザでの `:where` セレクタ問題

古いブラウザでは CSS-in-JS の `:where` セレクタがサポートされていない場合がある。[互換性ドキュメント](https://ant.design/docs/react/compatible-style)を参照。

### 破壊的変更を避けるには

- 公式デモとドキュメントに記載された使用方法に従う
- バグを機能として利用しない（例: div を Tabs の children として使用）
- 通常の API で実現可能な機能に対してハックを使用しない

## チーム開発での運用

### コード分割戦略

```tsx
// ルートレベルでのコード分割
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

// コンポーネントレベルでの分割
const HeavyChart = React.lazy(() => import('./components/HeavyChart'));
```

### 推奨ツールチェーン

- **IDE**: VS Code、WebStorm
- **ビルドツール**: Vite（推奨）、webpack 5、Rsbuild
- **リンター**: ESLint + Prettier + Stylelint
- **テスト**: Jest + React Testing Library、Cypress

### アンチパターンの回避

- **DOM の直接操作を避ける**: React に更新を任せる
- **`any` 型の多用を避ける**: TypeScript の利点を活かす
- **Props の変更を避ける**: Props は読み取り専用として扱う
- **インラインスタイルを避ける**: CSS Modules または Styled Components を使用

### エラーバウンダリの実装

```tsx
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="エラーが発生しました"
          subTitle="問題が発生しました。ページを再読み込みしてください。"
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}
```

## 参考リンク

### 公式リソース

- [Ant Design 公式ドキュメント](https://ant.design/)
- [Ant Design GitHub](https://github.com/ant-design/ant-design)
- [Ant Design Pro](https://pro.ant.design/)
- [Pro Components](https://procomponents.ant.design/)
- [Ant Design Charts](https://charts.ant.design/)
- [公式 FAQ](https://ant.design/docs/react/faq)

### コミュニティリソース

- [Awesome Ant Design](https://github.com/websemantics/awesome-ant-design)
- [Ant Design Medium](http://medium.com/ant-design/)
- [Ant Design X（Twitter）](http://x.com/antdesignui)
- [Stack Overflow - antd タグ](http://stackoverflow.com/questions/tagged/antd)

### 参考記事

- [Optimizing Performance in React Apps Using Ant Design - TillItsDone](https://tillitsdone.com/blogs/react-performance-with-ant-design/)
- [Ant Design adoption guide - LogRocket](https://blog.logrocket.com/ant-design-adoption-guide/)
- [Ant Design React App Development Best Practices - Cursor Rules](https://cursorrules.org/article/ant-design-cursor-mdc-file)
- [Ant Design Tips And Tricks - Medium](https://medium.com/@sehrawy/ant-design-tips-and-tricks-f66259210d8c)
- [Virtual Table is here! - Ant Design Blog](https://ant.design/docs/blog/virtual-table/)
- [Bundle Size Optimization - Ant Design Blog](https://ant.design/docs/blog/tree-shaking/)
