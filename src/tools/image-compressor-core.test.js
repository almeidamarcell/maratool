import { describe, it, expect } from 'vitest'
import { validateQuality, calculateDimensions, formatBytes, compressionRatio, getOutputMime } from './image-compressor-core.js'

describe('validateQuality', () => {
  it('accepts valid quality', () => {
    expect(validateQuality(80)).toEqual({ valid: true, value: 80 })
  })

  it('rejects out of range', () => {
    expect(validateQuality(0).valid).toBe(false)
    expect(validateQuality(101).valid).toBe(false)
  })
})

describe('calculateDimensions', () => {
  it('returns original size at 100%', () => {
    expect(calculateDimensions(800, 600, 100)).toEqual({ width: 800, height: 600 })
  })

  it('scales down at 50%', () => {
    expect(calculateDimensions(800, 600, 50)).toEqual({ width: 400, height: 300 })
  })
})

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
  })
})

describe('compressionRatio', () => {
  it('calculates savings percentage', () => {
    expect(compressionRatio(1000, 400)).toBe(60)
  })
})

describe('getOutputMime', () => {
  it('returns correct mime types', () => {
    expect(getOutputMime('jpeg')).toBe('image/jpeg')
    expect(getOutputMime('png')).toBe('image/png')
    expect(getOutputMime('webp')).toBe('image/webp')
  })
})
