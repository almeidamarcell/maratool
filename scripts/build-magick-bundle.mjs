#!/usr/bin/env node
import { copyFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = join(root, 'node_modules/@imagemagick/magick-wasm/dist/magick.wasm')
const vendorDir = join(root, 'public/vendor')
const wasmDest = join(vendorDir, 'magick.wasm')
const workerDest = join(vendorDir, 'magick-worker.js')

try {
  statSync(wasmSrc)
} catch {
  console.warn('build-magick-bundle: magick.wasm missing — run npm install')
  process.exit(0)
}

mkdirSync(vendorDir, { recursive: true })
copyFileSync(wasmSrc, wasmDest)

await esbuild.build({
  entryPoints: [join(root, 'scripts/magick-worker-entry.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: workerDest,
  logLevel: 'silent',
})

const sizeMb = (statSync(wasmDest).size / (1024 * 1024)).toFixed(1)
console.log(`build-magick-bundle: magick.wasm (${sizeMb} MB) + magick-worker.js → public/vendor/`)
