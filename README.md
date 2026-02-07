# FileLens
A Chrome extension for viewing, editing, and analyzing various file types (CSV, JSON, TXT, Markdown) with light/dark mode support. All processing happens on-device for a privacy-first experience.

## Summary
- [Getting Started](#getting-started)
- [Authors](#authors)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Getting Started
These instructions will get you a copy of FileLens up and running on your local machine for development and testing purposes.

### Prerequisites
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [npm](https://www.npmjs.com/) - Node package manager
- [Google Chrome](https://www.google.com/chrome/) - Browser to run the extension

### Environment Setup

**Step 1:** Navigate to the project directory
```bash
cd ./filelens
```

**Step 2:** Install packages
```bash
npm install
```

**Step 3:** Start the development server
```bash
npm run dev
```

**Step 4:** Build the extension
```bash
npm run build
```

**Step 5:** Load the extension into Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked** and select the `dist/` folder
4. Enable **Allow access to file URLs** in the extension's details

### Other Setups
- [Client](https://github.com/joshuadarron) - Setup

## Authors
- **Joshua Phillips** - [Portfolio](https://joshuadarron.com)

## License
This project is licensed under the CC0 1.0 Universal Creative Commons License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
- Hat tip to anyone whose code was used
