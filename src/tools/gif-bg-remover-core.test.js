import { describe, it, expect } from 'vitest'
import { hexToRgb, rgbToHex, colorDistance, isColorMatch, removeColorFromFrame, buildTransparentFrame, findOrAddTransparentIndex } from './gif-bg-remover-core.js'

describe('hexToRgb', () => {
  it('parses 6-char hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses 3-char hex shorthand', () => {
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses 3-char hex with color', () => {
    expect(hexToRgb('#f0f')).toEqual({ r: 255, g: 0, b: 255 })
  })

  it('parses without hash prefix', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('returns null for invalid input', () => {
    expect(hexToRgb('invalid')).toBe(null)
  })

  it('returns null for empty string', () => {
    expect(hexToRgb('')).toBe(null)
  })

  it('returns null for null', () => {
    expect(hexToRgb(null)).toBe(null)
  })
})

describe('rgbToHex', () => {
  it('converts red', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
  })

  it('converts black', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })

  it('converts white', () => {
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff')
  })

  it('pads single-digit hex values', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203')
  })
})

describe('colorDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(colorDistance(255, 0, 0, 255, 0, 0)).toBe(0)
  })

  it('returns max distance for black vs white', () => {
    var d = colorDistance(0, 0, 0, 255, 255, 255)
    expect(d).toBeCloseTo(Math.sqrt(3 * 255 * 255), 2)
  })

  it('returns 55 for single-channel difference', () => {
    expect(colorDistance(255, 0, 0, 200, 0, 0)).toBe(55)
  })
})

describe('isColorMatch', () => {
  it('matches identical colors at zero tolerance', () => {
    expect(isColorMatch(255, 0, 0, 255, 0, 0, 0)).toBe(true)
  })

  it('rejects different colors at zero tolerance', () => {
    expect(isColorMatch(255, 0, 0, 200, 0, 0, 0)).toBe(false)
  })

  it('matches similar colors within tolerance', () => {
    // distance 55, max ~441.67, so 55/441.67 ≈ 12.5% — tolerance 15 should match
    expect(isColorMatch(255, 0, 0, 200, 0, 0, 15)).toBe(true)
  })

  it('rejects colors outside tolerance', () => {
    // distance 55, tolerance 10 → threshold ~44.17 — should reject
    expect(isColorMatch(255, 0, 0, 200, 0, 0, 10)).toBe(false)
  })

  it('matches everything at tolerance 100', () => {
    expect(isColorMatch(0, 0, 0, 255, 255, 255, 100)).toBe(true)
  })
})

describe('removeColorFromFrame', () => {
  it('sets matching pixels alpha to 0', () => {
    // 2x1 image: red pixel, blue pixel
    var rgba = new Uint8ClampedArray([255,0,0,255, 0,0,255,255])
    var result = removeColorFromFrame(rgba, 2, 1, 255, 0, 0, 0)
    // red pixel becomes transparent
    expect(result[3]).toBe(0)
    // blue pixel unchanged
    expect(result[7]).toBe(255)
  })

  it('preserves non-matching pixels exactly', () => {
    var rgba = new Uint8ClampedArray([255,0,0,255, 0,128,255,255])
    var result = removeColorFromFrame(rgba, 2, 1, 255, 0, 0, 0)
    expect(result[4]).toBe(0)
    expect(result[5]).toBe(128)
    expect(result[6]).toBe(255)
    expect(result[7]).toBe(255)
  })

  it('makes all pixels transparent at tolerance 100', () => {
    var rgba = new Uint8ClampedArray([255,0,0,255, 0,0,255,255])
    var result = removeColorFromFrame(rgba, 2, 1, 128, 128, 128, 100)
    expect(result[3]).toBe(0)
    expect(result[7]).toBe(0)
  })

  it('leaves all pixels opaque when nothing matches', () => {
    var rgba = new Uint8ClampedArray([255,0,0,255, 0,0,255,255])
    var result = removeColorFromFrame(rgba, 2, 1, 0, 255, 0, 0)
    expect(result[3]).toBe(255)
    expect(result[7]).toBe(255)
  })
})

describe('findOrAddTransparentIndex', () => {
  it('appends transparent color when palette has room', () => {
    var palette = [[255,0,0], [0,255,0]]
    var idx = findOrAddTransparentIndex(palette)
    expect(idx).toBe(2)
    expect(palette.length).toBe(3)
  })

  it('replaces last entry when palette is full (256)', () => {
    var palette = []
    for (var i = 0; i < 256; i++) palette.push([i, i, i])
    var idx = findOrAddTransparentIndex(palette)
    expect(idx).toBe(255)
    expect(palette.length).toBe(256)
  })
})

describe('buildTransparentFrame', () => {
  it('maps matching pixels to transparent index', () => {
    // 2x1: red pixel, blue pixel. Target: red, tolerance 0
    var rgba = new Uint8ClampedArray([255,0,0,255, 0,0,255,255])
    var indexedData = new Uint8Array([0, 1]) // palette indices
    var result = buildTransparentFrame(indexedData, rgba, 2, 1, 255, 0, 0, 0, 99)
    expect(result[0]).toBe(99) // red → transparent index
    expect(result[1]).toBe(1)  // blue → unchanged
  })

  it('leaves non-matching pixels unchanged', () => {
    var rgba = new Uint8ClampedArray([0,255,0,255, 0,0,255,255])
    var indexedData = new Uint8Array([5, 10])
    var result = buildTransparentFrame(indexedData, rgba, 2, 1, 255, 0, 0, 0, 99)
    expect(result[0]).toBe(5)
    expect(result[1]).toBe(10)
  })
})
