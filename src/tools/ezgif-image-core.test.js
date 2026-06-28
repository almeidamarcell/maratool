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
