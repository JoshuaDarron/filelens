import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

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
      copyFileSync(
        resolve(__dirname, 'assets/js/theme-init.js'),
        resolve(distDir, 'assets/js/theme-init.js')
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

      // Copy Bootstrap Icons fonts
      const fontsDir = resolve(__dirname, 'assets/fonts/bootstrap-icons')
      const distFontsDir = resolve(distDir, 'assets/fonts/bootstrap-icons')
      if (existsSync(fontsDir)) {
        mkdirSync(distFontsDir, { recursive: true })
        const fontFiles = readdirSync(fontsDir)
        fontFiles.forEach(file => {
          copyFileSync(
            resolve(fontsDir, file),
            resolve(distFontsDir, file)
          )
        })
      }
    }
  }
}

const plugins = [react(), copyExtensionAssets()]

if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer')
  plugins.push(visualizer({ open: true, filename: 'dist/stats.html' }))
}

export default defineConfig({
  plugins,
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  },
  build: {
    modulePreload: { polyfill: false },
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/marked') || id.includes('node_modules/highlight.js')) {
            return 'vendor-markdown'
          }
        }
      }
    }
  }
})
