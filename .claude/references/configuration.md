# Configuration Reference

## Package Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server (default `localhost:5173`) |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Serve production build locally |
| `test` | `vitest run` | Run tests once and exit |

## Dependencies

### Runtime
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI framework |
| `react-dom` | ^18.2.0 | DOM rendering |
| `marked` | ^17.0.1 | Markdown to HTML conversion |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^5.0.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^4.2.0 | React HMR and JSX transform |
| `vitest` | ^4.0.18 | Test runner |
| `jsdom` | ^28.0.0 | DOM environment for tests |
| `@testing-library/react` | ^16.3.2 | React component testing |
| `@testing-library/jest-dom` | ^6.9.1 | DOM assertion matchers |

## Vite Configuration (`vite.config.js`)

```javascript
{
  plugins: [react(), copyExtensionAssets()],
  base: './',                      // Relative paths (required for Chrome extension)
  test: {
    globals: true,                 // describe/it/expect without imports
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html') },
      output: {
        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name].js',
        assetFileNames: 'assets/[ext]/[name].[ext]'
      }
    }
  }
}
```

### `copyExtensionAssets` Plugin

Custom Vite plugin that runs on `writeBundle`. Copies to `dist/`:
- `manifest.json`
- `assets/js/background.js`, `content.js`, `content-directory.js`
- All `assets/css/*.css` files
- All `assets/images/pngs/*` icons
- Injects CSS `<link>` tags into `dist/index.html`

## Test Configuration

- **Framework**: Vitest 4.x
- **Environment**: jsdom
- **Setup**: `src/setupTests.js` → imports `@testing-library/jest-dom/vitest`
- **Globals**: enabled (no need to import `describe`, `it`, `expect`)
- **Config location**: `test` block in `vite.config.js`
- **Pattern**: `src/**/*.test.{js,jsx}`

## Chrome Extension Manifest (`manifest.json`)

```
Manifest Version: 3
Extension Name:   FileLens
Version:          2.0.0

Permissions:      activeTab, webNavigation
Host Permissions: file:///*

Background:       assets/js/background.js (service worker)

Content Scripts:
  1. content.js        — document_start, all_frames
     Matches: *.csv, *.json, *.txt, *.md (web + file URLs)
  2. content-directory.js — document_end, main frame only
     Matches: file:///*

Web Accessible:   index.html, assets/js/*, assets/css/*, assets/images/pngs/*
Icons:            16/48/128px PNGs
```

## .gitignore

```
*.zip
node_modules/
dist/
.idea/
.vscode/
*.swp
*.swo
.claude/settings.local.json
.DS_Store
Thumbs.db
*.log
npm-debug.log*
```

## External Resources (loaded via CDN in index.html)

- **Bootstrap Icons**: `bootstrap-icons@1.11.3/font/bootstrap-icons.css`

## localStorage Keys

| Key | Values | Purpose |
|-----|--------|---------|
| `csvEditor-theme` | `'light'` \| `'dark'` | Theme preference |
| `fileBrowser-viewMode` | `'list'` \| `'grid'` | File browser layout |
