---
description: 'Best practice rules for writing safe and maintainable TypeScript code'
applyTo: '**/*.ts, **/*.tsx'
---

# TypeScript Best Practices

## Purpose and Scope

Guidelines for ensuring type safety, maintainability, and changeability when generating or modifying TypeScript code

## Core Principles

- Explicitly specify types for public APIs (exported functions, classes, and types)
- Do not expose implementation details as types
- Leverage type inference and avoid redundant type annotations on local variables
- Prioritize readability over type complexity

## Type Safety

### Avoid `any`

- Do not use `any`
- Treat uncertain values (external input, JSON, environment variables) as `unknown`
- Handle them safely using narrowing

**Rationale**: `any` disables type checking and increases the risk of runtime errors

```ts
// Recommended
function parseJson(text: string): unknown {
  return JSON.parse(text)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const value = parseJson('{"x": 1}')
if (isRecord(value) && typeof value.x === 'number') {
  console.log(value.x)
}
```

```ts
// Not Recommended
function parseJson(text: string): any {
  return JSON.parse(text)
}
```

### Use Union Types and Narrowing as Default

- Use discriminated unions for data with conditional branches
- Check exhaustiveness of branches using `switch` and `never`

**Rationale**: The compiler detects unhandled cases and prevents gaps during refactoring

```ts
// Recommended
type Result =
  | { kind: 'ok'; value: string }
  | { kind: 'err'; message: string }

export function unwrap(result: Result): string {
  switch (result.kind) {
    case 'ok':
      return result.value
    case 'err':
      throw new Error(result.message)
    default: {
      const _exhaustive: never = result
      return _exhaustive
    }
  }
}
```

### Minimize Generics

- Do not add too many type parameters
- If a union or concrete type can represent it, do not introduce generics
- When necessary, add constraints using `extends`

**Rationale**: Excessive generics increase the cost of understanding and maintenance

```ts
// Recommended
export function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}
```

### Prefer Utility Types

- Use standard utility types (`Partial` / `Required` / `Readonly` / `Pick` / `Omit` / `Record`)
- Separate types for different purposes (create, update, save); do not make the entire type `Partial`

**Rationale**: Standard types are widely recognized and convey intent clearly

```ts
// Recommended
type User = { id: string; name: string; email: string }
type UserPatch = Partial<Pick<User, 'name' | 'email'>>
```

### Module Boundaries and `import type`

- Use `import type` for type-only imports
- Do not increase runtime dependencies

**Rationale**: Prevents circular dependencies and reduces bundle size

```ts
// Recommended
import type { User } from './types'

export function greet(user: User): string {
  return `Hello, ${user.name}`
}
```

### Leverage Type Guards

- Use custom type guards (`is`) to explicitly narrow types
- Prefer built-in guards like `Array.isArray()` or `typeof`

**Rationale**: Maintains type safety while clarifying conditional branches

```ts
// Recommended
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function processInput(input: unknown): string {
  if (isString(input)) {
    return input.trim()
  }
  throw new Error('Expected string')
}
```

```ts
// Not Recommended
function processInput(input: unknown): string {
  return (input as string).trim()
}
```

### Do Not Overuse Type Assertions (`as`) and Non-null Assertions (`!`)

- Treat `as` as a last resort
- Replace with type guards whenever possible
- Avoid `x!` for external input, environment variables, or I/O

**Rationale**: Assertions bypass type checking and cause runtime errors

```ts
// Recommended
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  throw new Error('Expected string')
}

// Not Recommended
function processValue(value: unknown): string {
  return (value as string).toUpperCase()
}
```

## TypeScript Configuration

### Recommended `tsconfig.json` Settings

- Enable `strict: true` (gradual migration is acceptable)
- Use `useUnknownInCatchVariables: true` to keep exception handling safe
- Use `noUncheckedIndexedAccess: true` to prevent missed index accesses
- Use `noUnusedLocals` / `noUnusedParameters` to remove unnecessary code early

**Rationale**: Strict type checking detects bugs early and reduces maintenance costs

```json
{
  "compilerOptions": {
    "strict": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### ESLint / typescript-eslint

- Complement issues that `tsc` cannot catch with ESLint
- Base on `typescript-eslint` shared configs
  - Without type information: `recommended` / `stylistic`
  - With type information: `recommended-type-checked` / `stylistic-type-checked`

**Cautions**:
- `@typescript-eslint/consistent-type-imports` and TypeScript's `verbatimModuleSyntax` may conflict, so standardize on one
- When using legacy decorators (`experimentalDecorators` and `emitDecoratorMetadata`), check the caveats for `consistent-type-imports`

## Validation Commands

### Type Checking

```bash
tsc --noEmit
```

### Configuration Check

```bash
tsc --showConfig
```

### Lint (if integrated)

```bash
eslint .
```

## Error Handling

### Type-Safe Exception Handling

- Handle `unknown` type in `catch` clauses (`useUnknownInCatchVariables: true`)
- Determine error type before processing

**Rationale**: JavaScript allows throwing any value, so handle without assuming types

```ts
// Recommended
try {
  await fetchData()
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Unknown error occurred')
  }
}
```

```ts
// Not Recommended
try {
  await fetchData()
} catch (error) {
  console.error(error.message) // error is 'any'
}
```

### Leverage Result Type Pattern

- Express success and failure using Result type instead of exceptions
- Force explicit error handling on the caller side

**Rationale**: Detects missing error handling at compile time

```ts
// Recommended
type Result<T, E> =
  | { success: true; value: T }
  | { success: false; error: E }

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: 'Division by zero' }
  }
  return { success: true, value: a / b }
}

const result = divide(10, 2)
if (result.success) {
  console.log(result.value)
} else {
  console.error(result.error)
}
```

## Naming Conventions

### General Naming Patterns

- Variables and functions: `camelCase`
- Types, interfaces, and classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` or `camelCase`
- Private properties: `#privateField` or `_privateField`

**Rationale**: Consistent naming conventions improve code readability

```ts
// Recommended
const MAX_RETRY_COUNT = 3
type UserProfile = { id: string; name: string }

class DatabaseConnection {
  #connectionString: string
  
  constructor(connectionString: string) {
    this.#connectionString = connectionString
  }
}

function fetchUserData(userId: string): Promise<UserProfile> {
  // ...
}
```

### Type Name Prefixes and Suffixes

- Do not prefix interfaces with `I` (`IUser` → `User`)
- Type names should be concrete and descriptive
- Add `Props` suffix to Props types (for React)

```ts
// Recommended
interface User {
  id: string
  name: string
}

type ButtonProps = {
  label: string
  onClick: () => void
}
```

```ts
// Not Recommended
interface IUser {
  id: string
  name: string
}
```

## Performance Optimization

### Type Computation Performance

- Minimize use of `infer` and recursive types
- Replace with concrete types when type computation cost is high

**Rationale**: Complex types increase compilation time

```ts
// Recommended: Simple type definition
type ApiResponse = {
  data: unknown
  status: number
  headers: Record<string, string>
}

// Not Recommended: Overly complex type
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T
```

### Leverage `const` Assertions

- Use `as const` to preserve literal types
- Express immutability of objects and arrays

**Rationale**: Provides more specific type inference and prevents unintended changes

```ts
// Recommended
const COLORS = ['red', 'green', 'blue'] as const
type Color = typeof COLORS[number] // 'red' | 'green' | 'blue'

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
} as const
```

```ts
// Not Recommended
const COLORS = ['red', 'green', 'blue'] // string[]
```

## References

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- TSConfig Reference: https://www.typescriptlang.org/tsconfig/
- TSConfig `noUncheckedIndexedAccess`: https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html
- typescript-eslint Shared Configs: https://typescript-eslint.io/users/configs/
- typescript-eslint `consistent-type-imports`: https://typescript-eslint.io/rules/consistent-type-imports/
- Changes to consistent-type-imports with decorators: https://typescript-eslint.io/blog/changes-to-consistent-type-imports-with-decorators/
