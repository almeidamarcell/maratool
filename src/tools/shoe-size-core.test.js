import { describe, it, expect } from 'vitest'
import {
  roundHalf,
  round1,
  footLengthToSizes,
  sizeToFootLength,
  parseSizeInput,
  referenceRows,
  SYSTEMS,
  CATEGORIES,
} from './shoe-size-core.js'

describe('rounding helpers', () => {
  it('roundHalf snaps to nearest 0.5', () => {
    expect(roundHalf(7.2)).toBe(7)
    expect(roundHalf(7.3)).toBe(7.5)
    expect(roundHalf(7.75)).toBe(8)
  })
  it('round1 keeps one decimal', () => {
    expect(round1(25.44)).toBe(25.4)
    expect(round1(25.46)).toBe(25.5)
  })
})

describe('footLengthToSizes — anchors', () => {
  it('rejects non-positive input', () => {
    expect(footLengthToSizes(0, 'men')).toBeNull()
    expect(footLengthToSizes(-5, 'men')).toBeNull()
  })

  it('Brannock US standard: US men 10 = UK 9 = EU 42.5 ≈ 27 cm foot', () => {
    const s = footLengthToSizes(270, 'men')
    expect(s.us).toBe(10)
    expect(s.uk).toBe(9)
    expect(s.eu).toBe(42.5)
    expect(s.cm).toBe(27)
    expect(s.mondopoint).toBe(270)
  })

  it('US men = UK + 1 (Brannock)', () => {
    const s = footLengthToSizes(255, 'men')
    expect(s.us - s.uk).toBe(1)
  })

  it('cm and inch track the physical foot length', () => {
    const s = footLengthToSizes(254, 'men')
    expect(s.cm).toBe(25.4)
    expect(s.inch).toBe(10) // 254 mm = exactly 10 inches
  })

  it('BR runs ~2 points below EU', () => {
    const s = footLengthToSizes(260, 'men')
    expect(s.eu - s.br).toBeGreaterThanOrEqual(1.5)
    expect(s.eu - s.br).toBeLessThanOrEqual(2.5)
  })

  it('AU men equals UK men', () => {
    const s = footLengthToSizes(265, 'men')
    expect(s.au).toBe(s.uk)
  })
})

describe('footLengthToSizes — gender relationships', () => {
  it('women US runs 1 above men US for the same foot (Brannock)', () => {
    const men = footLengthToSizes(255, 'men')
    const women = footLengthToSizes(255, 'women')
    expect(women.us - men.us).toBe(1)
  })

  it('EU/cm/BR are unisex (identical across men and women)', () => {
    const men = footLengthToSizes(255, 'men')
    const women = footLengthToSizes(255, 'women')
    expect(women.eu).toBe(men.eu)
    expect(women.cm).toBe(men.cm)
    expect(women.br).toBe(men.br)
  })

  it('kids US/UK use child/youth labels', () => {
    const s = footLengthToSizes(160, 'kids')
    expect(typeof s.us).toBe('string')
    expect(s.us).toMatch(/^[0-9.]+(C|Y)$/)
  })
})

describe('every category exposes every numeric system', () => {
  for (const cat of CATEGORIES) {
    it(`${cat} returns all systems`, () => {
      const s = footLengthToSizes(240, cat)
      for (const sys of SYSTEMS) {
        expect(s[sys], `${cat}.${sys}`).toBeDefined()
      }
    })
  }
})

describe('sizeToFootLength — round trips', () => {
  const cases = [
    ['us', 9, 'men'],
    ['uk', 8, 'men'],
    ['eu', 42, 'men'],
    ['br', 40, 'men'],
    ['mx', 6, 'men'],
    ['cm', 26, 'men'],
    ['inch', 10, 'men'],
    ['mondopoint', 260, 'men'],
    ['jp', 26, 'men'],
    ['us', 8, 'women'],
    ['eu', 39, 'women'],
  ]
  for (const [system, size, cat] of cases) {
    it(`${cat} ${system} ${size} round-trips`, () => {
      const mm = sizeToFootLength(system, size, cat)
      expect(mm).toBeGreaterThan(0)
      const back = footLengthToSizes(mm, cat)
      expect(back[system]).toBe(size)
    })
  }

  it('returns null for garbage input', () => {
    expect(sizeToFootLength('us', 'abc', 'men')).toBeNull()
    expect(sizeToFootLength('cm', -3, 'men')).toBeNull()
  })
})

describe('parseSizeInput', () => {
  it('parses plain numbers', () => {
    expect(parseSizeInput('eu', '42', 'men')).toBe(42)
    expect(parseSizeInput('cm', '26,5', 'men')).toBe(26.5)
  })
  it('parses kids child (C) and youth (Y) labels', () => {
    expect(parseSizeInput('us', '13C', 'kids')).toBe(13)
    expect(parseSizeInput('us', '1Y', 'kids')).toBe(14)
    expect(parseSizeInput('us', '2.5Y', 'kids')).toBe(15.5)
  })
  it('returns null for empty/garbage', () => {
    expect(parseSizeInput('eu', '', 'men')).toBeNull()
    expect(parseSizeInput('eu', 'abc', 'men')).toBeNull()
  })
})

describe('kids label round-trips through parse + convert', () => {
  const cases = [
    ['us', '13C'],
    ['us', '1Y'],
    ['uk', '12C'],
    ['eu', 30],
    ['cm', 18],
  ]
  for (const [system, label] of cases) {
    it(`kids ${system} ${label} survives round trip`, () => {
      const v = parseSizeInput(system, label, 'kids')
      const mm = sizeToFootLength(system, v, 'kids')
      expect(mm).toBeGreaterThan(0)
      const back = footLengthToSizes(mm, 'kids')
      expect(String(back[system])).toBe(String(label))
    })
  }
})

describe('sneaker fit (Nike/Puma convention)', () => {
  it('sneaker women run 1.5 above men (vs 1 in standard)', () => {
    const std = footLengthToSizes(255, 'women', 'standard')
    const snk = footLengthToSizes(255, 'women', 'sneaker')
    const men = footLengthToSizes(255, 'men', 'standard')
    expect(std.us - men.us).toBe(1)
    expect(snk.us - men.us).toBe(1.5)
  })

  it('sneaker EU runs one point above standard (Nike: US men 8 = EU 41 @ 25.4 cm)', () => {
    const std = footLengthToSizes(254, 'men', 'standard')
    const snk = footLengthToSizes(254, 'men', 'sneaker')
    expect(std.eu).toBe(40)
    expect(snk.eu).toBe(41)
    expect(snk.us).toBe(std.us) // men's US mapping is identical across fits
  })

  it('sneaker BR follows the shifted EU', () => {
    const snk = footLengthToSizes(254, 'men', 'sneaker')
    expect(snk.br).toBe(snk.eu - 2)
  })

  it('sneaker round-trips', () => {
    const mm = sizeToFootLength('eu', 42, 'men', 'sneaker')
    expect(footLengthToSizes(mm, 'men', 'sneaker').eu).toBe(42)
    const mmW = sizeToFootLength('us', 9.5, 'women', 'sneaker')
    expect(footLengthToSizes(mmW, 'women', 'sneaker').us).toBe(9.5)
  })

  it('standard is the default when fit is omitted', () => {
    expect(footLengthToSizes(254, 'men').eu).toBe(footLengthToSizes(254, 'men', 'standard').eu)
  })
})

describe('referenceRows', () => {
  for (const cat of CATEGORIES) {
    it(`${cat} chart is non-empty and EU-monotonic`, () => {
      const rows = referenceRows(cat)
      expect(rows.length).toBeGreaterThan(5)
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].eu).toBeGreaterThan(rows[i - 1].eu)
        expect(rows[i].cm).toBeGreaterThan(rows[i - 1].cm)
      }
    })
  }
})
