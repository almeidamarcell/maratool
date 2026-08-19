/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')
const page = read('src/pages/exercises/index.astro')
const js = read('src/tools/exercise-browser.js')

describe('exercise browser page', () => {
  test('does not inline the full dataset — it fetches the lean index', () => {
    expect(page).not.toContain("from '../../data/exercises/exercises.json'")
    expect(js).toContain('/exercises/browse-index.json')
  })

  test('reserves height on the results container to prevent CLS', () => {
    expect(page).toMatch(/min-height/)
  })

  test('uses global styles and a non-module tool script', () => {
    expect(page).toContain('<style is:global>')
    expect(page).toContain('src="../../tools/exercise-browser.js"')
    expect(page).not.toMatch(/type="module"[^>]*tools\//)
  })

  test('has a search input and the four facet groups', () => {
    expect(page).toContain('id="ex-search"')
    for (const f of ['muscle', 'equipment', 'category', 'level']) {
      expect(page).toContain(`data-facet="${f}"`)
    }
  })

  test('emits CollectionPage schema with a trailing-slash canonical', () => {
    expect(page).toContain("'@type': 'CollectionPage'")
    // No trailing slash: house convention across every tool page — Base.astro
    // normalises it, and the registry-wide canonical invariant expects this form.
    expect(page).toContain("canonical: 'https://maratool.com/exercises'")
  })

  test('ships the tool-page contract: a How to use block and FAQPage schema', () => {
    // CLAUDE.md requires both of every `live: true` tool page.
    expect(page).toContain('How to use')
    expect(page).toContain("'@type': 'FAQPage'")
    expect(page).toContain('faqSchema')
    expect(page).toContain('<summary>{f.q}</summary>')
    // Exactly four Q&A pairs, as CLAUDE.md requires.
    expect((page.match(/^ {4}q: /gm) ?? []).length).toBe(4)
  })

  test('links every hub as a real anchor with a trailing slash', () => {
    // The facet sidebar is checkboxes, which emit no crawlable links, so the
    // category and level hubs were reachable only through the sitemap.
    for (const base of ['/exercises/muscle/', '/exercises/equipment/', '/exercises/category/', '/exercises/level/']) {
      expect(page).toContain(`base: '${base}'`)
    }
    expect(page).toContain("href={`${g.base}${v.value.replace(/ /g, '-')}/`}")
  })
})

describe('exercise-browser.js — behaviour', () => {
  const RECORDS = [
    { slug: 'barbell-squat', name: 'Barbell Squat', primaryMuscles: ['quadriceps'], equipment: ['barbell'], category: 'strength', level: 'beginner', mediaKind: 'photo', media: '/exercises/photos/Barbell_Squat__0.jpg' },
    { slug: 'dumbbell-curl', name: 'Dumbbell Curl', primaryMuscles: ['biceps'], equipment: ['dumbbell'], category: 'strength', level: 'intermediate', mediaKind: 'photo', media: '/exercises/photos/Dumbbell_Curl__0.jpg' },
    { slug: 'push-up', name: 'Push Up', primaryMuscles: ['chest'], equipment: ['body only'], category: 'strength', level: 'beginner', mediaKind: 'photo', media: '/exercises/photos/Push_Up__0.jpg' },
    { slug: 'barbell-curl', name: 'Barbell Curl', primaryMuscles: ['biceps'], equipment: ['barbell'], category: 'strength', level: 'expert', mediaKind: 'photo', media: '/exercises/photos/Barbell_Curl__0.jpg' },
    // A record with no level at all — must survive when no level filter is on.
    { slug: 'neck-stretch', name: 'Neck Stretch', primaryMuscles: ['neck'], equipment: ['body only'], category: 'stretching', level: null, mediaKind: 'photo', media: '/exercises/photos/Neck_Stretch__0.jpg' },
  ]

  function mount() {
    document.body.innerHTML = `
      <aside>
        <input type="checkbox" class="ex-facet" data-facet="muscle" value="quadriceps" />
        <input type="checkbox" class="ex-facet" data-facet="muscle" value="biceps" />
        <input type="checkbox" class="ex-facet" data-facet="muscle" value="neck" />
        <input type="checkbox" class="ex-facet" data-facet="equipment" value="barbell" />
        <input type="checkbox" class="ex-facet" data-facet="equipment" value="dumbbell" />
        <input type="checkbox" class="ex-facet" data-facet="category" value="stretching" />
        <input type="checkbox" class="ex-facet" data-facet="level" value="beginner" />
      </aside>
      <input id="ex-search" type="search" />
      <p id="ex-count"></p>
      <div id="ex-results"></div>
      <p id="ex-empty" hidden></p>
    `
  }

  function stubFetch(data) {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
    )
  }

  async function loadScriptFresh() {
    // The script self-initializes at import time, so a cached module would
    // silently no-op on re-import.
    vi.resetModules()
    await import('./tools/exercise-browser.js')
  }

  async function flush() {
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))
  }

  // Longer than the script's 120ms input debounce.
  const afterDebounce = () => new Promise(r => setTimeout(r, 200))

  const shownNames = () =>
    [...document.querySelectorAll('#ex-results .exb-card h3')].map(h => h.textContent)

  const check = (facet, value, on = true) => {
    const box = document.querySelector(`.ex-facet[data-facet="${facet}"][value="${value}"]`)
    box.checked = on
    box.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const type = async (text) => {
    const input = document.getElementById('ex-search')
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await afterDebounce()
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    window.history.pushState({}, '', '/')
  })

  test('renders every record once the index loads', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    expect(shownNames()).toHaveLength(RECORDS.length)
    expect(document.getElementById('ex-count').textContent).toContain('5 of 5')
  })

  test('links each result with a trailing slash', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    const hrefs = [...document.querySelectorAll('#ex-results .exb-card')].map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/exercises/barbell-squat/')
    for (const h of hrefs) expect(h.endsWith('/')).toBe(true)
  })

  test('search filters by name, case-insensitively', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    await type('curl')
    expect(shownNames().sort()).toEqual(['Barbell Curl', 'Dumbbell Curl'])
  })

  test('search that matches nothing reveals the empty message', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()
    expect(document.getElementById('ex-empty').hidden).toBe(true)

    await type('zzzz-no-such-exercise')
    expect(shownNames()).toHaveLength(0)
    expect(document.getElementById('ex-empty').hidden).toBe(false)
  })

  test('facets OR within a group', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    check('muscle', 'quadriceps')
    check('muscle', 'biceps')
    // quadriceps OR biceps — not the impossible intersection of the two.
    expect(shownNames().sort()).toEqual(['Barbell Curl', 'Barbell Squat', 'Dumbbell Curl'])
  })

  test('facets AND across groups', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    check('muscle', 'biceps')
    check('equipment', 'barbell')
    expect(shownNames()).toEqual(['Barbell Curl'])
  })

  test('a level:null record survives when no level filter is active', async () => {
    // Regression guard: `f.level.indexOf(ex.level)` must only run when a level
    // filter is actually set, or every record without a level disappears.
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    expect(shownNames()).toContain('Neck Stretch')

    check('category', 'stretching')
    expect(shownNames()).toEqual(['Neck Stretch'])
  })

  test('an active level filter does exclude the level:null record', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    check('level', 'beginner')
    expect(shownNames().sort()).toEqual(['Barbell Squat', 'Push Up'])
    expect(shownNames()).not.toContain('Neck Stretch')
  })

  test('search and facets combine', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    check('equipment', 'barbell')
    await type('squat')
    expect(shownNames()).toEqual(['Barbell Squat'])
  })

  test('caps the rendered set and says how many actually matched', async () => {
    const many = Array.from({ length: 300 }, (_, i) => ({
      slug: `ex-${i}`,
      name: `Exercise ${i}`,
      primaryMuscles: ['chest'],
      equipment: ['barbell'],
      category: 'strength',
      level: 'beginner',
      mediaKind: 'photo',
    }))
    mount()
    stubFetch(many)
    await loadScriptFresh()
    await flush()

    expect(shownNames().length).toBe(120)
    const count = document.getElementById('ex-count').textContent
    expect(count).toContain('first 120')
    expect(count).toContain('300')
  })

  test('debounces typing — a burst of keystrokes renders once, at the end', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    const input = document.getElementById('ex-search')
    for (const v of ['c', 'cu', 'cur', 'curl']) {
      input.value = v
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    // Nothing has re-rendered yet — the debounce window is still open.
    expect(shownNames()).toHaveLength(RECORDS.length)

    await afterDebounce()
    expect(shownNames().sort()).toEqual(['Barbell Curl', 'Dumbbell Curl'])
  })

  test('a failed index fetch shows a message instead of failing silently', async () => {
    mount()
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')))
    await loadScriptFresh()
    await flush()

    expect(document.getElementById('ex-count').textContent).toMatch(/could not load/i)
    expect(shownNames()).toHaveLength(0)
  })

  test('renders a lazy, explicitly-sized thumbnail image sourced from the record\'s media path', async () => {
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    const img = document.querySelector('#ex-results .exb-card .exb-thumb img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/exercises/photos/Barbell_Squat__0.jpg')
    // jsdom doesn't reflect the loading/decoding IDL properties to HTML
    // attributes (real browsers do), so these are checked as properties —
    // exactly how exercise-media.js and the other tools/*.js files set them.
    expect(img.loading).toBe('lazy')
    expect(img.decoding).toBe('async')
    expect(img.getAttribute('alt')).toBe('')
    expect(img.getAttribute('width')).toBeTruthy()
    expect(img.getAttribute('height')).toBeTruthy()
  })

  test('prefills the search box from a ?q= URL param — the ⌘K palette\'s "see all" link relies on this', async () => {
    window.history.pushState({}, '', '/exercises/?q=curl')
    mount()
    stubFetch(RECORDS)
    await loadScriptFresh()
    await flush()

    expect(document.getElementById('ex-search').value).toBe('curl')
    expect(shownNames().sort()).toEqual(['Barbell Curl', 'Dumbbell Curl'])
  })

  test('skips the thumbnail rather than rendering a broken image when a record has no media', async () => {
    mount()
    const noMedia = RECORDS.map(r => ({ ...r, media: undefined }))
    stubFetch(noMedia)
    await loadScriptFresh()
    await flush()

    expect(shownNames()).toHaveLength(noMedia.length)
    expect(document.querySelector('#ex-results .exb-thumb')).toBeNull()
  })
})

describe('exercise-browser.js — source contract', () => {
  test('uses the hidden attribute rather than style.display', () => {
    expect(js).not.toMatch(/style\.display/)
  })

  test('debounces input and caps the rendered set', () => {
    expect(js).toContain('DEBOUNCE_MS')
    expect(js).toContain('RENDER_CAP')
    expect(js).toContain("search.addEventListener('input', renderDebounced)")
  })
})
