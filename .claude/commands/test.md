# Test Command

Run the test suite.

---

## Workflow

### 1. Run All Tests

```bash
npm test
```

This runs `vitest run`, which executes all test files in a single pass and exits.

### 2. Review Results

Check that all tests pass. If any fail:
- Read the failure output to identify the failing test and assertion
- Fix the issue in the source or test file
- Re-run `npm test` to confirm the fix

---

## Test Configuration

- **Framework:** Vitest 4.x
- **Environment:** jsdom
- **Setup file:** `src/setupTests.js` (imports `@testing-library/jest-dom/vitest`)
- **Config location:** `test` block in `vite.config.js`
- **Globals:** enabled (`describe`, `it`, `expect` available without imports)

## Test Libraries

- `vitest` — test runner and assertions
- `@testing-library/react` — React component rendering and queries
- `@testing-library/jest-dom` — DOM-specific matchers (e.g., `toBeInTheDocument`)

## Test Files

Tests are co-located with their source files:

```
src/
├── utils/
│   ├── csvParser.test.js       # CSV parsing logic
│   └── fileHelpers.test.js     # File utility functions
├── hooks/
│   └── usePagination.test.js   # Pagination hook
└── context/
    ├── FileContext.test.jsx    # File context provider
    ├── ThemeContext.test.jsx   # Theme context provider
    └── ToastContext.test.jsx   # Toast context provider
```

## Running Specific Tests

```bash
# Run a specific test file
npx vitest run src/utils/csvParser.test.js

# Run tests matching a pattern
npx vitest run --reporter=verbose src/context/

# Watch mode (re-runs on file changes)
npx vitest
```

---

## Quick Reference

```bash
# Run all tests (single pass)
npm test

# Run in watch mode
npx vitest

# Run specific file
npx vitest run src/utils/fileHelpers.test.js
```
