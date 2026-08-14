/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { applyGifOperation, getResizeTargetDims, getCropRegionForFrame, setVisible } from './gif-anim-ui.js'

describe('setVisible', () => {
  // Mirrors public/styles/discovery-shared.css, which Base.astro loads on every
  // page. This rule is why toggling style.display alone silently failed.
  function withGlobalHiddenRule() {
    const style = document.createElement('style')
    style.textContent = '[hidden] { display: none !important; }'
    document.head.appendChild(style)
  }

  function makePanel() {
    const el = document.createElement('div')
    el.hidden = true
    document.body.appendChild(el)
    return el
  }

  it('reveals a panel that shipped with the hidden attribute', () => {
    withGlobalHiddenRule()
    const el = makePanel()
    setVisible(el, true)
    expect(el.hidden).toBe(false)
    expect(getComputedStyle(el).display).not.toBe('none')
  })

  it('regression: clearing only the inline display leaves the panel invisible', () => {
    // The original bug. Without dropping the attribute, `[hidden]` wins and the
    // whole tool looks dead after upload.
    withGlobalHiddenRule()
    const el = makePanel()
    el.style.display = ''
    expect(getComputedStyle(el).display).toBe('none')
    setVisible(el, true)
    expect(getComputedStyle(el).display).not.toBe('none')
  })

  it('hides a visible panel', () => {
    withGlobalHiddenRule()
    const el = makePanel()
    setVisible(el, true)
    setVisible(el, false)
    expect(el.hidden).toBe(true)
    expect(getComputedStyle(el).display).toBe('none')
  })

  it('survives repeated toggling', () => {
    withGlobalHiddenRule()
    const el = makePanel()
    for (let i = 0; i < 3; i++) {
      setVisible(el, true)
      expect(el.hidden).toBe(false)
      setVisible(el, false)
      expect(el.hidden).toBe(true)
    }
  })

  it('ignores a missing element instead of throwing', () => {
    expect(() => setVisible(null, true)).not.toThrow()
    expect(() => setVisible(undefined, false)).not.toThrow()
  })
})

describe('applyGifOperation via gif-anim-ui', () => {
  it('reverses frames and delays together', () => {
    const frames = [{ rgba: new Uint8ClampedArray(4) }, { rgba: new Uint8ClampedArray(4) }]
    const delays = [10, 20]
    const out = applyGifOperation('reverse', frames, delays, {})
    expect(out.frames).toHaveLength(2)
    expect(out.delays).toEqual([20, 10])
  })
})

describe('getResizeTargetDims', () => {
  it('computes contain dimensions', () => {
    expect(getResizeTargetDims(800, 600, { width: 400, height: 400, mode: 'contain' })).toEqual({
      width: 400,
      height: 300,
    })
  })
})

describe('getCropRegionForFrame', () => {
  it('returns valid crop', () => {
    expect(getCropRegionForFrame(100, 100, { cropW: 50, cropH: 50, cropX: 10, cropY: 10 })).toEqual({
      x: 10, y: 10, width: 50, height: 50,
    })
  })

  it('treats a missing scale as 1:1', () => {
    const opts = { cropW: 50, cropH: 50, cropX: 10, cropY: 10 }
    expect(getCropRegionForFrame(100, 100, opts, 1)).toEqual(getCropRegionForFrame(100, 100, opts))
  })

  it('maps the crop box onto frames that were shrunk to fit memory', () => {
    // User typed original-resolution coordinates; frames decoded at 25%.
    expect(getCropRegionForFrame(702, 413, { cropW: 1200, cropH: 800, cropX: 400, cropY: 200 }, 0.25))
      .toEqual({ x: 100, y: 50, width: 300, height: 200 })
  })

  it('keeps a downscaled crop inside the decoded frame', () => {
    // Without mapping, x=2000 would fall outside a 702px-wide frame.
    const r = getCropRegionForFrame(702, 413, { cropW: 800, cropH: 400, cropX: 2000, cropY: 1200 }, 0.25)
    expect(r.x + r.width).toBeLessThanOrEqual(702)
    expect(r.y + r.height).toBeLessThanOrEqual(413)
  })
})
