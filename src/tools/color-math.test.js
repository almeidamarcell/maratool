import { describe, it, expect } from 'vitest'
import {
  srgbToLinear, linearToSrgb,
  linearRgbToOklab, oklabToLinearRgb,
  oklabToOklch, oklchToOklab,
  hexToRgb, rgbToHex,
  rgbToHsl, hslToRgb,
  luminance, contrastRatio,
  generateShades,
  exportCssVariables, exportTailwindConfig, exportTailwindV4, exportDesignTokens,
  formatRgb, formatHsl, formatOklch
} from './color-math.js'

// ── sRGB ↔ Linear RGB ──

describe('srgbToLinear', () => {
  it('maps 0 to 0', () => {
    expect(srgbToLinear(0)).toBe(0)
  })

  it('maps 1 to 1', () => {
    expect(srgbToLinear(1)).toBe(1)
  })

  it('converts 0.5 to approximately 0.214', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.214, 2)
  })

  it('handles low values in linear region', () => {
    expect(srgbToLinear(0.04)).toBeCloseTo(0.04 / 12.92, 6)
  })
})

describe('linearToSrgb', () => {
  it('maps 0 to 0', () => {
    expect(linearToSrgb(0)).toBe(0)
  })

  it('maps 1 to 1', () => {
    expect(linearToSrgb(1)).toBeCloseTo(1, 6)
  })

  it('round-trips with srgbToLinear', () => {
    var values = [0, 0.1, 0.25, 0.5, 0.75, 1.0]
    values.forEach(function (v) {
      expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6)
    })
  })
})

// ── Linear RGB ↔ Oklab ──

describe('linearRgbToOklab', () => {
  it('converts white to L≈1, a≈0, b≈0', () => {
    var lab = linearRgbToOklab(1, 1, 1)
    expect(lab.L).toBeCloseTo(1, 2)
    expect(lab.a).toBeCloseTo(0, 2)
    expect(lab.b).toBeCloseTo(0, 2)
  })

  it('converts black to L≈0, a≈0, b≈0', () => {
    var lab = linearRgbToOklab(0, 0, 0)
    expect(lab.L).toBeCloseTo(0, 2)
    expect(lab.a).toBeCloseTo(0, 2)
    expect(lab.b).toBeCloseTo(0, 2)
  })

  it('converts pure red to known Oklab values', () => {
    var lab = linearRgbToOklab(1, 0, 0)
    expect(lab.L).toBeCloseTo(0.6279, 2)
    expect(lab.a).toBeCloseTo(0.2248, 2)
    expect(lab.b).toBeCloseTo(0.1258, 2)
  })
})

describe('oklabToLinearRgb', () => {
  it('converts white back to (1,1,1)', () => {
    var rgb = oklabToLinearRgb(1, 0, 0)
    expect(rgb.r).toBeCloseTo(1, 2)
    expect(rgb.g).toBeCloseTo(1, 2)
    expect(rgb.b).toBeCloseTo(1, 2)
  })

  it('round-trips with linearRgbToOklab', () => {
    var lab = linearRgbToOklab(0.5, 0.3, 0.7)
    var rgb = oklabToLinearRgb(lab.L, lab.a, lab.b)
    expect(rgb.r).toBeCloseTo(0.5, 4)
    expect(rgb.g).toBeCloseTo(0.3, 4)
    expect(rgb.b).toBeCloseTo(0.7, 4)
  })
})

// ── Oklab ↔ OKLCH ──

describe('oklabToOklch', () => {
  it('achromatic color has C≈0', () => {
    var lch = oklabToOklch(0.5, 0, 0)
    expect(lch.L).toBeCloseTo(0.5, 4)
    expect(lch.C).toBeCloseTo(0, 4)
  })

  it('computes correct chroma and hue', () => {
    var lch = oklabToOklch(0.5, 0.1, 0.1)
    expect(lch.C).toBeCloseTo(Math.sqrt(0.02), 4)
    expect(lch.H).toBeCloseTo(45, 1) // atan2(0.1, 0.1) = 45°
  })
})

describe('oklchToOklab', () => {
  it('round-trips with oklabToOklch', () => {
    var lch = oklabToOklch(0.7, 0.15, -0.05)
    var lab = oklchToOklab(lch.L, lch.C, lch.H)
    expect(lab.L).toBeCloseTo(0.7, 4)
    expect(lab.a).toBeCloseTo(0.15, 4)
    expect(lab.b).toBeCloseTo(-0.05, 4)
  })

  it('achromatic round-trip preserves L', () => {
    var lab = oklchToOklab(0.8, 0, 0)
    expect(lab.L).toBeCloseTo(0.8, 4)
    expect(lab.a).toBeCloseTo(0, 4)
    expect(lab.b).toBeCloseTo(0, 4)
  })
})

// ── HEX ↔ RGB ──

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('parses without hash', () => {
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('returns null for invalid hex', () => {
    expect(hexToRgb('xyz')).toBeNull()
    expect(hexToRgb('#gg0000')).toBeNull()
  })

  it('handles edge cases', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
  })
})

describe('rgbToHex', () => {
  it('converts to 6-digit hex with hash', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000')
  })

  it('pads single-digit hex values', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000')
  })

  it('clamps out-of-range values', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080')
  })
})

// ── RGB ↔ HSL ──

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    var hsl = rgbToHsl(255, 0, 0)
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it('converts gray', () => {
    var hsl = rgbToHsl(128, 128, 128)
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(50)
  })

  it('converts white', () => {
    var hsl = rgbToHsl(255, 255, 255)
    expect(hsl.l).toBe(100)
  })

  it('converts black', () => {
    var hsl = rgbToHsl(0, 0, 0)
    expect(hsl.l).toBe(0)
  })
})

describe('hslToRgb', () => {
  it('converts pure red', () => {
    expect(hslToRgb(0, 100, 50)).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('converts gray', () => {
    var rgb = hslToRgb(0, 0, 50)
    expect(rgb.r).toBe(128)
    expect(rgb.g).toBe(128)
    expect(rgb.b).toBe(128)
  })

  it('round-trips with rgbToHsl for saturated colors', () => {
    var hsl = rgbToHsl(45, 110, 246)
    var rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
    expect(rgb.r).toBeCloseTo(45, -1)
    expect(rgb.g).toBeCloseTo(110, -1)
    expect(rgb.b).toBeCloseTo(246, -1)
  })
})

// ── WCAG ──

describe('luminance', () => {
  it('white has luminance 1', () => {
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 4)
  })

  it('black has luminance 0', () => {
    expect(luminance(0, 0, 0)).toBeCloseTo(0, 4)
  })
})

describe('contrastRatio', () => {
  it('white vs black is 21:1', () => {
    var w = luminance(255, 255, 255)
    var b = luminance(0, 0, 0)
    expect(contrastRatio(w, b)).toBeCloseTo(21, 0)
  })

  it('same color has ratio 1:1', () => {
    var l = luminance(128, 128, 128)
    expect(contrastRatio(l, l)).toBeCloseTo(1, 4)
  })
})

// ── generateShades ──

describe('generateShades', () => {
  it('returns correct number of shades (default 11)', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    expect(shades).toHaveLength(11)
  })

  it('returns custom shade count', () => {
    var shades = generateShades('#2d6ef6', 5, 50, 'oklch')
    expect(shades).toHaveLength(5)
  })

  it('each shade has required fields', () => {
    var shades = generateShades('#ff0000', 11, 50, 'oklch')
    shades.forEach(function (shade) {
      expect(shade).toHaveProperty('step')
      expect(shade).toHaveProperty('hex')
      expect(shade).toHaveProperty('rgb')
      expect(shade).toHaveProperty('hsl')
      expect(shade).toHaveProperty('oklch')
    })
  })

  it('default steps are 50,100,200...900,950', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var steps = shades.map(function (s) { return s.step })
    expect(steps).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })

  it('shade 50 is lightest and 950 is darkest', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var first = shades[0]
    var last = shades[shades.length - 1]
    // Lighter = higher L in OKLCH
    expect(first.oklch.L).toBeGreaterThan(last.oklch.L)
  })

  it('all hex values are valid 6-digit codes', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    shades.forEach(function (shade) {
      expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  it('all RGB values are in 0-255 range (gamut mapped)', () => {
    var colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
    colors.forEach(function (color) {
      var shades = generateShades(color, 11, 50, 'oklch')
      shades.forEach(function (shade) {
        expect(shade.rgb.r).toBeGreaterThanOrEqual(0)
        expect(shade.rgb.r).toBeLessThanOrEqual(255)
        expect(shade.rgb.g).toBeGreaterThanOrEqual(0)
        expect(shade.rgb.g).toBeLessThanOrEqual(255)
        expect(shade.rgb.b).toBeGreaterThanOrEqual(0)
        expect(shade.rgb.b).toBeLessThanOrEqual(255)
      })
    })
  })

  it('higher contrast shift widens lightness range', () => {
    var low = generateShades('#2d6ef6', 11, 10, 'oklch')
    var high = generateShades('#2d6ef6', 11, 90, 'oklch')
    var lowRange = low[0].oklch.L - low[low.length - 1].oklch.L
    var highRange = high[0].oklch.L - high[high.length - 1].oklch.L
    expect(highRange).toBeGreaterThan(lowRange)
  })

  it('HSL algorithm produces valid results', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'hsl')
    expect(shades).toHaveLength(11)
    shades.forEach(function (shade) {
      expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  it('OKLCH and HSL algorithms produce different results', () => {
    var oklch = generateShades('#2d6ef6', 11, 50, 'oklch')
    var hsl = generateShades('#2d6ef6', 11, 50, 'hsl')
    // At least some shades should differ
    var diffs = oklch.filter(function (s, i) { return s.hex !== hsl[i].hex })
    expect(diffs.length).toBeGreaterThan(0)
  })

  it('handles pure white input', () => {
    var shades = generateShades('#ffffff', 11, 50, 'oklch')
    expect(shades).toHaveLength(11)
    shades.forEach(function (shade) {
      expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })

  it('handles pure black input', () => {
    var shades = generateShades('#000000', 11, 50, 'oklch')
    expect(shades).toHaveLength(11)
    shades.forEach(function (shade) {
      expect(shade.hex).toMatch(/^#[0-9a-f]{6}$/)
    })
  })
})

// ── Format helpers ──

describe('formatRgb', () => {
  it('formats rgb string', () => {
    expect(formatRgb({ r: 45, g: 110, b: 246 })).toBe('rgb(45, 110, 246)')
  })
})

describe('formatHsl', () => {
  it('formats hsl string', () => {
    expect(formatHsl({ h: 221, s: 92, l: 57 })).toBe('hsl(221, 92%, 57%)')
  })
})

describe('formatOklch', () => {
  it('formats oklch string', () => {
    var s = formatOklch({ L: 0.6503, C: 0.1500, H: 240.5 })
    expect(s).toBe('oklch(0.650 0.150 240.5)')
  })
})

// ── Export formatters ──

describe('exportCssVariables', () => {
  it('generates valid CSS custom properties', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var css = exportCssVariables('brand', shades)
    expect(css).toContain(':root {')
    expect(css).toContain('--brand-50:')
    expect(css).toContain('--brand-900:')
    expect(css).toContain('--brand-950:')
    expect(css).toContain('}')
  })

  it('uses the provided color name', () => {
    var shades = generateShades('#ff0000', 5, 50, 'oklch')
    var css = exportCssVariables('primary', shades)
    expect(css).toContain('--primary-')
  })
})

describe('exportTailwindConfig', () => {
  it('generates valid Tailwind v3 config object', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var tw = exportTailwindConfig('brand', shades)
    expect(tw).toContain("'brand':")
    expect(tw).toContain("'50':")
    expect(tw).toContain("'950':")
  })
})

describe('exportTailwindV4', () => {
  it('generates @theme block', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var tw4 = exportTailwindV4('brand', shades)
    expect(tw4).toContain('@theme {')
    expect(tw4).toContain('--color-brand-50:')
    expect(tw4).toContain('--color-brand-950:')
    expect(tw4).toContain('}')
  })
})

describe('exportDesignTokens', () => {
  it('generates valid JSON', () => {
    var shades = generateShades('#2d6ef6', 11, 50, 'oklch')
    var json = exportDesignTokens('brand', shades)
    var parsed = JSON.parse(json)
    expect(parsed).toHaveProperty('brand')
    expect(parsed.brand).toHaveProperty('50')
    expect(parsed.brand).toHaveProperty('950')
    expect(parsed.brand['50']).toHaveProperty('$value')
    expect(parsed.brand['50']).toHaveProperty('$type', 'color')
  })
})
