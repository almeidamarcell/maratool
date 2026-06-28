#!/usr/bin/env node
import { mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
// We bundle only the small JS API. The ~56 MB pandoc.wasm is NOT copied into
// public/vendor — it exceeds Cloudflare Pages' 25 MiB per-file limit and would
// fail the deploy. The browser fetches the wasm from the npm CDN at runtime
// (see PANDOC_WASM_URL in src/tools/document-converter-pandoc.js).
const wasmSrc = join(root, 'node_modules/pandoc-wasm/src/pandoc.wasm')
const vendorDir = join(root, 'public/vendor')
const apiDest = join(vendorDir, 'pandoc-api.js')

try {
  statSync(wasmSrc)
} catch {
  console.warn('build-pandoc-bundle: pandoc-wasm missing — run npm install')
  process.exit(0)
}

mkdirSync(vendorDir, { recursive: true })

await esbuild.build({
  entryPoints: [join(root, 'scripts/pandoc-bundle-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: apiDest,
  logLevel: 'silent',
})

console.log('build-pandoc-bundle: pandoc-api.js → public/vendor/ (wasm loaded from CDN at runtime)')
