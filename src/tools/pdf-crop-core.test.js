import { describe, it, expect } from 'vitest'
import {
  PT_PER_MM,
  mmToPt,
  ptToMm,
  toPt,
  fromPt,
  normalizeRotation,
  visualSize,
  clampMargins,
  cropBoxFromMargins,
  marginsFromCropBox,
  fractionsFromMargins,
  marginsFromFractions,
  detectContentBounds,
  padFractions,
  resolveCropScope,
  formatCropSize,
} from './pdf-crop-core.js'
import { parsePageRange } from './ezgif-pdf-core.js'

// US Letter with a deliberately non-zero origin: a page that was already
// cropped once, which is exactly the case that breaks naive (0,0) maths.
const OFFSET_BOX = { x: 20, y: 50, width: 500, height: 700 }
const LETTER = { x: 0, y: 0, width: 612, height: 792 }

const noMargins = { top: 0, right: 0, bottom: 0, left: 0 }

describe('unit conversion', () => {
  it('converts mm to points and back', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 6)
    expect(ptToMm(72)).toBeCloseTo(25.4, 6)
    expect(PT_PER_MM).toBeCloseTo(2.834645, 5)
  })

  it('treats pt as the identity unit and knows inches', () => {
    expect(toPt(10, 'pt')).toBe(10)
    expect(toPt(1, 'in')).toBe(72)
    expect(fromPt(72, 'in')).toBe(1)
    expect(fromPt(mmToPt(10), 'mm')).toBeCloseTo(10, 6)
  })

  it('reads garbage as zero instead of NaN', () => {
    expect(toPt('', 'mm')).toBe(0)
    expect(toPt(undefined, 'pt')).toBe(0)
  })
})

describe('normalizeRotation', () => {
  it('folds every quarter turn into [0, 360)', () => {
    expect(normalizeRotation(0)).toBe(0)
    expect(normalizeRotation(90)).toBe(90)
    expect(normalizeRotation(360)).toBe(0)
    expect(normalizeRotation(-90)).toBe(270)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(undefined)).toBe(0)
  })
})

describe('visualSize', () => {
  it('swaps width and height on a quarter turn', () => {
    expect(visualSize(LETTER, 0)).toEqual({ width: 612, height: 792 })
    expect(visualSize(LETTER, 180)).toEqual({ width: 612, height: 792 })
    expect(visualSize(LETTER, 90)).toEqual({ width: 792, height: 612 })
    expect(visualSize(LETTER, 270)).toEqual({ width: 792, height: 612 })
  })
})

describe('cropBoxFromMargins — the bottom-left flip', () => {
  it('a top-only margin shortens the box without moving its origin', () => {
    // Screen top is the HIGH y edge in user space. Moving y here would crop
    // the bottom of the page instead — the classic inverted-axis bug.
    const box = cropBoxFromMargins(LETTER, 0, { ...noMargins, top: 100 })
    expect(box).toEqual({ x: 0, y: 0, width: 612, height: 692 })
  })

  it('a bottom-only margin raises the origin', () => {
    const box = cropBoxFromMargins(LETTER, 0, { ...noMargins, bottom: 100 })
    expect(box).toEqual({ x: 0, y: 100, width: 612, height: 692 })
  })

  it('a left-only margin moves x, a right-only margin does not', () => {
    expect(cropBoxFromMargins(LETTER, 0, { ...noMargins, left: 40 }))
      .toEqual({ x: 40, y: 0, width: 572, height: 792 })
    expect(cropBoxFromMargins(LETTER, 0, { ...noMargins, right: 40 }))
      .toEqual({ x: 0, y: 0, width: 572, height: 792 })
  })

  it('keeps a page that already starts off-origin inside its own box', () => {
    const box = cropBoxFromMargins(OFFSET_BOX, 0, { top: 10, right: 20, bottom: 30, left: 40 })
    expect(box).toEqual({ x: 60, y: 80, width: 440, height: 660 })
    expect(box.x).toBeGreaterThanOrEqual(OFFSET_BOX.x)
    expect(box.y).toBeGreaterThanOrEqual(OFFSET_BOX.y)
    expect(box.x + box.width).toBeLessThanOrEqual(OFFSET_BOX.x + OFFSET_BOX.width)
    expect(box.y + box.height).toBeLessThanOrEqual(OFFSET_BOX.y + OFFSET_BOX.height)
  })
})

describe('cropBoxFromMargins — rotated pages', () => {
  const margins = { top: 10, right: 20, bottom: 30, left: 40 }

  it('maps screen edges through /Rotate 90', () => {
    // Displayed 792×612. Screen top eats the low-x side of user space.
    expect(cropBoxFromMargins(LETTER, 90, margins))
      .toEqual({ x: 10, y: 40, width: 612 - 10 - 30, height: 792 - 40 - 20 })
  })

  it('maps screen edges through /Rotate 180', () => {
    expect(cropBoxFromMargins(LETTER, 180, margins))
      .toEqual({ x: 20, y: 10, width: 612 - 40 - 20, height: 792 - 10 - 30 })
  })

  it('maps screen edges through /Rotate 270', () => {
    expect(cropBoxFromMargins(LETTER, 270, margins))
      .toEqual({ x: 30, y: 20, width: 612 - 10 - 30, height: 792 - 40 - 20 })
  })

  it('never produces a box outside the page, whatever the rotation', () => {
    for (const rotation of [0, 90, 180, 270]) {
      const box = cropBoxFromMargins(OFFSET_BOX, rotation, margins)
      expect(box.width).toBeGreaterThan(0)
      expect(box.height).toBeGreaterThan(0)
      expect(box.x).toBeGreaterThanOrEqual(OFFSET_BOX.x - 1e-9)
      expect(box.y).toBeGreaterThanOrEqual(OFFSET_BOX.y - 1e-9)
      expect(box.x + box.width).toBeLessThanOrEqual(OFFSET_BOX.x + OFFSET_BOX.width + 1e-9)
      expect(box.y + box.height).toBeLessThanOrEqual(OFFSET_BOX.y + OFFSET_BOX.height + 1e-9)
    }
  })
})

describe('marginsFromCropBox', () => {
  it('round-trips margins through every rotation', () => {
    const margins = { top: 12, right: 8, bottom: 21, left: 33 }
    for (const rotation of [0, 90, 180, 270]) {
      const box = cropBoxFromMargins(OFFSET_BOX, rotation, margins)
      const back = marginsFromCropBox(OFFSET_BOX, rotation, box)
      expect(back.top).toBeCloseTo(margins.top, 9)
      expect(back.right).toBeCloseTo(margins.right, 9)
      expect(back.bottom).toBeCloseTo(margins.bottom, 9)
      expect(back.left).toBeCloseTo(margins.left, 9)
    }
  })

  it('reads an uncropped page as four zero margins', () => {
    expect(marginsFromCropBox(LETTER, 0, LETTER)).toEqual(noMargins)
  })
})

describe('clampMargins', () => {
  it('leaves sane margins alone', () => {
    expect(clampMargins({ top: 10, right: 10, bottom: 10, left: 10 }, LETTER, 0, 1))
      .toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
  })

  it('shrinks an over-wide pair proportionally instead of picking a winner', () => {
    const m = clampMargins({ top: 0, right: 900, bottom: 0, left: 300 }, LETTER, 0, 12)
    expect(m.left + m.right).toBeCloseTo(600, 6)
    expect(m.right / m.left).toBeCloseTo(3, 6)
  })

  it('rejects negative input', () => {
    const m = clampMargins({ top: -50, right: 0, bottom: 0, left: 0 }, LETTER, 0)
    expect(m.top).toBe(0)
  })

  it('respects the rotated page size', () => {
    // 792 wide once displayed, so 700 of horizontal margin is legal here.
    const m = clampMargins({ top: 0, right: 350, bottom: 0, left: 350 }, LETTER, 90, 12)
    expect(m.left).toBe(350)
    expect(m.right).toBe(350)
  })

  it('never lets a crop collapse to nothing', () => {
    const m = clampMargins({ top: 5000, right: 5000, bottom: 5000, left: 5000 }, LETTER, 0, 12)
    const box = cropBoxFromMargins(LETTER, 0, m, 12)
    expect(box.width).toBeCloseTo(12, 6)
    expect(box.height).toBeCloseTo(12, 6)
  })
})

describe('fractions <-> margins', () => {
  it('round-trips', () => {
    const visual = { width: 612, height: 792 }
    const margins = { top: 79.2, right: 61.2, bottom: 158.4, left: 30.6 }
    const frac = fractionsFromMargins(margins, visual)
    expect(frac.x).toBeCloseTo(0.05, 6)
    expect(frac.y).toBeCloseTo(0.1, 6)
    expect(frac.w).toBeCloseTo(0.85, 6)
    expect(frac.h).toBeCloseTo(0.7, 6)
    const back = marginsFromFractions(frac, visual)
    expect(back.top).toBeCloseTo(margins.top, 6)
    expect(back.right).toBeCloseTo(margins.right, 6)
    expect(back.bottom).toBeCloseTo(margins.bottom, 6)
    expect(back.left).toBeCloseTo(margins.left, 6)
  })

  it('survives a zero-sized page without dividing by zero', () => {
    const frac = fractionsFromMargins({ top: 1, right: 1, bottom: 1, left: 1 }, { width: 0, height: 0 })
    expect(Number.isFinite(frac.x)).toBe(true)
    expect(Number.isFinite(frac.w)).toBe(true)
  })
})

describe('detectContentBounds', () => {
  // 10×10 white page with a dark 4×2 blot at (3,4).
  function page(fill) {
    const w = 10
    const h = 10
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) {
      data[i * 4] = 255
      data[i * 4 + 1] = 255
      data[i * 4 + 2] = 255
      data[i * 4 + 3] = 255
    }
    if (fill) fill(data, w)
    return { data, width: w, height: h }
  }

  it('finds the ink and ignores the white margin', () => {
    const img = page((data, w) => {
      for (let y = 4; y < 6; y++) {
        for (let x = 3; x < 7; x++) {
          const i = (y * w + x) * 4
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0
        }
      }
    })
    expect(detectContentBounds(img)).toEqual({ x: 0.3, y: 0.4, w: 0.4, h: 0.2 })
  })

  it('returns null for a blank page', () => {
    expect(detectContentBounds(page())).toBe(null)
  })

  it('treats transparent pixels as background', () => {
    const img = page((data, w) => {
      for (let i = 0; i < w * 10; i++) data[i * 4 + 3] = 0
    })
    expect(detectContentBounds(img)).toBe(null)
  })

  it('ignores faint paper texture below the threshold', () => {
    const img = page((data, w) => {
      const i = (2 * w + 2) * 4
      data[i] = 250; data[i + 1] = 250; data[i + 2] = 250
    })
    expect(detectContentBounds(img)).toBe(null)
  })

  it('handles an empty image object', () => {
    expect(detectContentBounds(null)).toBe(null)
    expect(detectContentBounds({ data: null, width: 5, height: 5 })).toBe(null)
  })
})

describe('padFractions', () => {
  it('grows the box by the pad on each side', () => {
    const out = padFractions({ x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, { width: 100, height: 100 }, 5)
    expect(out.x).toBeCloseTo(0.45, 6)
    expect(out.y).toBeCloseTo(0.45, 6)
    expect(out.w).toBeCloseTo(0.2, 6)
    expect(out.h).toBeCloseTo(0.2, 6)
  })

  it('stops at the page edge', () => {
    const out = padFractions({ x: 0, y: 0, w: 1, h: 1 }, { width: 100, height: 100 }, 20)
    expect(out).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })
})

describe('resolveCropScope', () => {
  it('returns just the current page', () => {
    expect(resolveCropScope('current', 3, 10, '', parsePageRange)).toEqual([3])
  })

  it('returns every page', () => {
    expect(resolveCropScope('all', 3, 4, '', parsePageRange)).toEqual([1, 2, 3, 4])
  })

  it('parses a range spec', () => {
    expect(resolveCropScope('range', 1, 10, '2,4-6', parsePageRange)).toEqual([2, 4, 5, 6])
  })

  it('falls back to the current page when the range is empty', () => {
    expect(resolveCropScope('range', 7, 10, '   ', parsePageRange)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(resolveCropScope('range', 7, 10, 'abc', parsePageRange)).toEqual([1])
  })

  it('clamps a current page outside the document', () => {
    expect(resolveCropScope('current', 99, 5, '', parsePageRange)).toEqual([5])
    expect(resolveCropScope('current', 0, 5, '', parsePageRange)).toEqual([1])
  })
})

describe('formatCropSize', () => {
  it('formats in the chosen unit', () => {
    expect(formatCropSize({ width: 612, height: 792 }, 'pt')).toBe('612 × 792 pt')
    expect(formatCropSize({ width: 612, height: 792 }, 'mm')).toBe('215.9 × 279.4 mm')
    expect(formatCropSize({ width: 612, height: 792 }, 'in')).toBe('8.50 × 11.00 in')
  })
})
