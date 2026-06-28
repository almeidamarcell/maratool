#!/usr/bin/env node
import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = join(root, 'node_modules/pandoc-wasm/src/pandoc.wasm')
const vendorDir = join(root, 'public/vendor')
const wasmDest = join(vendorDir, 'pandoc.wasm')
const apiDest = join(vendorDir, 'pandoc-api.js')

try {
  statSync(wasmSrc)
} catch {
  console.warn('build-pandoc-bundle: pandoc.wasm missing — run npm install')
  process.exit(0)
}

mkdirSync(vendorDir, { recursive: true })
copyFileSync(wasmSrc, wasmDest)

await esbuild.build({
  entryPoints: [join(root, 'scripts/pandoc-bundle-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: apiDest,
  logLevel: 'silent',
})

const sizeMb = (statSync(wasmDest).size / (1024 * 1024)).toFixed(1)
console.log(`build-pandoc-bundle: pandoc.wasm (${sizeMb} MB) + pandoc-api.js → public/vendor/`)
