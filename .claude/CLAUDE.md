# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FileLens - A Chrome extension for viewing and editing various file types (CSV, JSON, TXT) with AI-powered features.

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
├── file-browser.css    # File browser/directory listing styles
└── viewer.css          # Legacy import file (imports shared + csv-viewer)

src/components/
├── Header/             # Header.jsx + Header.css
├── ThemeToggle/        # ThemeToggle.jsx + ThemeToggle.css
├── Toast/              # Toast.jsx, ToastContainer.jsx + Toast.css
├── Breadcrumb/         # Breadcrumb.jsx + Breadcrumb.css
├── EmptyState/         # EmptyState.jsx + EmptyState.css
├── DropZone/           # DropZone.jsx + DropZone.css
├── Pagination/         # Pagination.jsx + Pagination.css
└── FileInput/          # FileInput.jsx (no CSS — uses global .btn classes)
```

### Theme System

The theme system uses CSS custom properties. Toggle dark mode by setting `data-theme="dark"` on the body element. Theme preference is stored in localStorage as `csvEditor-theme`.

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
├── manifest.json           # Chrome extension manifest v3
├── viewer.html             # CSV viewer page
├── src/
│   ├── App.jsx             # Main app component
│   ├── components/         # Shared UI components (see CSS Architecture)
│   ├── viewers/            # Viewer implementations (CsvViewer, JsonViewer, etc.)
│   ├── context/            # React contexts
│   ├── hooks/              # Custom hooks
│   └── utils/              # Utility functions
├── assets/
│   ├── css/               # Global & viewer-specific stylesheets
│   ├── js/
│   │   ├── background.js  # Service worker
│   │   ├── content.js     # Content script for CSV detection
│   │   └── viewer.js      # CSV viewer logic + ToastManager
│   └── images/pngs/       # Extension icons
└── .claude/
    ├── CLAUDE.md          # This file
    └── PRD.md             # Product requirements
```
