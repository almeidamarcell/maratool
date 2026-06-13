import { describe, it, expect } from 'vitest'
import {
  validateQualityPreset,
  getCrfForPreset,
  buildCompressArgs,
  getOutputFilename,
  formatSavings,
} from './compress-video-core.js'

describe('validateQualityPreset', () => {
  it('accepts high', () => {
    expect(validateQualityPreset('high')).toEqual({ valid: true })
  })

  it('accepts balanced', () => {
    expect(validateQualityPreset('balanced')).toEqual({ valid: true })
  })

  it('accepts small', () => {
    expect(validateQualityPreset('small')).toEqual({ valid: true })
  })

  it('rejects unknown preset', () => {
    const r = validateQualityPreset('ultra')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/invalid/i)
  })

  it('rejects empty string', () => {
    expect(validateQualityPreset('').valid).toBe(false)
  })

  it('rejects null', () => {
    expect(validateQualityPreset(null).valid).toBe(false)
  })

  it('rejects undefined', () => {
    expect(validateQualityPreset(undefined).valid).toBe(false)
  })

  it('rejects a number', () => {
    expect(validateQualityPreset(26).valid).toBe(false)
  })
})

describe('getCrfForPreset', () => {
  it('returns 20 for high', () => {
    expect(getCrfForPreset('high')).toBe(20)
  })

  it('returns 26 for balanced', () => {
    expect(getCrfForPreset('balanced')).toBe(26)
  })

  it('returns 32 for small', () => {
    expect(getCrfForPreset('small')).toBe(32)
  })

  it('falls back to 26 for unknown preset', () => {
    expect(getCrfForPreset('unknown')).toBe(26)
  })
})

describe('buildCompressArgs', () => {
  it('returns exact arg array for crf 26', () => {
    expect(buildCompressArgs({ inputName: 'input.mp4', outputName: 'output.mp4', crf: 26 }))
      .toEqual([
        '-i', 'input.mp4',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '26',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y', 'output.mp4',
      ])
  })

  it('coerces crf to string', () => {
    const args = buildCompressArgs({ inputName: 'in.mp4', outputName: 'out.mp4', crf: 20 })
    const crfIdx = args.indexOf('-crf')
    expect(typeof args[crfIdx + 1]).toBe('string')
    expect(args[crfIdx + 1]).toBe('20')
  })

  it('uses libx264 and aac', () => {
    const args = buildCompressArgs({ inputName: 'in.mp4', outputName: 'out.mp4', crf: 32 })
    expect(args).toContain('libx264')
    expect(args).toContain('aac')
  })

  it('uses medium preset', () => {
    const args = buildCompressArgs({ inputName: 'in.mp4', outputName: 'out.mp4', crf: 26 })
    const presetIdx = args.indexOf('-preset')
    expect(args[presetIdx + 1]).toBe('medium')
  })
})

describe('getOutputFilename', () => {
  it('inserts -compressed before the extension', () => {
    expect(getOutputFilename('video.mp4')).toBe('video-compressed.mp4')
    expect(getOutputFilename('clip.webm')).toBe('clip-compressed.webm')
    expect(getOutputFilename('Movie.MOV')).toBe('Movie-compressed.MOV')
  })

  it('handles names with no extension', () => {
    expect(getOutputFilename('no-extension')).toBe('no-extension-compressed.mp4')
  })

  it('handles dot-files gracefully', () => {
    expect(getOutputFilename('.hidden')).toBe('.hidden-compressed.mp4')
  })

  it('returns a default for empty string', () => {
    expect(getOutputFilename('')).toBe('video-compressed.mp4')
  })

  it('returns a default for null', () => {
    expect(getOutputFilename(null)).toBe('video-compressed.mp4')
  })
})

describe('formatSavings', () => {
  it('returns saved percent when output is smaller', () => {
    const r = formatSavings(100, 53)
    expect(r.percent).toBe(47)
    expect(r.label).toBe('saved 47%')
  })

  it('returns saved 0% as no change when sizes are equal', () => {
    const r = formatSavings(100, 100)
    expect(r.label).toBe('no change')
  })

  it('returns increase label when output is larger', () => {
    const r = formatSavings(100, 120)
    expect(r.percent).toBeLessThan(0)
    expect(r.label).toMatch(/increased/i)
  })

  it('handles full compression to near zero', () => {
    const r = formatSavings(1000, 1)
    expect(r.percent).toBe(100)
    expect(r.label).toBe('saved 100%')
  })

  it('returns no change for invalid inputs', () => {
    expect(formatSavings(0, 50).label).toBe('no change')
    expect(formatSavings(100, 0).label).toBe('no change')
    expect(formatSavings(NaN, 50).label).toBe('no change')
    expect(formatSavings(100, NaN).label).toBe('no change')
  })
})
