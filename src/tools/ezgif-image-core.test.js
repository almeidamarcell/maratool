import { describe, it, expect } from 'vitest'
import {
  invertRgba,
  computeEnlargeDims,
  computeAspectPad,
  computeSpriteTiles,
  computeCollageCells,
  computeRoundedRadius,
  computePassportSize,
  buildDataUri,
  computeHalftoneCellSize,
  computeCensorRegion,
  formatImageOutputName,
  listPassportPresets,
  getPassportPreset,
  computeHeadGuide,
  computeCoverPlacement,
  resolveConvertTarget,
  formatConvertedName,
  clampQuality,
  formatTileName,
  computeImageDiff,
  formatDiffSummary,
  groupDigits,
} from './ezgif-image-core.js'

describe('invertRgba', () => {
  it('inverts RGB channels and preserves alpha', () => {
    const src = new Uint8ClampedArray([10, 20, 30, 255])
    const out = invertRgba(src)
    expect(out).toEqual(new Uint8ClampedArray([245, 235, 225, 255]))
    expect(src[0]).toBe(10)
  })
})

describe('computeEnlargeDims', () => {
  it('scales dimensions by percent clamped 100-400', () => {
    expect(computeEnlargeDims(100, 50, 200)).toEqual({ width: 200, height: 100 })
    expect(computeEnlargeDims(100, 50, 50)).toEqual({ width: 100, height: 50 })
    expect(computeEnlargeDims(100, 50, 500)).toEqual({ width: 400, height: 200 })
  })
})

describe('computeAspectPad', () => {
  it('pads image to target ratio in letterbox mode', () => {
    expect(computeAspectPad(800, 600, 16, 9, 'letterbox')).toEqual({
      canvasW: 1067,
      canvasH: 600,
      drawX: 134,
      drawY: 0,
      drawW: 800,
      drawH: 600,
    })
  })
  it('crops to fill target ratio', () => {
    const out = computeAspectPad(800, 600, 1, 1, 'crop')
    expect(out.canvasW).toBe(600)
    expect(out.canvasH).toBe(600)
  })
})

describe('computeSpriteTiles', () => {
  it('returns grid tile coordinates', () => {
    expect(computeSpriteTiles(400, 200, 2, 4)).toEqual([
      { x: 0, y: 0, w: 100, h: 100 },
      { x: 100, y: 0, w: 100, h: 100 },
      { x: 200, y: 0, w: 100, h: 100 },
      { x: 300, y: 0, w: 100, h: 100 },
      { x: 0, y: 100, w: 100, h: 100 },
      { x: 100, y: 100, w: 100, h: 100 },
      { x: 200, y: 100, w: 100, h: 100 },
      { x: 300, y: 100, w: 100, h: 100 },
    ])
  })
})

describe('computeCollageCells', () => {
  it('lays out horizontal collage positions', () => {
    const cells = computeCollageCells('horizontal', [
      { w: 100, h: 80 },
      { w: 120, h: 90 },
    ], 10)
    expect(cells).toEqual([
      { x: 0, y: 0, w: 100, h: 80 },
      { x: 110, y: 0, w: 120, h: 90 },
    ])
  })
})

describe('computeRoundedRadius', () => {
  it('clamps corner radius to half the shorter side', () => {
    expect(computeRoundedRadius(200, 100, 50)).toBe(50)
    expect(computeRoundedRadius(200, 100, 80)).toBe(50)
  })
})

describe('computePassportSize', () => {
  it('returns preset dimensions in pixels at 300 dpi', () => {
    expect(computePassportSize('us')).toEqual({ width: 600, height: 600 })
    expect(computePassportSize('eu')).toEqual({ width: 413, height: 531 })
  })
})

describe('buildDataUri', () => {
  it('builds a data URI from mime and base64', () => {
    expect(buildDataUri('image/png', 'abc123')).toBe('data:image/png;base64,abc123')
  })
})

describe('computeHalftoneCellSize', () => {
  it('derives dot cell size from image dimensions', () => {
    expect(computeHalftoneCellSize(400, 300, 40)).toBe(8)
  })
})

describe('computeCensorRegion', () => {
  it('clamps blur region inside image bounds', () => {
    expect(computeCensorRegion(100, 100, 30, 30, 30, 30)).toEqual({
      x: 30, y: 30, width: 30, height: 30,
    })
  })
})

describe('formatImageOutputName', () => {
  it('inserts suffix before extension', () => {
    expect(formatImageOutputName('photo.jpg', 'inverted', '.jpg')).toBe('photo-inverted.jpg')
  })
})

describe('resolveConvertTarget', () => {
  it('maps a target format name to its MIME type and extension', () => {
    expect(resolveConvertTarget('png')).toMatchObject({ mime: 'image/png', ext: '.png', lossy: false })
    expect(resolveConvertTarget('jpg')).toMatchObject({ mime: 'image/jpeg', ext: '.jpg', lossy: true })
    expect(resolveConvertTarget('jpeg')).toMatchObject({ mime: 'image/jpeg', ext: '.jpg' })
    expect(resolveConvertTarget('webp')).toMatchObject({ mime: 'image/webp', ext: '.webp' })
  })

  it('never returns the source format for an unknown target', () => {
    // The bug this replaces: the output MIME was read off the input file, so
    // "JPG to PNG" returned a JPEG. An unknown target falls back to PNG.
    expect(resolveConvertTarget(undefined).mime).toBe('image/png')
    expect(resolveConvertTarget('tiff').mime).toBe('image/png')
    expect(resolveConvertTarget('PNG').mime).toBe('image/png')
  })
})

describe('formatConvertedName', () => {
  it('replaces the extension instead of appending to it', () => {
    expect(formatConvertedName('photo.jpg', '.png')).toBe('photo.png')
    expect(formatConvertedName('shot.2024.05.03.jpeg', '.png')).toBe('shot.2024.05.03.png')
    expect(formatConvertedName('noext', '.jpg')).toBe('noext.jpg')
    expect(formatConvertedName('', '.png')).toBe('image.png')
    expect(formatConvertedName(null, '.png')).toBe('image.png')
  })

  it('leaves a leading-dot name alone', () => {
    expect(formatConvertedName('.hidden', '.png')).toBe('.hidden.png')
  })
})

describe('clampQuality', () => {
  it('turns a percent into a canvas quality between 0.3 and 1', () => {
    expect(clampQuality(90)).toBeCloseTo(0.9)
    expect(clampQuality(0)).toBe(0.3)
    expect(clampQuality(500)).toBe(1)
    expect(clampQuality('nope', 80)).toBeCloseTo(0.8)
  })
})

describe('formatTileName', () => {
  it('zero-pads to the width of the tile count', () => {
    expect(formatTileName('sheet.png', 0, 8)).toBe('sheet-1.png')
    expect(formatTileName('sheet.png', 0, 16)).toBe('sheet-01.png')
    expect(formatTileName('sheet.png', 15, 16)).toBe('sheet-16.png')
    expect(formatTileName('sheet.png', 9, 100)).toBe('sheet-010.png')
  })

  it('always writes .png regardless of the source extension', () => {
    expect(formatTileName('sheet.jpg', 2, 4)).toBe('sheet-3.png')
    expect(formatTileName(null, 0, 4)).toBe('sprite-1.png')
  })
})

describe('passport presets', () => {
  it('keeps the original two presets at their published pixel sizes', () => {
    expect(computePassportSize('us')).toEqual({ width: 600, height: 600 })
    expect(computePassportSize('eu')).toEqual({ width: 413, height: 531 })
  })

  it('exposes a labelled list for the picker', () => {
    const list = listPassportPresets()
    expect(list.length).toBeGreaterThanOrEqual(5)
    expect(list.map(p => p.id)).toContain('us')
    list.forEach(p => {
      expect(p.label).toBeTruthy()
      expect(p.width).toBeGreaterThan(0)
      expect(p.headMin).toBeLessThan(p.headMax)
      expect(p.eyeMin).toBeLessThan(p.eyeMax)
    })
  })

  it('falls back to US for an unknown preset', () => {
    expect(getPassportPreset('atlantis').id).toBe('us')
  })
})

describe('computeHeadGuide', () => {
  it('returns bands ordered crown, eyes, chin', () => {
    const g = computeHeadGuide('us')
    expect(g.headTopMin).toBeLessThan(g.headTopMax)
    expect(g.headTopMax).toBeLessThan(g.eyeBottom)
    expect(g.eyeTop).toBeLessThan(g.eyeBottom)
    expect(g.eyeBottom).toBeLessThan(g.chinMax)
    expect(g.chinMin).toBeLessThan(g.chinMax)
  })

  it('keeps every band inside the frame', () => {
    listPassportPresets().forEach(p => {
      const g = computeHeadGuide(p.id)
      Object.keys(g).forEach(k => {
        expect(g[k]).toBeGreaterThanOrEqual(0)
        expect(g[k]).toBeLessThanOrEqual(1)
      })
    })
  })

  it('puts the EU head band higher than the US one', () => {
    // ICAO asks for a noticeably larger head in the frame than the US spec.
    expect(computeHeadGuide('eu').headMin).toBeGreaterThan(computeHeadGuide('us').headMin)
  })
})

describe('computeCoverPlacement', () => {
  it('fills the frame instead of letterboxing', () => {
    const p = computeCoverPlacement(1000, 1000, 413, 531, 1, 0, 0)
    expect(p.drawW).toBeGreaterThanOrEqual(413)
    expect(p.drawH).toBeGreaterThanOrEqual(531)
    expect(p.drawX).toBeLessThanOrEqual(0)
    expect(p.drawY).toBeLessThanOrEqual(0)
  })

  it('centres the crop by default', () => {
    const p = computeCoverPlacement(2000, 1000, 600, 600, 1, 0, 0)
    expect(p.drawH).toBe(600)
    expect(p.drawW).toBe(1200)
    expect(p.drawX).toBe(-300)
    expect(p.drawY).toBe(0)
  })

  it('clamps a pan that would expose a blank edge', () => {
    const p = computeCoverPlacement(2000, 1000, 600, 600, 1, 99999, 99999)
    expect(p.drawX).toBe(0)
    expect(p.drawY).toBe(0)
    const q = computeCoverPlacement(2000, 1000, 600, 600, 1, -99999, -99999)
    expect(q.drawX).toBe(600 - q.drawW)
    expect(q.drawY).toBe(600 - q.drawH)
  })

  it('zooms about the current framing and clamps the factor', () => {
    const base = computeCoverPlacement(1000, 1000, 600, 600, 1, 0, 0)
    const zoomed = computeCoverPlacement(1000, 1000, 600, 600, 2, 0, 0)
    expect(zoomed.drawW).toBe(base.drawW * 2)
    expect(computeCoverPlacement(1000, 1000, 600, 600, 0.1, 0, 0).drawW).toBe(600)
    expect(computeCoverPlacement(1000, 1000, 600, 600, 99, 0, 0).drawW).toBe(2400)
  })
})

describe('computeImageDiff', () => {
  const px = (...vals) => new Uint8ClampedArray(vals)

  it('reports identical buffers as identical', () => {
    const a = px(10, 20, 30, 255, 40, 50, 60, 255)
    const out = computeImageDiff(a, px(...a))
    expect(out.identical).toBe(true)
    expect(out.changed).toBe(0)
    expect(out.maxDelta).toBe(0)
    expect(out.total).toBe(2)
  })

  it('counts pixels past the threshold and tracks the largest gap', () => {
    const a = px(0, 0, 0, 255, 0, 0, 0, 255)
    const b = px(0, 0, 3, 255, 90, 0, 0, 255)
    const out = computeImageDiff(a, b, { threshold: 8 })
    expect(out.changed).toBe(1)
    expect(out.maxDelta).toBe(90)
    expect(out.identical).toBe(false)
  })

  it('amplifies the visual difference but leaves it opaque', () => {
    const out = computeImageDiff(px(0, 0, 0, 255), px(10, 0, 0, 255), { amplify: 4 })
    expect(out.data[0]).toBe(40)
    expect(out.data[3]).toBe(255)
  })

  it('notices an alpha-only difference', () => {
    const out = computeImageDiff(px(0, 0, 0, 255), px(0, 0, 0, 0))
    expect(out.changed).toBe(1)
    expect(out.maxDelta).toBe(255)
  })

  it('compares only the overlapping region when the buffers differ in size', () => {
    const out = computeImageDiff(px(1, 1, 1, 255, 2, 2, 2, 255), px(1, 1, 1, 255))
    expect(out.total).toBe(1)
    expect(out.identical).toBe(true)
  })
})

describe('formatDiffSummary', () => {
  it('says plainly when nothing changed', () => {
    const s = formatDiffSummary({ changed: 0, total: 480000, maxDelta: 0, identical: true })
    expect(s).toBe('Pixel for pixel identical — all 480,000 pixels match.')
  })

  it('reports the count, share and largest gap', () => {
    const s = formatDiffSummary({ changed: 12345, total: 480000, maxDelta: 87, identical: false })
    expect(s).toBe('12,345 of 480,000 pixels differ (2.6%) · largest channel gap 87/255')
  })

  it('does not round a tiny share down to zero', () => {
    expect(formatDiffSummary({ changed: 3, total: 480000, maxDelta: 9, identical: false })).toContain('<0.1%')
  })

  it('warns when the two images are different sizes', () => {
    expect(formatDiffSummary({ changed: 0, total: 10, maxDelta: 0, identical: true }, true))
      .toMatch(/^The two images are different sizes/)
  })

  it('groups digits without depending on the host locale', () => {
    expect(groupDigits(1234567)).toBe('1,234,567')
    expect(groupDigits(999)).toBe('999')
  })
})
