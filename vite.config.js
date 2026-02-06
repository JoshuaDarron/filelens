import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist')

      // Ensure dist/assets directories exist
      const dirs = [
        'dist/assets/js',
        'dist/assets/css',
        'dist/assets/images/pngs'
      ]
      dirs.forEach(dir => {
        const fullPath = resolve(__dirname, dir)
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true })
        }
      })

      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      )

      // Copy background.js and content.js
      copyFileSync(
        resolve(__dirname, 'assets/js/background.js'),
        resolve(distDir, 'assets/js/background.js')
      )
      copyFileSync(
        resolve(__dirname, 'assets/js/content.js'),
        resolve(distDir, 'assets/js/content.js')
      )
      copyFileSync(
        resolve(__dirname, 'assets/js/content-directory.js'),
        resolve(distDir, 'assets/js/content-directory.js')
      )

      // Copy CSS files
      const cssFiles = readdirSync(resolve(__dirname, 'assets/css'))
      cssFiles.forEach(file => {
        if (file.endsWith('.css')) {
          copyFileSync(
            resolve(__dirname, 'assets/css', file),
            resolve(distDir, 'assets/css', file)
          )
        }
      })

      // Copy images
      const imagesDir = resolve(__dirname, 'assets/images/pngs')
      if (existsSync(imagesDir)) {
        const images = readdirSync(imagesDir)
        images.forEach(file => {
          copyFileSync(
            resolve(imagesDir, file),
            resolve(distDir, 'assets/images/pngs', file)
          )
        })
      }

      // Update index.html to include CSS links
      const indexPath = resolve(distDir, 'index.html')
      let html = readFileSync(indexPath, 'utf-8')

      // Add CSS imports before </head> if not already present
      const cssImports = `
    <link rel="stylesheet" href="./assets/css/shared.css">
    <link rel="stylesheet" href="./assets/css/csv-viewer.css">
    <link rel="stylesheet" href="./assets/css/json-viewer.css">
    <link rel="stylesheet" href="./assets/css/txt-viewer.css">
    <link rel="stylesheet" href="./assets/css/file-browser.css">`

      if (!html.includes('shared.css')) {
        html = html.replace('</head>', cssImports + '\n</head>')
        writeFileSync(indexPath, html)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name].js',
        assetFileNames: 'assets/[ext]/[name].[ext]'
      }
    }
  }
})
