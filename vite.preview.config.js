// Build config used ONLY to produce the zero-install single-file preview.
// It redirects every import of src/lib/data.js -> src/lib/data.static.js
// (in-memory data, no backend) and bundles everything into one chunk so it can
// be inlined into a single self-contained page.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))

// Redirect any "…/lib/data.js" import to the static, in-memory version.
function swapDataLayer() {
  return {
    name: 'swap-data-layer',
    enforce: 'pre',
    resolveId(source) {
      if (/(^|\/)lib\/data\.js$/.test(source)) {
        return path.resolve(dir, 'src/lib/data.static.js')
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [swapDataLayer(), react()],
  build: {
    outDir: 'dist-preview',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
