# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FileLens — A Chrome extension (Manifest V3) for viewing and editing CSV, JSON, TXT, and Markdown files, plus 50+ code/config file types. Built with React 18 + Vite 5.

## Build & Test

```bash
npm run dev      # Vite dev server
npm run build    # Production build → dist/
npm test         # Vitest (run once)
npm run analyze  # Bundle analysis (rollup-plugin-visualizer)
```

After `npm run build`, load `dist/` as an unpacked extension in `chrome://extensions/` with "Allow access to file URLs" enabled.

## CSS Architecture

Styling uses a two-tier approach:

1. **Global styles** in `assets/css/shared.css` — theme variables, buttons, form inputs, content containers, animations, utility classes
2. **Component-scoped styles** co-located with each component (imported via `import './Component.css'` in JSX — Vite bundles them automatically)
3. **Viewer-specific styles** in `assets/css/` for each viewer type

```
assets/css/
├── shared.css          # Global styles: theme variables, buttons, inputs, utilities
├── csv-viewer.css      # CSV/table-specific styles
├── json-viewer.css     # JSON tree view styles
├── txt-viewer.css      # Text/markdown viewer styles
└── file-browser.css    # File browser/directory listing styles

src/components/
├── Navbar/             # Navbar.jsx + Navbar.css (back button + settings gear)
├── OptionsHeader/      # OptionsHeader.jsx + OptionsHeader.css (breadcrumbs + viewer controls portal)
├── ViewContainer/      # ViewContainer.jsx (viewer routing, lazy loading, Suspense)
├── Settings/           # Settings.jsx + Settings.css
├── ThemeToggle/        # ThemeToggle.jsx + ThemeToggle.css
├── Toast/              # Toast.jsx, ToastContainer.jsx + Toast.css
├── Breadcrumb/         # Breadcrumb.jsx + Breadcrumb.css
├── EmptyState/         # EmptyState.jsx + EmptyState.css
├── DropZone/           # DropZone.jsx + DropZone.css
├── Pagination/         # Pagination.jsx + Pagination.css
└── FileInput/          # FileInput.jsx (no CSS — uses global .btn classes)
```

### Component Tree

```
App                         — Static shell, never re-renders
├── ToastContainer          — Overlay
├── Navbar                  — memo(), computes back target once on mount
└── ViewContainer           — Consumes FileRoutingContext (re-renders only on file type change)
    ├── OptionsHeader       — memo(), breadcrumbs + portal controls (hidden for Settings)
    └── Suspense
        └── Active viewer   — CsvViewer | JsonViewer | TxtViewer | FileBrowser | Settings
```

### Context Architecture

```
SettingsProvider             — User preferences (localStorage: filelens-settings)
  ThemeProvider              — Theme state, applies data-theme attribute
    ToastProvider            — Toast notifications
      FileProvider         — Provides both:
        │ FileRoutingContext — fileType + stable routing utils (changes rarely)
        │ FileContext        — Full file data + setters (changes on edits)
          OptionsHeaderProvider  — Breadcrumb config + visibility
            OptionsHeaderPortalProvider — Portal target for viewer controls
              App
```

### Theme System

The theme system uses CSS custom properties. Toggle dark mode by setting `data-theme="dark"` on the body element. `theme-init.js` runs synchronously from `<head>` to prevent FOUC. Theme preference is stored in localStorage under `filelens-settings`.

### Key Styles in shared.css (globals only)

- CSS variables for light/dark themes
- Button styles (`.btn`, `.btn-primary`, `.btn-success`, etc.)
- Form inputs (`.input`)
- Content container (`.content-container`, `.content-controls`, `.content-wrapper`)
- Animations (`@keyframes spin`, `fadeIn`, `slideIn`)
- Utility classes (`.hidden`, `.text-muted`, `.mt-*`, `.mb-*`, `.gap-*`)

## File Structure

```
filelens/
├── index.html              # Main HTML entry point
├── manifest.json           # Chrome extension manifest v3
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build config (code-splitting, asset copying)
├── src/
│   ├── main.jsx            # React entry point, context provider tree
│   ├── App.jsx             # Static shell: ToastContainer + Navbar + ViewContainer
│   ├── setupTests.js       # Vitest configuration
│   ├── components/         # Shared UI components (see CSS Architecture)
│   ├── viewers/
│   │   ├── CsvViewer/      # CsvViewer.jsx + CsvTable.jsx (table rendering)
│   │   ├── JsonViewer/     # JsonViewer.jsx (collapsible tree view)
│   │   ├── TxtViewer/      # TxtViewer.jsx (text + markdown + syntax highlighting)
│   │   └── FileBrowser/    # FileBrowser.jsx (directory browsing)
│   ├── context/
│   │   ├── FileContext.jsx           # File data + file type routing (exports 2 contexts)
│   │   ├── OptionsHeaderContext.jsx  # Breadcrumb config + visibility
│   │   ├── OptionsHeaderPortalContext.jsx # Portal target for viewer controls
│   │   ├── SettingsContext.jsx       # User preferences (theme, lastViewer, viewModes)
│   │   ├── ThemeContext.jsx          # Light/dark mode state
│   │   └── ToastContext.jsx          # Toast notification system
│   ├── hooks/
│   │   ├── useFileLoader.js          # File loading (URL, File object, picker)
│   │   ├── useOptionsHeader.js       # Breadcrumb configuration
│   │   ├── useOptionsHeaderPortal.js # Portal control
│   │   ├── usePagination.js          # CSV pagination logic
│   │   ├── useSettings.js            # Access SettingsContext
│   │   ├── useTheme.js               # Access ThemeContext
│   │   └── useToast.js               # Access ToastContext
│   ├── services/
│   │   └── fileCache.js    # SHA-256 cached file storage (chrome.storage.local)
│   └── utils/
│       ├── csvParser.js    # Delimiter detection + CSV parsing + generation
│       ├── fileHelpers.js  # File ops (save, download, format, MIME types)
│       └── hljs.js         # Highlight.js setup (30+ languages)
├── assets/
│   ├── css/               # Global & viewer-specific stylesheets
│   ├── js/
│   │   ├── background.js       # Service worker (file detection, navigation interception)
│   │   ├── content.js          # Content script (file type from Content-Type header)
│   │   ├── content-directory.js # Content script for directory listing pages
│   │   └── theme-init.js       # Sync theme init to prevent FOUC
│   ├── fonts/
│   │   └── bootstrap-icons/    # Icon font (woff/woff2 + CSS)
│   └── images/pngs/       # Extension icons (16, 48, 128px; light + dark)
└── .claude/
    ├── CLAUDE.md          # This file
    └── PRD.md             # Product requirements
```

## Key Implementation Details

- **File type detection:** NATIVE_TYPES (csv, json, txt, md) → TEXT_EXTENSIONS (50+ code/config extensions map to txt viewer) → fallback txt
- **File size limits:** 10MB per file (useFileLoader), 5MB per cached entry, max 20 cached entries
- **Storage:** Settings in localStorage (`filelens-settings`), file cache in `chrome.storage.local` with SHA-256 validation
- **Lazy loading:** All viewers use `React.lazy()` with Suspense fallback
- **Code splitting:** vendor-react, vendor-hljs, vendor-markdown chunks (vite.config.js)
- **Browser APIs:** File System Access API, Web Crypto API (SHA-256), Chrome Storage/Runtime/WebNavigation APIs
