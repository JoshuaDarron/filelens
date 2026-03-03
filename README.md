# FileLens

A Chrome extension for viewing, editing, and analyzing various file types with light/dark mode support. All processing happens on-device for a privacy-first experience.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)
- [Google Chrome](https://www.google.com/chrome/)

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Bundle analysis
npm run analyze
```

### Load into Chrome

1. Run `npm run build`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `dist/` folder
5. Enable **Allow access to file URLs** in the extension's details

## Authors

- **Joshua Phillips** — [Portfolio](https://joshuadarron.com)

## License

This project is licensed under the CC0 1.0 Universal Creative Commons License — see the [LICENSE.md](LICENSE.md) file for details.
