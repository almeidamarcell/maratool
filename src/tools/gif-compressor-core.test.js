import { describe, it, expect } from 'vitest'
import {
  PRESETS,
  validatePreset,
  getPresetSettings,
  validateColors,
  validateScale,
  validateSkip,
  computeScaledDims,
  selectFrameIndices,
  mergeDelays,
  getOutputFilename,
  formatSavings,
} from './gif-compressor-core.js'

describe('presets', () => {
  it('exposes light, balanced, strong', () => {
    expect(Object.keys(PRESETS).sort()).toEqual(['balanced', 'light', 'strong'])
  })
  it('validatePreset accepts known presets, rejects others', () => {
    expect(validatePreset('light')).toBe(true)
    expect(validatePreset('balanced')).toBe(true)
    expect(validatePreset('strong')).toBe(true)
    expect(validatePreset('extreme')).toBe(false)
    expect(validatePreset('')).toBe(false)
  })
  it('getPresetSettings returns colors/scale/skip', () => {
    expect(getPresetSettings('light')).toEqual({ colors: 128, scale: 100, skip: 1 })
    expect(getPresetSettings('balanced')).toEqual({ colors: 64, scale: 100, skip: 1 })
    expect(getPresetSettings('strong')).toEqual({ colors: 32, scale: 75, skip: 2 })
    expect(getPresetSettings('nope')).toBe(null)
  })
  it('every preset uses a color count that quantizes (< 256)', () => {
    Object.keys(PRESETS).forEach((key) => {
      expect(getPresetSettings(key).colors).toBeLessThan(256)
    })
  })
})

describe('option validators', () => {
  it('validateColors', () => {
    expect(validateColors(256)).toBe(true)
    expect(validateColors('64')).toBe(true)
    expect(validateColors(100)).toBe(false)
    expect(validateColors(16)).toBe(false)
  })
  it('validateScale', () => {
    expect(validateScale(100)).toBe(true)
    expect(validateScale('50')).toBe(true)
    expect(validateScale(33)).toBe(false)
  })
  it('validateSkip', () => {
    expect(validateSkip(1)).toBe(true)
    expect(validateSkip(3)).toBe(true)
    expect(validateSkip(4)).toBe(false)
  })
})

describe('computeScaledDims', () => {
  it('keeps dimensions at 100%', () => {
    expect(computeScaledDims(480, 320, 100)).toEqual({ width: 480, height: 320 })
  })
  it('scales down by percentage and rounds', () => {
    expect(computeScaledDims(480, 320, 50)).toEqual({ width: 240, height: 160 })
    expect(computeScaledDims(481, 321, 50)).toEqual({ width: 241, height: 161 }) // 240.5→241, 160.5→161
  })
  it('never goes below 1px', () => {
    expect(computeScaledDims(1, 1, 50)).toEqual({ width: 1, height: 1 })
  })
  it('treats missing/over-100 scale as no-op', () => {
    expect(computeScaledDims(100, 100, 120)).toEqual({ width: 100, height: 100 })
    expect(computeScaledDims(100, 100, 0)).toEqual({ width: 100, height: 100 })
  })
})

describe('selectFrameIndices', () => {
  it('keeps all frames when skip is 1', () => {
    expect(selectFrameIndices(5, 1)).toEqual([0, 1, 2, 3, 4])
  })
  it('keeps every 2nd frame', () => {
    expect(selectFrameIndices(6, 2)).toEqual([0, 2, 4])
  })
  it('keeps every 3rd frame', () => {
    expect(selectFrameIndices(7, 3)).toEqual([0, 3, 6])
  })
  it('handles skip <= 1 as keep-all', () => {
    expect(selectFrameIndices(3, 0)).toEqual([0, 1, 2])
  })
})

describe('mergeDelays', () => {
  it('returns a copy when skip is 1', () => {
    const d = [10, 20, 30]
    const out = mergeDelays(d, 1)
    expect(out).toEqual([10, 20, 30])
    expect(out).not.toBe(d)
  })
  it('sums dropped frames into the kept frame (preserves duration)', () => {
    // total = 100; kept frames must still sum to 100
    expect(mergeDelays([10, 20, 30, 40], 2)).toEqual([30, 70])
    expect(mergeDelays([10, 20, 30, 40], 2).reduce((a, b) => a + b, 0)).toBe(100)
  })
  it('handles a trailing partial group', () => {
    expect(mergeDelays([10, 10, 10, 10, 10], 2)).toEqual([20, 20, 10])
  })
  it('handles skip of 3', () => {
    expect(mergeDelays([5, 5, 5, 5, 5, 5], 3)).toEqual([15, 15])
  })
})

describe('getOutputFilename', () => {
  it('inserts -compressed before .gif', () => {
    expect(getOutputFilename('party.gif')).toBe('party-compressed.gif')
    expect(getOutputFilename('LOUD.GIF')).toBe('LOUD-compressed.gif')
  })
  it('handles names without .gif extension', () => {
    expect(getOutputFilename('animation')).toBe('animation-compressed.gif')
    expect(getOutputFilename('cat.v2.gif')).toBe('cat.v2-compressed.gif')
  })
  it('returns default for empty/null', () => {
    expect(getOutputFilename('')).toBe('compressed.gif')
    expect(getOutputFilename(null)).toBe('compressed.gif')
  })
})

describe('formatSavings', () => {
  it('reports positive savings when smaller', () => {
    expect(formatSavings(1000, 530)).toEqual({ percent: 47, label: 'saved 47%' })
  })
  it('reports larger when bigger', () => {
    expect(formatSavings(1000, 1100)).toEqual({ percent: -10, label: '10% larger' })
  })
  it('reports no change at equal sizes', () => {
    expect(formatSavings(1000, 1000)).toEqual({ percent: 0, label: 'no change' })
  })
  it('guards against zero original', () => {
    expect(formatSavings(0, 100)).toEqual({ percent: 0, label: 'no change' })
  })
})
