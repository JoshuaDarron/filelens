# Architecture Reference

## Overview

FileLens is a Chrome extension (Manifest V3) built with React 18 and Vite. It intercepts file URLs in the browser and renders them in specialized viewers.

## Entry Points

| Entry | Purpose |
|-------|---------|
| `index.html` | Root HTML. Inline script applies saved theme before first paint to prevent flash. |
| `src/main.jsx` | React entry. Wraps `<App>` in providers: `ThemeProvider` > `ToastProvider` > `FileProvider`. |
| `assets/js/background.js` | Service worker. Intercepts `file://` navigations via `webNavigation.onBeforeNavigate`, redirects to viewer. |
| `assets/js/content.js` | Content script (`document_start`). Detects file type from extension/MIME and redirects to viewer. |
| `assets/js/content-directory.js` | Content script (`document_end`). Handles `file://` directory listings. |

## Viewer Routing

`App.jsx` selects the active viewer based on URL query params:

```
index.html?url=<encoded-file-url>&type=<viewer-type>
```

Resolution order:
1. `type=directory` → FileBrowser
2. Explicit `type` param (`csv`, `json`, `txt`, `md`, `browser`) → that viewer
3. `url` param present → detect type from file extension via `detectFileType()`
4. No params → FileBrowser

State variable `activeViewer` drives which viewer renders. Updates when `fileType` context changes.

## Viewers

### CsvViewer (`src/viewers/CsvViewer/`)
- Parses CSV with auto-delimiter detection (`,` `\t` `;` `|`)
- Inline cell editing, row/column add/delete, paste support
- Pagination via `usePagination` hook (default 25 rows/page)
- Save to file handle or export as download

### JsonViewer (`src/viewers/JsonViewer/`)
- Recursive `JsonNode` component for tree rendering
- Collapsible nodes (auto-collapsed after level 2)
- View modes: `tree` (interactive) or `raw` (formatted)
- Type-based syntax highlighting (string, number, boolean, null)
- Copy to clipboard

### TxtViewer (`src/viewers/TxtViewer/`)
- Markdown rendering via `marked` library (GFM + breaks)
- `.md` files: `edit`, `split`, `preview` modes
- `.txt` files: `raw` mode (plain text editor)
- Split mode: resizable divider (20-80%), synchronized scrolling
- Word wrap toggle, save support

### FileBrowser (`src/viewers/FileBrowser/`)
- Two modes: URL-based (`file://` directory parsing) or File System Access API (`showDirectoryPicker`)
- List/grid view (persisted to localStorage)
- Search, sort (name/size/modified), breadcrumb navigation
- File type detection with icon mapping

## Chrome Extension Flow

```
User opens file URL
    ↓
background.js intercepts webNavigation.onBeforeNavigate (file:// scheme)
    ↓
getFileType() maps extension to viewer type
    ↓
Redirects to: chrome-extension://<id>/index.html?url=<encoded>&type=<type>
    ↓
App.jsx reads params → sets activeViewer → renders viewer
    ↓
Viewer loads file content (XHR for file://, fetch for http)
    ↓
FileContext stores parsed data + metadata
```

## Data Flow

### File Loading
1. User drops/selects file OR content script intercepts URL
2. `useFileLoader` hook handles reading (File API, XHR, or fetch)
3. Viewer-specific parser processes text
4. `FileContext.loadFile()` stores data + metadata

### Editing
1. User edits in viewer
2. `FileContext.updateData()` stores changes, sets `isModified: true`
3. Changes are in-memory only until save

### Saving
1. If `fileHandle` exists → `fileHelpers.saveFile()` writes via File System Access API
2. `FileContext.markSaved()` syncs `originalData`, clears `isModified`
3. No file handle → export triggers download

## Context Providers

```
ThemeProvider          — theme state, toggle, localStorage sync
  └── ToastProvider    — toast notifications, auto-dismiss timers
       └── FileProvider — file data, metadata, modification tracking
```

## Background Script Details

- `NATIVE_TYPES`: csv, json, txt, md (get dedicated viewers)
- `TEXT_EXTENSIONS`: 50+ extensions (py, js, ts, yaml, sh, etc.) → routed to TxtViewer
- Extension icon click → opens FileLens in new tab
- Separate listener for directory URLs (ending with `/`)
