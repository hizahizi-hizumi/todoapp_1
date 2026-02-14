---
description: 'Best practice rules for projects using Ant Design (React UI library) to build enterprise-grade web applications'
applyTo: '**/*.{jsx,tsx,js,ts}'
---

# Ant Design ベストプラクティス

Ant Design を使用した React アプリケーション開発のためのベストプラクティスルール。

## 目的とスコープ

このドキュメントは、Ant Design (antd) を使用するプロジェクトにおいて、パフォーマンス、保守性、一貫性を確保するためのガイドラインを定義する。

## 基本原則

- ConfigProvider をルートに配置し、グローバル設定を一元管理する
- App コンポーネントでラップして message/notification/modal のコンテキストを有効化する
- 静的メソッドではなくフック API（`useMessage`、`useNotification`、`useModal`）を優先する
- コンポーネントは必要なものだけをインポートし、Tree-shaking を活用する
- Design Token を使用してテーマをカスタマイズする

## セットアップ

### グローバル設定

ConfigProvider と App コンポーネントを組み合わせて使用する：

**推奨**:
```tsx
import { ConfigProvider, App } from 'antd';
import jaJP from 'antd/locale/ja_JP';

const Root = () => (
  <ConfigProvider
    locale={jaJP}
    theme={{
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
      },
    }}
  >
    <App>
      <MyApp />
    </App>
  </ConfigProvider>
);
```

### インポート方法

必要なコンポーネントのみをインポートする：

**推奨**:
```tsx
import { Button, Table, Form } from 'antd';
```

**非推奨**:
```tsx
import * as antd from 'antd';
```

## コンポーネント使用ガイドライン

### 制御コンポーネントの値

`undefined` と `null` の違いを理解して使用する：
- `undefined`: 非制御コンポーネントとして扱われる
- `null`: 空値を持つ制御コンポーネントとして扱われる

**推奨**:
```tsx
// 値をクリアする場合は null を使用
form.setFieldsValue({ fieldName: null });

<Select value={value ?? null} onChange={setValue} />
```

**非推奨**:
```tsx
// クリア時に undefined を使用すると非制御状態になる
form.setFieldsValue({ fieldName: undefined });
```

### defaultValue と value

動的に値を変更する場合は制御コンポーネントとして使用する：

**推奨**:
```tsx
const [value, setValue] = useState('initial');
<Input value={value} onChange={(e) => setValue(e.target.value)} />
```

**非推奨**:
```tsx
// defaultValue は初回レンダリング時のみ有効
<Input defaultValue={dynamicValue} />
```

### 静的メソッドとフック API

ConfigProvider の設定が反映されるフック API を使用する：

**推奨**:
```tsx
const MyComponent = () => {
  const { message, notification, modal } = App.useApp();

  const handleClick = () => {
    message.success('成功しました！');
  };

  return <Button onClick={handleClick}>実行</Button>;
};
```

**非推奨**:
```tsx
import { message } from 'antd';

// ConfigProvider の theme や prefixCls が適用されない
message.success('成功しました！');
```

### ポップアップコンポーネント

スクロール時の位置ずれを防ぐため、getPopupContainer を設定する：

**推奨**:
```tsx
// 個別設定
<Select getPopupContainer={(trigger) => trigger.parentElement!} />

// グローバル設定
<ConfigProvider
  getPopupContainer={(node) => node?.parentNode ?? document.body}
>
  <App />
</ConfigProvider>
```

親要素には `position: relative` または `position: absolute` を設定する。

### Select / Checkbox / Radio の option 値

value には `undefined` や `null` を使用しない：

**推奨**:
```tsx
<Select
  options={[
    { value: '', label: '選択してください' },
    { value: 'option1', label: 'オプション1' },
  ]}
/>
```

**非推奨**:
```tsx
<Select
  options={[
    { value: undefined, label: '未選択' },
  ]}
/>
```

## フォーム

### Form の基本パターン

```tsx
import { Form, Input, Button } from 'antd';

interface FormValues {
  email: string;
  password: string;
}

const LoginForm = () => {
  const [form] = Form.useForm<FormValues>();

  const onFinish = (values: FormValues) => {
    console.log('Submitted:', values);
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
          ログイン
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### 日付フィールド

dayjs を使用して値を変換する：

```tsx
import dayjs from 'dayjs';
import { DatePicker, Form } from 'antd';

const DateForm = ({ initialDate }: { initialDate?: string }) => {
  const [form] = Form.useForm();

  const initialValues = {
    date: initialDate ? dayjs(initialDate) : undefined,
  };

  const onFinish = (values: { date: dayjs.Dayjs }) => {
    const formatted = values.date?.format('YYYY-MM-DD');
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

## テーブル

### 基本設定

`rowKey` を必ず指定して不要な再レンダリングを防ぐ：

```tsx
<Table
  dataSource={data}
  columns={columns}
  rowKey="id"
/>
```

### 大規模データセット

300 行以上のデータには Virtual Table を使用する：

```tsx
<Table
  virtual
  scroll={{ x: 2000, y: 500 }}
  dataSource={largeDataset}
  columns={columns}
  rowKey="id"
/>
```

### パフォーマンス最適化

カラム定義をメモ化する：

```tsx
const columns = useMemo(
  () => [
    { title: '名前', dataIndex: 'name', key: 'name' },
    { title: '年齢', dataIndex: 'age', key: 'age' },
  ],
  []
);
```

## テーマカスタマイズ

### Design Token

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
      fontSize: 14,
    },
    components: {
      Button: {
        colorPrimary: '#00b96b',
        algorithm: true,
      },
    },
  }}
>
  <App />
</ConfigProvider>
```

### ダークモード

```tsx
import { ConfigProvider, theme } from 'antd';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <MyApp />
    </ConfigProvider>
  );
};
```

### theme の切り替え

`undefined` と空オブジェクトの切り替えで再マウントを避ける：

**推奨**:
```tsx
<ConfigProvider theme={isDark ? darkTheme : {}}>
```

**非推奨**:
```tsx
// undefined との切り替えは再マウントを引き起こす
<ConfigProvider theme={isDark ? darkTheme : undefined}>
```

### Design Token の使用

スタイリングで Design Token を参照する：

```tsx
import { theme } from 'antd';

const MyComponent = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorPrimaryBg,
        padding: token.padding,
        borderRadius: token.borderRadius,
      }}
    >
      コンテンツ
    </div>
  );
};
```

## パフォーマンス

### アニメーションの無効化

パフォーマンスが重要な場面でモーションを無効化する：

```tsx
<ConfigProvider theme={{ token: { motion: false } }}>
  <App />
</ConfigProvider>
```

### コンポーネントの遅延ロード

```tsx
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

const MyPage = () => (
  <Suspense fallback={<Spin size="large" />}>
    <HeavyComponent />
  </Suspense>
);
```

### メモ化

高コストな計算とイベントハンドラをメモ化する：

```tsx
const OptimizedTable = ({ data, onRowClick }) => {
  const processedData = useMemo(() => processData(data), [data]);

  const handleRowClick = useCallback(
    (record) => onRowClick(record),
    [onRowClick]
  );

  return <Table dataSource={processedData} />;
};

export default React.memo(OptimizedTable);
```

## SSR / Next.js

### Next.js App Router

サブコンポーネントを使用するファイルに 'use client' を追加する：

```tsx
'use client';

import { Form, Input } from 'antd';

export default function Page() {
  return (
    <Form>
      <Form.Item name="field">
        <Input />
      </Form.Item>
    </Form>
  );
}
```

### Vite 本番モード

ロケールは es ディレクトリからインポートする：

**推奨**:
```tsx
import enUS from 'antd/es/locale/en_US';
```

**非推奨**:
```tsx
import enUS from 'antd/locale/en_US';
```

## セキュリティ

### CSP (Content Security Policy)

動的スタイルを使用する場合は nonce を設定する：

```tsx
<ConfigProvider csp={{ nonce: 'YOUR_NONCE_CODE' }}>
  <App />
</ConfigProvider>
```

## よくある落とし穴

### Props の直接変更

状態を更新する際は新しいオブジェクトを渡す：

**推奨**:
```tsx
setData([...data, newItem]);
setUser({ ...user, name: 'New Name' });
```

**非推奨**:
```tsx
data.push(newItem);
setData(data);
```

### Modal の getPopupContainer

triggerNode が undefined の場合を考慮する：

**推奨**:
```tsx
<ConfigProvider
  getPopupContainer={(node) => {
    if (node) {
      return node.parentNode;
    }
    return document.body;
  }}
>
```

**非推奨**:
```tsx
<ConfigProvider getPopupContainer={(trigger) => trigger.parentNode}>
```

## 型定義の取得

```tsx
import type { GetProps, GetRef, GetProp } from 'antd';
import type { Checkbox, CheckboxProps, Input } from 'antd';

type CheckboxGroupProps = GetProps<typeof Checkbox.Group>;
type CheckboxValue = GetProp<CheckboxProps, 'value'>;
type InputRef = GetRef<typeof Input>;
```

## 参考資料

- [Ant Design 公式ドキュメント](https://ant.design/)
- [Ant Design GitHub](https://github.com/ant-design/ant-design)
- [Ant Design Pro](https://pro.ant.design/)
- [テーマエディタ](https://ant.design/theme-editor)
- [公式 FAQ](https://ant.design/docs/react/faq)
