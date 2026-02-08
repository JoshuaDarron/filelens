# Code Style Reference

## Component Patterns

- **Functional components only** — no class components
- **Named exports** — `export function ComponentName()`, not default exports
- **Hooks for everything** — state, effects, memoization, context

### Hook Usage

| Hook | Usage |
|------|-------|
| `useState` | Local UI state (view mode, pagination, drag state) |
| `useEffect` | Side effects (theme init, URL parsing, file loading on mount) |
| `useCallback` | All event handlers — memoized to prevent child re-renders |
| `useMemo` | Expensive computations (pagination indices, Markdown HTML) |
| `useRef` | DOM access (scroll sync, input refs), persistent values (toast IDs, timeouts) |
| `useContext` | Global state access (file data, theme, toasts) |

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Component files | PascalCase | `Header.jsx`, `CsvViewer.jsx` |
| Utility/hook files | camelCase | `csvParser.js`, `useTheme.js` |
| Components | PascalCase | `EmptyState`, `ToastContainer` |
| Functions/variables | camelCase | `handleOpenFile`, `isModified` |
| Constants | SCREAMING_SNAKE_CASE | `NATIVE_TYPES`, `TEXT_EXTENSIONS` |
| Context | PascalCase + "Context" | `FileContext`, `ThemeContext` |
| Hooks | "use" prefix + camelCase | `useFileLoader`, `usePagination` |
| CSS classes | kebab-case | `.btn-primary`, `.content-wrapper` |

## File Organization

```
src/components/ComponentName/
├── ComponentName.jsx
├── ComponentName.css
└── ComponentName.test.jsx (optional)

src/viewers/ViewerName/
├── ViewerName.jsx
├── SubComponent.jsx (if needed)
└── index.js (exports)

src/context/ContextName.jsx
src/hooks/hookName.js
src/utils/utilName.js
```

Tests are co-located with source files.

## Import Order

1. React imports (`useState`, `useEffect`, etc.)
2. Third-party libraries (`marked`)
3. Context imports (`FileContext`, `ToastContext`)
4. Hook imports (`useToast`, `usePagination`)
5. Component imports (`Header`, `EmptyState`)
6. Utility imports (`csvParser`, `fileHelpers`)
7. CSS imports (`./Component.css`)

## Error Handling

- **Try-catch** around all file I/O, parsing, and async operations
- **Toast feedback** for all user-facing errors: `toast.error(message)`
- **Loading states** via `toast.loading()` → `toast.hide(id)`
- **Graceful fallbacks** for invalid data (e.g., create default CSV structure)
- **Validation functions** return structured objects: `{ valid, type, ...data }`

## Callback Patterns

```jsx
// All handlers wrapped in useCallback
const handleAction = useCallback(async () => {
  if (!fileData) return
  try {
    // operation
    toast.success('Done!')
  } catch (error) {
    toast.error(`Failed: ${error.message}`)
  }
}, [fileData, toast])

// Optional callbacks — check before calling
onClick?.()
```

## State Management

- **Local state**: Component-specific UI (pagination, view mode, drag state)
- **Context state**: Shared across viewers (file data, theme, toasts)
- **localStorage**: Theme (`csvEditor-theme`), view mode (`fileBrowser-viewMode`)
- **URL params**: Current file/directory path and type
- **No state library** — pure React Context + hooks

## General Conventions

- No TypeScript — plain JSX
- No prop-types or runtime type checking
- ESM modules (`"type": "module"` in package.json)
- No ESLint or Prettier config in repo
- Minimal comments — code is self-documenting
- No default exports — always named exports
