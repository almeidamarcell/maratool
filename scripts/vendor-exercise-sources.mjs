#!/usr/bin/env node
// One-shot vendoring of the two openly-licensed exercise datasets.
// Run manually: node scripts/vendor-exercise-sources.mjs
// NOT part of prebuild — the vendored output is committed to the repo.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, rmSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TMP = resolve(ROOT, '.vendor-tmp')
const OUT = resolve(ROOT, 'src/data/exercises')
const SVG_OUT = resolve(ROOT, 'public/exercises/svg')
const PHOTO_OUT = resolve(ROOT, 'public/exercises/photos')

const SOURCES = {
  everkinetic: { repo: 'https://github.com/everkinetic/data', license: 'CC BY-SA 4.0' },
  freedb: { repo: 'https://github.com/yuhonas/free-exercise-db', license: 'Unlicense (public domain)' },
}

// Purge every generated output dir before regenerating, so a re-run after a
// change to the kept-record set never leaves stale/orphaned files behind.
rmSync(TMP, { recursive: true, force: true })
rmSync(SVG_OUT, { recursive: true, force: true })
rmSync(PHOTO_OUT, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
mkdirSync(OUT, { recursive: true })
mkdirSync(SVG_OUT, { recursive: true })
mkdirSync(PHOTO_OUT, { recursive: true })

function clone(name, repo) {
  const dir = resolve(TMP, name)
  execSync(`git clone --depth 1 -q ${repo} "${dir}"`, { stdio: 'inherit' })
  const sha = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim()
  return { dir, sha }
}

// Relative luminance (ITU-R BT.709 weights) of a 3- or 6-digit hex color,
// on a 0-255 scale. Everkinetic's fill palette is strongly bimodal (near-white
// negative space vs. near-black figure), so a simple midpoint threshold on
// luminance reliably separates the two groups without hardcoding literal
// color strings (which silently missed lowercase/off-palette variants).
function luminance(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Classify every fill="..." value in the SVG by luminance rather than
// matching a fixed set of literal color strings. Light fills (negative-space
// background) -> fill="none". Dark fills (the figure) -> fill="currentColor"
// so a later task can recolor each movement phase via CSS. Already-normalized
// values are left untouched; anything not recognized as none/currentColor/hex
// is left untouched too (none appear in the vendored source, verified by hand).
function normalizeFills(svg) {
  return svg.replace(/fill="([^"]*)"/g, (match, value) => {
    if (/^none$/i.test(value)) return 'fill="none"'
    if (/^currentColor$/i.test(value)) return 'fill="currentColor"'
    if (/^#[0-9a-f]{3}$|^#[0-9a-f]{6}$/i.test(value)) {
      return luminance(value) > 127.5 ? 'fill="none"' : 'fill="currentColor"'
    }
    return match
  })
}

// ---- Everkinetic: keep only records that have BOTH svg phases AND a unique id_num ----
// id_num is an independent numbering, not derived from id — two different
// exercises can collide on the same id_num (and therefore the same SVG pair).
// There's no principled way to tell which exercise the art actually depicts,
// so on collision we drop BOTH records rather than guess.
const ek = clone('everkinetic', SOURCES.everkinetic.repo)
const ekAll = JSON.parse(readFileSync(resolve(ek.dir, 'exercises.json'), 'utf-8'))
const svgDir = resolve(ek.dir, 'dist/svg')
const svgFiles = new Set(readdirSync(svgDir))
const ekBothPhases = ekAll.filter(x =>
  x.id_num && svgFiles.has(`${x.id_num}-relaxation.svg`) && svgFiles.has(`${x.id_num}-tension.svg`)
)
const idNumCounts = new Map()
for (const x of ekBothPhases) idNumCounts.set(x.id_num, (idNumCounts.get(x.id_num) ?? 0) + 1)
const ekKept = ekBothPhases.filter(x => idNumCounts.get(x.id_num) === 1)
for (const x of ekKept) {
  for (const phase of ['relaxation', 'tension']) {
    const f = `${x.id_num}-${phase}.svg`
    // Normalize fills so the viewer can recolor via currentColor.
    const raw = readFileSync(resolve(svgDir, f), 'utf-8')
    const normalized = normalizeFills(raw)
      .replace(/width="[^"]*"\s*height="[^"]*"/, 'width="100%" height="100%"')
    writeFileSync(resolve(SVG_OUT, f), normalized)
  }
}
writeFileSync(resolve(OUT, 'everkinetic.raw.json'), JSON.stringify(ekKept, null, 2))

// ---- free-exercise-db ----
const fe = clone('freedb', SOURCES.freedb.repo)
const feAll = JSON.parse(readFileSync(resolve(fe.dir, 'dist/exercises.json'), 'utf-8'))
writeFileSync(resolve(OUT, 'free-exercise-db.raw.json'), JSON.stringify(feAll, null, 2))

// ---- copy free-db photos ----
let photos = 0
for (const x of feAll) {
  for (const rel of x.images ?? []) {
    const src = resolve(fe.dir, 'exercises', rel)
    if (!existsSync(src)) continue
    const flat = rel.replace(/\//g, '__')
    mkdirSync(dirname(resolve(PHOTO_OUT, flat)), { recursive: true })
    copyFileSync(src, resolve(PHOTO_OUT, flat))
    photos++
  }
}

writeFileSync(resolve(OUT, 'EXERCISES_SOURCE.md'), `# Vendored exercise data sources

Regenerate with: \`node scripts/vendor-exercise-sources.mjs\`

## everkinetic/data
- Repo: ${SOURCES.everkinetic.repo}
- Commit: \`${ek.sha}\`
- License: **${SOURCES.everkinetic.license}**
- Records kept (with both SVG phases): ${ekKept.length}
- Obligation: visible attribution on every page using this art, AND our
  recolored/derived versions are published under CC BY-SA 4.0.

## yuhonas/free-exercise-db
- Repo: ${SOURCES.freedb.repo}
- Commit: \`${fe.sha}\`
- License: **${SOURCES.freedb.license}**
- Records: ${feAll.length}
- Photos copied: ${photos}

## Explicitly NOT used
hasaneyldrm/exercises-dataset media (© Gym visual) — proprietary, not licensed
for redistribution on a commercial site. Never vendor it.
`)

rmSync(TMP, { recursive: true, force: true })
console.log(`vendored: everkinetic=${ekKept.length}, free-db=${feAll.length}, photos=${photos}`)
