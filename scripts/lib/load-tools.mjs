// Shared build-time loader for src/data/tools.ts.
//
// gen-llms, gen-palette and gen-lastmod each need the tools array but run
// without a TS toolchain. The file is pure data (`export const tools: Tool[]
// = [...]`), so we strip the TS-only syntax and evaluate just the array
// literal. Centralised here so a change to tools.ts's shape breaks one place
// loudly instead of three places silently.

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = resolve(__dirname, '../..')

export function loadTools({ caller = 'load-tools' } = {}) {
  const toolsSource = readFileSync(resolve(ROOT, 'src/data/tools.ts'), 'utf-8')

  const dataOnly = toolsSource
    .replace(/export interface Tool \{[\s\S]*?\n\}\n/, '')
    .replace(/:\s*Tool\[\]/, '')
    .replace(/^export\s+const\s+tools\s*=/m, 'globalThis.__tools =')

  const startIdx = dataOnly.indexOf('globalThis.__tools =')
  if (startIdx === -1) {
    throw new Error(`${caller}: could not locate tools array in src/data/tools.ts`)
  }

  const bracketStart = dataOnly.indexOf('[', startIdx)
  let depth = 0
  let bracketEnd = -1
  for (let i = bracketStart; i < dataOnly.length; i++) {
    const ch = dataOnly[i]
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) { bracketEnd = i; break }
    }
  }
  if (bracketEnd === -1) {
    throw new Error(`${caller}: unbalanced brackets in tools array`)
  }

  const arrayLiteral = dataOnly.slice(bracketStart, bracketEnd + 1)
  // Build-time eval of our own source file — not user input.
  const tools = (0, eval)(`(${arrayLiteral})`)

  if (!Array.isArray(tools) || tools.length === 0 || !tools[0].slug) {
    throw new Error(`${caller}: parsed tools array looks wrong (len=${tools?.length})`)
  }
  return tools
}
