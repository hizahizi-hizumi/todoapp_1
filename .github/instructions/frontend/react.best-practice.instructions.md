---
description: 'React component development best practices'
applyTo: '**/*.{jsx,tsx,js,ts}'
---

# React Component Development Best Practices

## Project Context

- React 18+ application development
- When using React Compiler in React 19+, minimize manual memoization

## Core Principles

- Implement components as pure functions (same input → same output)
- Do not execute side effects during rendering
- Do not directly mutate Props and State
- Use Effects as a last resort
- Call Hooks only at the top level
- Mutating variables created during rendering is acceptable

## Component Design

### Maintaining Purity

- Do not mutate external variables
- Generate output depending only on Props
- Always return the same result for the same props/state/context

**❌ Bad Example**:
```jsx
let guest = 0;

function Cup() {
  guest = guest + 1;  // Side effect
  return <h2>Tea cup for guest #{guest}</h2>;
}
```

**✅ Good Example - Depend only on props**:
```jsx
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
```

### Avoiding Side Effects During Rendering

- Do not perform DOM manipulation, API calls, or timer setup during rendering
- Obtain necessary values through calculation during rendering

**✅ Good Example**:
```jsx
function Clock({ time }) {
  const hours = time.getHours();
  const className = (hours >= 0 && hours <= 6) ? 'night' : 'day';
  return <h1 className={className}>{time.toLocaleTimeString()}</h1>;
}
```

## State Management

### State Placement Principles

- Place State close to the components that use it
- Prevent unnecessary re-renders
- Group State that always updates together
- Do not use State for values that can be calculated from Props or other State
- Do not duplicate the same data across multiple State variables

**✅ Good State Structure Example**:
```jsx
const [position, setPosition] = useState({ x: 0, y: 0 });
const [status, setStatus] = useState('typing'); // 'typing' | 'sending' | 'sent'
const [selectedId, setSelectedId] = useState(0); // Store only ID

function handlePointerMove(e) {
  setPosition({ x: e.clientX, y: e.clientY });
}
```

### State Update Patterns

```jsx
// Object updates
setPosition({ ...position, x: 100 });
setPerson({ ...person, artwork: { ...person.artwork, city: 'New Delhi' }});

// Array updates
setItems([...items, newItem]); // Add
setItems(items.filter(item => item.id !== id)); // Remove
setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item)); // Update
```

### Resetting State on Props Change

- Use `key` to reset State in response to Props changes
- Effects are not necessary

**✅ Good Example**:
```jsx
function ProfilePage({ userId }) {
  return <Profile userId={userId} key={userId} />;
}

function Profile({ userId }) {
  const [comment, setComment] = useState('');  // Automatically reset
}
```

## Effect Usage Guidelines

### Cases Where Effects Are Not Needed

#### Data Transformation for Rendering

- Obtain through calculation during rendering
- Do not update State in Effects

**✅ Good Example**:
```jsx
function TodoList({ todos, filter }) {
  const visibleTodos = getFilteredTodos(todos, filter);
  return <ul>{/* ... */}</ul>;
}
```

#### User Event Handling

- Handle directly in event handlers
- Do not execute side effects in Effects

**✅ Good Example**:
```jsx
function ProductPage({ product, addToCart }) {
  function buyProduct() {
    addToCart(product);
    showNotification(`Added ${product.name} to cart!`);
  }
  return <button onClick={buyProduct}>Buy</button>;
}
```

#### Notifying Parent Components

- Execute State updates and notifications simultaneously in event handlers

**✅ Good Example**:
```jsx
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);
  function updateToggle(nextIsOn) {
    setIsOn(nextIsOn);
    onChange(nextIsOn);
  }
}
```

### Avoiding Effect Chains

- Do not chain State updates across multiple Effects
- Perform batch updates in event handlers

**❌ Bad Example**:
```jsx
// Chaining State updates across multiple Effects
useEffect(() => { if (card?.gold) setGoldCardCount(c => c + 1); }, [card]);
useEffect(() => { if (goldCardCount > 3) { setRound(r => r + 1); setGoldCardCount(0); }}, [goldCardCount]);
```

**✅ Good Example**:
```jsx
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);

  function handlePlaceCard(nextCard) {
    setCard(nextCard);
    if (nextCard.gold) {
      if (goldCardCount < 3) {
        setGoldCardCount(goldCardCount + 1);
      } else {
        setGoldCardCount(0);
        setRound(round + 1);
      }
    }
  }
}
```

### External Store Subscriptions

- Use `useSyncExternalStore` for external data stores

```jsx
function useOnlineStatus() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true
  );
}
```

## Performance Optimization

### Memoization Strategy

- `useMemo`: Cache expensive calculations (1ms or more)
- `memo`: Skip re-rendering when Props are unchanged
- `useCallback`: Memoize function props passed to memoized child components
- When using React Compiler (React 19+), minimize manual memoization

```jsx
// useMemo
const visibleTodos = useMemo(() => filterTodos(todos, filter), [todos, filter]);

// memo
const TodoList = memo(function TodoList({ todos }) {
  return <ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>;
});

// useCallback
const handleSubmit = useCallback((orderDetails) => {
  post('/product/' + productId + '/buy', { referrer, orderDetails });
}, [productId, referrer]);
```

### Concurrent Features

- `useTransition`: Execute heavy processing while maintaining UI responsiveness
- `useDeferredValue`: Defer value updates

```jsx
// useTransition
const [isPending, startTransition] = useTransition();
function handleChange(e) {
  setSearchTerm(e.target.value);  // Urgent
  startTransition(() => setResults(searchData(e.target.value)));  // Non-urgent
}

// useDeferredValue
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => searchData(deferredQuery), [deferredQuery]);
```

### Other Optimizations

- Code splitting: Reduce initial bundle size with `React.lazy` and `Suspense`
- List virtualization: Use react-window or TanStack Virtual for 1000+ items
- Measurement: Always measure before optimizing using React DevTools Profiler, Chrome DevTools, and Web Vitals

```jsx
// Code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
<Suspense fallback={<LoadingSpinner />}><HeavyComponent /></Suspense>
```

## Code Structure and Patterns

### Custom Hook Utilization

- Create custom Hooks to reuse logic

```jsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const updateState = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);
    return () => {
      window.removeEventListener('online', updateState);
      window.removeEventListener('offline', updateState);
    };
  }, []);
  return isOnline;
}
```

### Reducer and Context

- Combine useReducer + Context for complex State management

```jsx
const TasksContext = createContext(null);
const TasksDispatchContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  return (
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}

export const useTasks = () => useContext(TasksContext);
export const useTasksDispatch = () => useContext(TasksDispatchContext);
```

### Export Patterns

- Prefer named exports
- One component per file for large components

## React Rules

### Rule 1: Components and Hooks Must Be Pure

- Same output for same input (idempotent)
- Execute side effects outside of rendering
- Props and State are read-only

### Rule 2: React Calls Components

Do not call component functions directly. Use them as JSX.

**❌ Bad Example**:
```jsx
return <div>{MyComponent()}</div>;
```

**✅ Good Example**:
```jsx
return <div><MyComponent /></div>;
```

## React Rules

- Components and Hooks are pure (same input → same output, side effects outside rendering)
- React calls components: use `<MyComponent />` instead of `{MyComponent()}`
- Hooks only at top level: do not call in conditionals or loops
- Hooks only in React functions: only within components or custom Hooks

## State Management Libraries

| Scenario | Recommendation |
|----------|---------------|
| Small scale | `useState` / `useReducer` |
| Cross-component sharing | Context API / Jotai |
| Global State | Zustand / Redux |
| Server data | TanStack Query |

- React's built-in State management is often sufficient
- Use external libraries only when necessary

## Validation

```bash
npx tsc --noEmit  # Type checking
npx eslint src/  # Linting
npm run build    # Build
```

## Reference Resources

- [React Official Documentation](https://react.dev)
- [Rules of React](https://react.dev/reference/rules)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
