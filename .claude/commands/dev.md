# Dev Command

Start the Vite development server for local development.

---

## Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Dev Server

```bash
npm run dev
```

This runs `vite`, which starts a local dev server with:
- Hot Module Replacement (HMR) for instant updates
- React Fast Refresh via `@vitejs/plugin-react`
- The app is served at `http://localhost:5173` (default Vite port)

### 3. Open in Browser

Open the URL printed in the terminal. The app runs as a standalone web page in dev mode — Chrome extension APIs (like `chrome.runtime`) are not available.

To test as a Chrome extension, use `npm run build` and load the `dist/` folder instead.

---

## Key Details

- **Config:** `vite.config.js`
- **Entry point:** `index.html` (root of project)
- **React version:** 18.2
- **CSS:** Global styles in `assets/css/`, component styles co-located in `src/components/`
- **Theme:** Toggle via `data-theme="dark"` on `<body>`, stored in localStorage as `csvEditor-theme`

---

## Project Structure

```
src/
├── App.jsx             # Main app component, routing by file type
├── components/         # Shared UI (Header, Toast, Breadcrumb, etc.)
├── viewers/            # CsvViewer, JsonViewer, TxtViewer, FileBrowser
├── context/            # FileContext, ThemeContext, ToastContext
├── hooks/              # useFileLoader, usePagination, useToast
└── utils/              # csvParser, fileHelpers
```

---

## Quick Reference

```bash
# Install deps
npm install

# Start dev server
npm run dev

# Preview production build locally
npm run preview
```
