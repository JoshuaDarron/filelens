# Build Command

Build the Chrome extension for production.

---

## Workflow

### 1. Run the Build

```bash
npm run build
```

This runs `vite build`, which:
- Compiles React/JSX via `@vitejs/plugin-react`
- Bundles the app entry point from `index.html`
- Outputs to `dist/` with the following asset structure:
  - `assets/js/` — bundled JS (entry + chunks)
  - `assets/css/` — compiled CSS
- The `copyExtensionAssets` Vite plugin then copies:
  - `manifest.json`
  - `assets/js/background.js`, `content.js`, `content-directory.js`
  - All CSS from `assets/css/`
  - Icons from `assets/images/pngs/`
  - Injects CSS `<link>` tags into `dist/index.html`

### 2. Verify the Output

```bash
ls dist/
ls dist/assets/js/
ls dist/assets/css/
```

Confirm the `dist/` folder contains:
- `index.html`
- `manifest.json`
- `assets/js/` — `main.js`, `background.js`, `content.js`, `content-directory.js`
- `assets/css/` — `shared.css`, `csv-viewer.css`, `json-viewer.css`, `txt-viewer.css`, `file-browser.css`
- `assets/images/pngs/` — extension icons

### 3. Load in Chrome (Manual)

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder

---

## Build Configuration

- **Config file:** `vite.config.js`
- **Output directory:** `dist/`
- **Base path:** `./` (relative, required for Chrome extension)
- **Entry point:** `index.html`

---

## Quick Reference

```bash
# Full build
npm run build

# Preview built output locally
npm run preview
```
