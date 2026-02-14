---
description: 'Vitest のコーディング規約'
applyTo: '**/*.test.ts, **/*.test.tsx, **/vitest.config.ts'
---

# Vitest のコーディング規約

## テストケース命名規則

- 一番外側の describe ブロックには、テスト対象のモジュール名を記述する。
- ネストした describe ブロックには、テスト対象の関数名やメソッド名を記述する。
- テストケースは日本語で作成する。
- it ブロックには、具体的な期待動作内容を記述する。
- it ブロックは `~こと` で終わるように命名する。
- it ブロックに `場合` `時` は含めない。
  - 含める必要がある場合は describe ブロックを作成する。
    - 例: `it("ユーザーが存在しない場合正常に動作すること)` -> `describe("ユーザーが存在しない場合", () => { it("正常に動作すること") })`

## テスト構造

### 基本原則

- it ブロックは Act と Assert に集中させる
- Arrange は it ブロックの外に分離する

### Arrange の分離方法

beforeEach フックと共有変数を使用する:

- テストデータやモック関数は describe スコープで `let` 宣言する
- `beforeEach` フックで初期化する
- 各テストケースで共通の Arrange 処理を再利用できる

**分離パターン**:

```typescript
describe("useGet", () => {
  describe("正常系", () => {
    // 共有変数を宣言
    let mockData: { id: number; name: string };
    let queryFn: () => Promise<{ id: number; name: string }>;

    // Arrange: beforeEach で初期化
    beforeEach(() => {
      mockData = { id: 1, name: "Test User" };
      queryFn = vi.fn().mockResolvedValue(mockData);
    });

    it("データを正常に取得できること", async () => {
      // Act
      const { result } = renderHook(() => useGet("/api/users", queryFn), {
        wrapper: createWrapper(),
      });

      // Assert
      expect(result.current.isLoading).toBe(true);
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data).toEqual(mockData);
    });
  });
});
```

**禁止パターン**:

```typescript
// ❌ 悪い例: it ブロック内に Arrange が混在
it("データを正常に取得できること", async () => {
  // Arrange
  const mockData = { id: 1, name: "Test User" };
  const queryFn = vi.fn().mockResolvedValue(mockData);

  // Act
  const { result } = renderHook(() => useGet("/api/users", queryFn), {
    wrapper: createWrapper(),
  });

  // Assert
  expect(result.current.data).toEqual(mockData);
});
```

### 特定のテストだけ異なるデータが必要な場合:

- beforeEach で設定した変数は it ブロック内で上書き可能
- テストケース固有の値は it ブロック内で再代入する

```typescript
describe("正常系", () => {
  let mockData: { id: number; name: string };
  let queryFn: () => Promise<{ id: number; name: string }>;

  beforeEach(() => {
    mockData = { id: 1, name: "Test User" };
    queryFn = vi.fn().mockResolvedValue(mockData);
  });

  it("特定のIDでデータを取得できること", async () => {
    // このテストだけ異なるデータを使用
    mockData = { id: 999, name: "Special User" };
    queryFn = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useGet("/api/users/999", queryFn), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```
