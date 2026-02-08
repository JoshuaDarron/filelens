# Frontend Reference

## Component Hierarchy

```
App
├── ToastContainer
│   └── Toast (multiple)
└── [Active Viewer]
    ├── Header
    │   ├── Breadcrumb
    │   └── ThemeToggle
    ├── EmptyState (when no file loaded)
    │   └── DropZone
    │       └── FileInput
    └── [Viewer Content]
        └── Pagination (CsvViewer only)
```

## Shared Components

### Header (`src/components/Header/Header.jsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSave` | function | — | Save handler |
| `onExport` | function | — | Export handler |
| `showSave` | boolean | `false` | Show save button |
| `showExport` | boolean | `false` | Show export button |
| `stats` | object \| null | — | Stats display (`{ rows, cols, lines, size }`) |
| `children` | ReactNode | — | Extra controls (view toggles, buttons) |

Features: logo link to FileBrowser, back button (parent directory), stats with icons, save button (only when `fileHandle` exists), export button, ThemeToggle, Breadcrumb.

### EmptyState (`src/components/EmptyState/EmptyState.jsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | `'bi-file-earmark-spreadsheet'` | Bootstrap icon class |
| `title` | string | `'FileLens'` | Heading |
| `description` | string | — | Description text |
| `onFileDrop` | function | — | Drop handler |
| `onOpenFile` | function | — | File picker handler |
| `acceptedExtensions` | array | `['.csv', '.txt', '.json', '.md']` | Allowed extensions |
| `dropZoneText` | string | `'Drop your file here'` | Drop zone label |
| `dropZoneSubtext` | string | `'or click to browse files'` | Drop zone sublabel |
| `dropZoneButtonText` | string | `'Choose File'` | Button text |
| `showCoffeeLink` | boolean | `true` | Show support link |

### Toast (`src/components/Toast/Toast.jsx`)

| Prop | Type | Description |
|------|------|-------------|
| `toast` | object | `{ id, type, title, message, duration, showProgress, closable, isHiding, createdAt }` |
| `onClose` | function | Close handler |

Types: `success` (check-circle), `error` (exclamation-triangle), `loading` (spinner), `info` (info-circle). Progress bar animates over `duration` ms.

### DropZone (`src/components/DropZone/DropZone.jsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFileDrop` | function | — | Called with `(file, handle)` |
| `onClick` | function | — | Click handler |
| `acceptedExtensions` | array | `['.csv', '.txt', '.json', '.md']` | Valid extensions |
| `children` | ReactNode | — | Custom drop zone content |

### Breadcrumb (`src/components/Breadcrumb/Breadcrumb.jsx`)

| Prop | Type | Description |
|------|------|-------------|
| `items` | array | `[{ name, url }]` |
| `onNavigate` | function | Click handler for items without URL |

### Pagination (`src/components/Pagination/Pagination.jsx`)

Receives all values from `usePagination` hook: `currentPage`, `totalPages`, `rowsPerPage`, `totalItems`, `startIndex`, `endIndex`, `onPageChange`, `onRowsPerPageChange`, `pageNumbers`, `isFirstPage`, `isLastPage`, `rowsPerPageOptions` (default `[25, 50, 100, 500]`).

### ThemeToggle (`src/components/ThemeToggle/ThemeToggle.jsx`)

No props. Uses `useTheme` hook internally. Renders moon/sun icons; CSS controls visibility.

### FileInput (`src/components/FileInput/FileInput.jsx`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFileSelect` | function | — | Called with selected file |
| `accept` | string | `'.csv,.txt,.json,.md'` | File input accept |
| `children` | ReactNode | — | Button content |
| `className` | string | `'btn btn-primary'` | Button class |

## Contexts

### FileContext

**State:**
- `fileData` — Parsed data (CSV: 2D array, JSON: object/array, TXT: string)
- `originalData` — Deep clone for modification tracking
- `filename` — Current file name
- `fileType` — `'csv'` | `'json'` | `'txt'` | `'md'` | `null`
- `isModified` — Whether data differs from original
- `fileHandle` — `FileSystemFileHandle` | `null`
- `fileUrl` — Source URL | `null`

**Methods:**
- `loadFile(data, name, type, handle, url)` — Load new file
- `updateData(newData)` — Update data, set modified
- `markSaved()` — Sync original to current, clear modified
- `resetFile()` — Clear all state
- `detectFileType(filename)` — Extension → type mapping

### ToastContext

**Methods:**
- `success(message, title?, options?)` — Green, 5s auto-dismiss
- `error(message, title?, options?)` — Red, 7s auto-dismiss
- `loading(message, title?, options?)` — Spinner, no auto-dismiss (returns ID)
- `info(message, title?, options?)` — Blue, 5s auto-dismiss
- `hide(id)` — Dismiss specific toast (300ms fade-out)
- `update(id, options)` — Replace toast
- `clear()` — Dismiss all

### ThemeContext

**State:** `theme` (`'light'` | `'dark'`), `isDark` (computed boolean)
**Methods:** `toggleTheme()`, `setTheme(theme)`
**Side effects:** Sets `data-theme` on `<html>`, saves to localStorage, adds `.theme-ready` class after mount.

## Custom Hooks

### `usePagination(totalItems, initialRowsPerPage = 25)`

Returns: `currentPage`, `rowsPerPage`, `totalPages`, `startIndex`, `endIndex`, `isFirstPage`, `isLastPage`, `goToPage(n)`, `goToFirst()`, `goToLast()`, `goToPrev()`, `goToNext()`, `changeRowsPerPage(n)`, `resetPagination()`, `getPageNumbers()`.

### `useFileLoader()`

Returns: `loadFromURL(url)`, `loadFromFile(file, handle)`, `openFilePicker(acceptTypes)`, `isValidFile(file, extensions)`, `getFilenameFromURL(url)`.

File size limit: 10MB. Shows loading/error toasts automatically. Defines `TEXT_FILE_EXTENSIONS` (50+ extensions) for text viewer routing.

### `useTheme()` / `useToast()`

Simple context accessors. Throw if used outside their respective providers.

## Utility Functions

### `csvParser.js`
- `parseCSV(text)` — Auto-detect delimiter, handle quoted fields, return 2D array
- `generateCSVContent(data)` — 2D array → CSV string
- `createDefaultCSV()` — Returns 3-column, 1-row default
- `validateCSVData(data)` — Returns `{ valid, type, headers }`

### `fileHelpers.js`
- `formatFileSize(bytes)` — Human-readable size string
- `getFileExtension(filename)` — Lowercase extension
- `getFileType(filename)` — Extension → viewer type
- `getMimeType(fileType)` — MIME type string
- `saveFile(fileHandle, content)` — Write via File System Access API
- `downloadFile(content, filename, mimeType)` — Blob download

## CSS Architecture

### Theme System

CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Key variables:

```css
--bg-primary        --text-primary       --button-primary
--bg-secondary      --text-secondary     --button-success
--bg-accent         --text-muted         --button-danger
--border-color      --header-bg          --button-secondary
--border-hover      --row-hover          --input-bg
--shadow            --input-border
```

### Class Reference

**Buttons:** `.btn`, `.btn-primary`, `.btn-success`, `.btn-secondary`, `.btn-danger`, `.btn-outline`, `.btn:disabled`

**Forms:** `.input` (padding, border, focus ring)

**Layout:** `.content-container`, `.content-controls`, `.content-wrapper` (max-height: `calc(100vh - 121px)`)

**Animations:** `spin` (rotation), `fadeIn` (opacity), `slideIn` (translateY + opacity)

**Utilities:** `.hidden`, `.text-muted`, `.text-secondary`, `.mt-1`–`.mt-4`, `.mb-1`–`.mb-4`, `.gap-1`–`.gap-4`

### Style Locations

| Scope | Location |
|-------|----------|
| Global theme, buttons, inputs, utilities | `assets/css/shared.css` |
| CSV table styles | `assets/css/csv-viewer.css` |
| JSON tree styles | `assets/css/json-viewer.css` |
| Text/markdown styles | `assets/css/txt-viewer.css` |
| File browser styles | `assets/css/file-browser.css` |
| Component-scoped styles | `src/components/*/Component.css` |
