/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { setVisible, makeProgress, readFileAsDataURL, nextPaint } from './tool-utils.js'

// Mirrors public/styles/discovery-shared.css, which Base.astro loads on every
// page. This rule is why toggling style.display alone silently failed.
function withGlobalHiddenRule() {
  const style = document.createElement('style')
  style.textContent = '[hidden] { display: none !important; }'
  document.head.appendChild(style)
}

describe('setVisible', () => {
  it('reveals a panel that shipped with the hidden attribute', () => {
    withGlobalHiddenRule()
    const el = document.createElement('div')
    el.hidden = true
    document.body.appendChild(el)

    setVisible(el, true)

    expect(el.hidden).toBe(false)
    expect(getComputedStyle(el).display).not.toBe('none')
  })

  it('hides through both the attribute and inline display', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    setVisible(el, false)

    expect(el.hidden).toBe(true)
    expect(el.style.display).toBe('none')
  })

  it('ignores a missing element', () => {
    expect(() => setVisible(null, true)).not.toThrow()
  })
})

describe('makeProgress', () => {
  function build() {
    const text = document.createElement('p')
    const bar = document.createElement('div')
    bar.className = 'tool-progress-bar'
    const fill = document.createElement('div')
    fill.className = 'tool-progress-fill'
    bar.appendChild(fill)
    return { text, bar, fill, progress: makeProgress(text, fill) }
  }

  it('sets the label and fill width from a 0..1 ratio', () => {
    const { text, fill, progress } = build()
    progress.set('Reading file…', 0.42)
    expect(text.textContent).toBe('Reading file…')
    expect(fill.style.width).toBe('42%')
  })

  it('clamps ratios outside 0..1', () => {
    const { fill, progress } = build()
    progress.set('x', 4)
    expect(fill.style.width).toBe('100%')
    progress.set('x', -1)
    expect(fill.style.width).toBe('0%')
  })

  it('treats a missing ratio as zero rather than NaN', () => {
    const { fill, progress } = build()
    progress.set('x')
    expect(fill.style.width).toBe('0%')
  })

  it('marks the bar indeterminate for work with no known total', () => {
    const { bar, text, progress } = build()
    progress.pending('Converting…')
    expect(bar.classList.contains('indeterminate')).toBe(true)
    expect(text.textContent).toBe('Converting…')
  })

  it('clears indeterminate when a real ratio arrives', () => {
    const { bar, progress } = build()
    progress.pending('Converting…')
    progress.set('Encoding…', 0.5)
    expect(bar.classList.contains('indeterminate')).toBe(false)
  })

  it('reset returns the bar to empty and determinate', () => {
    const { bar, fill, progress } = build()
    progress.pending('Converting…')
    progress.reset()
    expect(bar.classList.contains('indeterminate')).toBe(false)
    expect(fill.style.width).toBe('0%')
  })

  it('works with no fill element (text-only panels)', () => {
    const text = document.createElement('p')
    const progress = makeProgress(text, null)
    expect(() => progress.set('Reading…', 0.5)).not.toThrow()
    expect(() => progress.pending('Converting…')).not.toThrow()
    expect(() => progress.reset()).not.toThrow()
    expect(text.textContent).toBe('Converting…')
  })
})

describe('readFileAsDataURL', () => {
  it('resolves the data URL and reports completion', async () => {
    const file = new File(['hello'], 'a.txt', { type: 'text/plain' })
    const onProgress = vi.fn()

    const result = await readFileAsDataURL(file, onProgress)

    expect(result).toMatch(/^data:/)
    expect(onProgress).toHaveBeenCalledWith(1)
  })

  it('names the file in the error so the user knows which one failed', async () => {
    const file = new File(['x'], 'broken.webp', { type: 'image/webp' })
    const spy = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () {
      setTimeout(() => this.onerror(new Event('error')), 0)
    })
    try {
      await expect(readFileAsDataURL(file)).rejects.toThrow('broken.webp')
    } finally {
      spy.mockRestore()
    }
  })
})

describe('nextPaint', () => {
  it('resolves after the browser has had a chance to paint', async () => {
    await expect(nextPaint()).resolves.toBeUndefined()
  })
})
