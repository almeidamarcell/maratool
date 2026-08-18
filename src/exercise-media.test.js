/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, afterEach, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const read = p => readFileSync(resolve(ROOT, p), 'utf-8')
const astro = read('src/components/exercises/ExerciseMedia.astro')
const js = read('src/tools/exercise-media.js')

describe('ExerciseMedia.astro', () => {
  test('offers exactly the four approved modes', () => {
    for (const m of ['anim', 'side', 'start', 'end']) {
      expect(astro).toContain(`data-mode="${m}"`)
    }
  })

  test('exposes media data to JS via data attributes', () => {
    expect(astro).toContain('data-start=')
    expect(astro).toContain('data-end=')
    expect(astro).toContain('data-kind=')
  })

  test('reserves height to avoid layout shift', () => {
    expect(astro).toMatch(/min-height/)
  })

  test('uses global styles, not scoped', () => {
    expect(astro).toContain('<style is:global>')
  })
})

describe('exercise-media.js', () => {
  test('animation uses a hard cut, never a crossfade', () => {
    // A crossfade would show the terracotta phase ghosted over the dark one.
    expect(js).not.toMatch(/transition:\s*opacity/)
    expect(js).toMatch(/setInterval/)
  })

  test('persists the chosen mode in localStorage under a namespaced key', () => {
    expect(js).toContain('maratool.exercise.mediaMode')
    expect(js).toMatch(/localStorage\.setItem/)
    expect(js).toMatch(/localStorage\.getItem/)
  })

  test('respects prefers-reduced-motion by defaulting away from animation', () => {
    expect(js).toContain('prefers-reduced-motion')
  })

  test('clears its interval when switching modes (no leaked timers)', () => {
    expect(js).toMatch(/clearInterval/)
  })

  test('uses the hidden attribute, not style.display', () => {
    expect(js).not.toMatch(/style\.display/)
  })

  test('fetches vector SVG markup and inlines it (module-level cache), rather than assigning it as an <img> src', () => {
    // Static shape checks: a fetch-based inliner with a module-level cache.
    expect(js).toMatch(/fetch\(/)
    expect(js).toMatch(/\.innerHTML\s*=/)
    expect(js).toMatch(/new Map\(\)/)
  })
})

// Behavioral regression test for the brief correction: an <img src="*.svg">
// loads the SVG as an independent document, so its fill="currentColor" resolves
// against the SVG's own initial color (black), not the page's CSS. Vector media
// MUST be fetched and inlined into the DOM so it inherits currentColor from the
// `.exm-phase[data-phase]` color rules. This test actually executes the script
// against a mocked fetch and inspects the real DOM output, so it can't be
// satisfied by wording alone (a plain "the code contains fetch" check could
// still pass with a broken implementation that fetches but never inlines, or
// that inlines but also renders an <img>).
describe('exercise-media.js — vector SVG inlining (behavioral)', () => {
  const SVG_URL_START = '/exercises/svg/0001-relaxation.svg'
  const SVG_URL_END = '/exercises/svg/0001-tension.svg'
  const FAKE_SVG = '<svg viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h10v10H0z"/></svg>'

  function mountVectorRoot(kind = 'vector') {
    document.body.innerHTML = `
      <div class="exm" data-kind="${kind}" data-start="${SVG_URL_START}" data-end="${SVG_URL_END}">
        <div class="exm-modes" role="group" aria-label="Display mode">
          <button type="button" data-mode="anim" aria-pressed="true">Animate</button>
          <button type="button" data-mode="side" aria-pressed="false">Side by side</button>
          <button type="button" data-mode="start" aria-pressed="false">Start</button>
          <button type="button" data-mode="end" aria-pressed="false">Effort</button>
        </div>
        <div class="exm-stage" data-name="Test Exercise"></div>
        <p class="exm-cap"></p>
      </div>
    `
    return document.querySelector('.exm')
  }

  async function flushMicrotasks() {
    // fetch().then(res => res.text()).then(svgText => ...) is several
    // microtask hops deep; a macrotask boundary reliably flushes all of them.
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => setTimeout(r, 0))
  }

  async function loadScriptFresh() {
    // Reset vitest's module registry so each test gets its own evaluation of
    // the script (it self-initializes against document.querySelectorAll('.exm')
    // at import time, so a cached module would silently no-op on re-import).
    vi.resetModules()
    await import('./tools/exercise-media.js')
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  test('inlines the fetched SVG markup into the phase element instead of using <img>', async () => {
    const calls = []
    vi.stubGlobal('fetch', (url) => {
      calls.push(url)
      return Promise.resolve({ ok: true, text: () => Promise.resolve(FAKE_SVG) })
    })

    const root = mountVectorRoot('vector')
    await loadScriptFresh()

    // Switch off the default 'anim' mode (which also clears its setInterval)
    // so the DOM settles into a single, deterministic phase to inspect.
    root.querySelector('[data-mode="start"]').click()
    await flushMicrotasks()

    const startPhase = root.querySelector('.exm-stage [data-phase="start"]')
    expect(startPhase).not.toBeNull()
    expect(startPhase.querySelector('svg')).not.toBeNull()
    expect(startPhase.querySelector('img')).toBeNull()
    expect(calls).toContain(SVG_URL_START)
  })

  test('caches the fetch per URL so switching modes back and forth does not re-fetch', async () => {
    const calls = []
    vi.stubGlobal('fetch', (url) => {
      calls.push(url)
      return Promise.resolve({ ok: true, text: () => Promise.resolve(FAKE_SVG) })
    })

    const root = mountVectorRoot('vector')
    await loadScriptFresh()
    await flushMicrotasks()

    root.querySelector('[data-mode="start"]').click()
    await flushMicrotasks()
    root.querySelector('[data-mode="side"]').click()
    await flushMicrotasks()
    root.querySelector('[data-mode="start"]').click()
    await flushMicrotasks()

    const startCalls = calls.filter((u) => u === SVG_URL_START)
    expect(startCalls.length).toBe(1)
  })

  test('leaves the phase empty rather than throwing when the SVG fetch fails', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('network down')))

    const root = mountVectorRoot('vector')
    await loadScriptFresh()

    root.querySelector('[data-mode="start"]').click()
    await flushMicrotasks()

    const startPhase = root.querySelector('.exm-stage [data-phase="start"]')
    expect(startPhase).not.toBeNull()
    expect(startPhase.querySelector('svg')).toBeNull()
    expect(startPhase.querySelector('img')).toBeNull()
  })

  test('photos still render through a plain <img>, not fetch-and-inline', async () => {
    const calls = []
    vi.stubGlobal('fetch', (url) => {
      calls.push(url)
      return Promise.resolve({ ok: true, text: () => Promise.resolve(FAKE_SVG) })
    })

    const root = mountVectorRoot('photo')
    await loadScriptFresh()

    root.querySelector('[data-mode="start"]').click()
    await flushMicrotasks()

    const startPhase = root.querySelector('.exm-stage [data-phase="start"]')
    const img = startPhase.querySelector('img')
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe(SVG_URL_START)
    expect(startPhase.querySelector('svg')).toBeNull()
    expect(calls).not.toContain(SVG_URL_START)
  })
})
