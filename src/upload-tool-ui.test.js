/**
 * Guards the upload tools' state machine at the source level.
 *
 * Base.astro loads discovery-shared.css on every page, which carries
 * `[hidden] { display: none !important }`. Any state panel that ships with a
 * `hidden` attribute therefore stays invisible no matter what you assign to
 * `style.display` — the tool goes blank after upload and the user sees an
 * empty box with no error and no progress. That shipped on 70 tool pages
 * before it was caught, so the rule is pinned here rather than left to review.
 *
 * Fix the module (route it through `setVisible`), don't relax the test.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const TOOLS_DIR = 'src/tools'
const PAGES_DIR = 'src/pages'

const read = (f) => {
  try { return fs.readFileSync(f, 'utf8') } catch { return '' }
}

// Ids that get `.style.display` assigned, ids revealed through the hidden
// attribute, and ids declared with `hidden` in a JS-built innerHTML string.
// Suffix-only entries (`SUFFIX-progress`) come from `getElementById(prefix + '-progress')`.
function collect(entry, seen = new Set()) {
  const empty = { display: new Set(), hiddenApi: new Set(), declaredHidden: new Set() }
  if (seen.has(entry)) return empty
  seen.add(entry)

  const src = read(entry)
  const display = new Set()
  const hiddenApi = new Set()
  const declaredHidden = new Set()
  const varToId = new Map()
  let m

  const reVar = /(?:var|let|const)\s+([A-Za-z0-9_$]+)\s*=\s*document\.getElementById\(\s*(?:'([^']+)'|"([^"]+)"|[A-Za-z0-9_$]+\s*\+\s*'([^']+)')\s*\)/g
  while ((m = reVar.exec(src))) varToId.set(m[1], m[2] || m[3] || `SUFFIX${m[4]}`)

  const reDisplayVar = /([A-Za-z0-9_$]+)\.style\.display\s*=/g
  while ((m = reDisplayVar.exec(src))) if (varToId.has(m[1])) display.add(varToId.get(m[1]))

  const reDisplayDirect = /document\.getElementById\(\s*(?:'([^']+)'|"([^"]+)")\s*\)\.style\.display\s*=/g
  while ((m = reDisplayDirect.exec(src))) display.add(m[1] || m[2])

  const reHiddenApi = /([A-Za-z0-9_$]+)\.hidden\s*=|([A-Za-z0-9_$]+)\.removeAttribute\(\s*['"]hidden/g
  while ((m = reHiddenApi.exec(src))) {
    const v = m[1] || m[2]
    if (varToId.has(v)) hiddenApi.add(varToId.get(v))
  }

  // setVisible() sets both halves, so anything passed to it is safe.
  const reSetVisible = /setVisible\(\s*([A-Za-z0-9_$]+)/g
  while ((m = reSetVisible.exec(src))) if (varToId.has(m[1])) hiddenApi.add(varToId.get(m[1]))

  for (const re of [/id="([^"'+]+)"\s+hidden/g, /id='([^"'+]+)'\s+hidden/g]) {
    while ((m = re.exec(src))) declaredHidden.add(m[1])
  }
  const rePrefixed = /id="'\s*\+\s*[A-Za-z0-9_$]+\s*\+\s*'(-[a-z-]+)"\s+hidden/g
  while ((m = rePrefixed.exec(src))) declaredHidden.add(`SUFFIX${m[1]}`)

  const reImport = /from\s+'(\.\/[^']+)'/g
  while ((m = reImport.exec(src))) {
    const child = collect(path.join(TOOLS_DIR, m[1]), seen)
    child.display.forEach((x) => display.add(x))
    child.hiddenApi.forEach((x) => hiddenApi.add(x))
    child.declaredHidden.forEach((x) => declaredHidden.add(x))
  }

  return { display, hiddenApi, declaredHidden }
}

function findBlindPanels() {
  const broken = []
  for (const page of fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.astro'))) {
    const src = read(path.join(PAGES_DIR, page))
    const scripts = [...src.matchAll(/<script src="\.\.\/tools\/([^"]+)"/g)].map((m) => m[1])
    if (!scripts.length) continue

    const pageHidden = new Set()
    let m
    const reMarkup = /<[^>]*\bid="([^"]+)"[^>]*\shidden[\s>]/g
    while ((m = reMarkup.exec(src))) pageHidden.add(m[1])
    const reMarkupAlt = /<[^>]*\shidden\s[^>]*\bid="([^"]+)"/g
    while ((m = reMarkupAlt.exec(src))) pageHidden.add(m[1])

    const display = new Set()
    const hiddenApi = new Set()
    const declaredHidden = new Set()
    for (const s of scripts) {
      const r = collect(path.join(TOOLS_DIR, s))
      r.display.forEach((x) => display.add(x))
      r.hiddenApi.forEach((x) => hiddenApi.add(x))
      r.declaredHidden.forEach((x) => declaredHidden.add(x))
    }

    const hiddenIds = new Set(pageHidden)
    const hiddenSuffixes = []
    for (const h of declaredHidden) {
      if (h.startsWith('SUFFIX')) hiddenSuffixes.push(h.slice('SUFFIX'.length))
      else hiddenIds.add(h)
    }

    const bad = new Set()
    for (const id of display) {
      if (hiddenApi.has(id)) continue
      if (id.startsWith('SUFFIX')) {
        const suffix = id.slice('SUFFIX'.length)
        const hit = [...hiddenIds].find((h) => h.endsWith(suffix))
        if (hit) bad.add(hit)
        else if (hiddenSuffixes.includes(suffix)) bad.add(`*${suffix}`)
      } else if (hiddenIds.has(id)) {
        bad.add(id)
      }
    }
    if (bad.size) broken.push(`${page.replace('.astro', '')}: ${[...bad].join(', ')}`)
  }
  return broken
}

describe('upload tool state panels', () => {
  it('never reveals a [hidden] panel with style.display alone', () => {
    expect(findBlindPanels()).toEqual([])
  })

  it('detects the regression it is meant to catch', () => {
    // Sanity check on the scanner itself: the shape it looks for is
    // "declared hidden in the JS shell, toggled only via style.display".
    const sample = `
      var root = document.getElementById('ez-root')
      root.innerHTML = '<div id="zz-settings" hidden></div>'
      var settingsEl = document.getElementById('zz-settings')
      settingsEl.style.display = 'none'
    `
    const tmp = path.join(TOOLS_DIR, '__scanner-fixture.js')
    fs.writeFileSync(tmp, sample)
    try {
      const r = collect(tmp)
      expect(r.declaredHidden.has('zz-settings')).toBe(true)
      expect(r.display.has('zz-settings')).toBe(true)
      expect(r.hiddenApi.has('zz-settings')).toBe(false)
    } finally {
      fs.unlinkSync(tmp)
    }
  })
})

describe('upload tools report progress', () => {
  // Every module that owns a dropzone and does async work must have a progress
  // panel wired to the shared bar — an upload that reads a 25 MB file with no
  // feedback is indistinguishable from a broken page.
  // Modules that build their own shell must emit the bar markup.
  const SHELL_MODULES = [
    'ezgif-image-ui.js',
    'ezgif-gif-ext-ui.js',
    'ezgif-pdf-ui.js',
    'ezgif-anim-maker-ui.js',
    'ezgif-ffmpeg-ext-ui.js',
  ]
  // These two read the markup out of the page instead of generating it.
  const UPLOAD_MODULES = [...SHELL_MODULES, 'ezgif-ffmpeg-ui.js', 'gif-anim-ui.js']

  it.each(SHELL_MODULES)('%s emits the shared progress bar markup', (file) => {
    const src = read(path.join(TOOLS_DIR, file))
    expect(src).not.toBe('')
    expect(src).toMatch(/tool-progress-fill/)
  })

  it.each(UPLOAD_MODULES)('%s drives a progress fill', (file) => {
    const src = read(path.join(TOOLS_DIR, file))
    expect(src).not.toBe('')
    expect(src).toMatch(/progress-fill/)
  })

  it.each(UPLOAD_MODULES)('%s routes visibility through setVisible', (file) => {
    const src = read(path.join(TOOLS_DIR, file))
    expect(src).toMatch(/setVisible/)
  })
})

describe('shared tool classes have styles', () => {
  // These class names are emitted by the tool modules. Referencing one that no
  // stylesheet defines is invisible at build time: the dropzone renders as a
  // bare line of text and the progress bar as a zero-height div.
  const css = read('public/styles/tools.css')

  it.each([
    'tool-dropzone',
    'tool-progress-bar',
    'tool-progress-fill',
    'tool-progress-text',
    'tool-btn',
    'tool-error',
    'tool-hint',
  ])('.%s is defined in tools.css', (cls) => {
    expect(css).toMatch(new RegExp(`\\.${cls}\\s*[,{:]`))
  })
})
