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

const SOURCES = {
  everkinetic: { repo: 'https://github.com/everkinetic/data', license: 'CC BY-SA 4.0' },
  freedb: { repo: 'https://github.com/yuhonas/free-exercise-db', license: 'Unlicense (public domain)' },
}

rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
mkdirSync(OUT, { recursive: true })
mkdirSync(SVG_OUT, { recursive: true })

function clone(name, repo) {
  const dir = resolve(TMP, name)
  execSync(`git clone --depth 1 -q ${repo} "${dir}"`, { stdio: 'inherit' })
  const sha = execSync('git rev-parse HEAD', { cwd: dir, encoding: 'utf-8' }).trim()
  return { dir, sha }
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
    // Normalize the two fills so the viewer can recolor via currentColor.
    const raw = readFileSync(resolve(svgDir, f), 'utf-8')
    const normalized = raw
      .replace(/fill="#FFF"/g, 'fill="none"')
      .replace(/fill="#333"/g, 'fill="currentColor"')
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
const PHOTO_OUT = resolve(ROOT, 'public/exercises/photos')
mkdirSync(PHOTO_OUT, { recursive: true })
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
