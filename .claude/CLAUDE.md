# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FileLens - A Chrome extension for viewing and editing various file types (CSV, JSON, TXT) with AI-powered features.

## CSS Architecture

The styling is organized into shared and viewer-specific files:

```
assets/css/
├── shared.css          # Common styles: theme variables, buttons, toasts, header, etc.
├── csv-viewer.css      # CSV/table-specific styles
├── json-viewer.css     # JSON tree view styles
├── txt-viewer.css      # Text/markdown viewer styles
├── file-browser.css    # File browser/directory listing styles
└── viewer.css          # Legacy import file (imports shared + csv-viewer)
```

### Using Shared Styles

For new viewers, import styles in your HTML:
```html
<link rel="stylesheet" href="assets/css/shared.css">
<link rel="stylesheet" href="assets/css/[viewer-type].css">
```

Or use @import in CSS:
```css
@import url('shared.css');
@import url('[viewer-type].css');
```

### Theme System

The theme system uses CSS custom properties. Toggle dark mode by setting `data-theme="dark"` on the body element. Theme preference is stored in localStorage as `csvEditor-theme`.

### Key Components in shared.css

- CSS variables for light/dark themes
- Button styles (`.btn`, `.btn-primary`, `.btn-success`, etc.)
- Toast notifications (`.toast`, `.toast-container`)
- Header layout (`.header`, `.header-left`, `.header-right`)
- Theme toggle (`.theme-toggle`)
- Empty state / drop zone (`.empty-state`, `.drop-zone`)
- Pagination controls (`.pagination-btn`, `.pagination-controls`)
- Form inputs (`.input`)
- Utility classes

## File Structure

```
filelens/
├── manifest.json           # Chrome extension manifest v3
├── viewer.html             # CSV viewer page
├── assets/
│   ├── css/               # Stylesheets (see above)
│   ├── js/
│   │   ├── background.js  # Service worker
│   │   ├── content.js     # Content script for CSV detection
│   │   └── viewer.js      # CSV viewer logic + ToastManager
│   └── images/pngs/       # Extension icons
└── .claude/
    ├── CLAUDE.md          # This file
    └── PRD.md             # Product requirements
```
