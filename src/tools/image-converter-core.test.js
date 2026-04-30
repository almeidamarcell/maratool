import { describe, test, expect } from 'vitest'
import {
  isHeic,
  getOutputExtension,
  getTargetDimension,
  stripExtension,
} from './image-converter-core.js'

describe('isHeic', () => {
  test('detects .heic extension', () => {
    expect(isHeic({ name: 'photo.heic', type: '' })).toBe(true)
  })
  test('detects .heif extension', () => {
    expect(isHeic({ name: 'photo.heif', type: '' })).toBe(true)
  })
  test('detects uppercase .HEIC extension', () => {
    expect(isHeic({ name: 'IMG_1139.HEIC', type: '' })).toBe(true)
  })
  test('detects mixed-case .Heic extension', () => {
    expect(isHeic({ name: 'photo.Heic', type: '' })).toBe(true)
  })
  test('detects image/heic MIME type', () => {
    expect(isHeic({ name: 'photo', type: 'image/heic' })).toBe(true)
  })
  test('detects image/heif MIME type', () => {
    expect(isHeic({ name: 'photo', type: 'image/heif' })).toBe(true)
  })
  test('detects image/heic-sequence MIME type', () => {
    expect(isHeic({ name: 'photo', type: 'image/heic-sequence' })).toBe(true)
  })
  test('detects image/heif-sequence MIME type', () => {
    expect(isHeic({ name: 'photo', type: 'image/heif-sequence' })).toBe(true)
  })
  test('detects MIME type with mixed case', () => {
    expect(isHeic({ name: 'photo', type: 'IMAGE/HEIC' })).toBe(true)
  })
  test('rejects PNG file', () => {
    expect(isHeic({ name: 'photo.png', type: 'image/png' })).toBe(false)
  })
  test('rejects JPEG file', () => {
    expect(isHeic({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false)
  })
  test('rejects WebP file', () => {
    expect(isHeic({ name: 'photo.webp', type: 'image/webp' })).toBe(false)
  })
  test('rejects file with .heic in middle of name but .png extension', () => {
    expect(isHeic({ name: 'my.heic.png', type: 'image/png' })).toBe(false)
  })
  test('rejects file with no name and no type', () => {
    expect(isHeic({ name: '', type: '' })).toBe(false)
  })
  test('rejects null file', () => {
    expect(isHeic(null)).toBe(false)
  })
  test('rejects undefined file', () => {
    expect(isHeic(undefined)).toBe(false)
  })
  test('handles missing name field', () => {
    expect(isHeic({ type: 'image/heic' })).toBe(true)
  })
  test('handles missing type field', () => {
    expect(isHeic({ name: 'photo.heic' })).toBe(true)
  })
})

describe('getOutputExtension', () => {
  test('maps image/png to png', () => {
    expect(getOutputExtension('image/png')).toBe('png')
  })
  test('maps image/jpeg to jpg', () => {
    expect(getOutputExtension('image/jpeg')).toBe('jpg')
  })
  test('maps image/webp to webp', () => {
    expect(getOutputExtension('image/webp')).toBe('webp')
  })
  test('maps image/avif to avif', () => {
    expect(getOutputExtension('image/avif')).toBe('avif')
  })
  test('falls back to png for unknown MIME', () => {
    expect(getOutputExtension('image/gif')).toBe('png')
  })
  test('falls back to png for empty input', () => {
    expect(getOutputExtension('')).toBe('png')
  })
  test('falls back to png for undefined', () => {
    expect(getOutputExtension(undefined)).toBe('png')
  })
})

describe('getTargetDimension', () => {
  test('returns parsed positive integer', () => {
    expect(getTargetDimension('800', 1024)).toBe(800)
  })
  test('returns number input', () => {
    expect(getTargetDimension(640, 1024)).toBe(640)
  })
  test('returns fallback for empty string', () => {
    expect(getTargetDimension('', 1024)).toBe(1024)
  })
  test('returns fallback for null', () => {
    expect(getTargetDimension(null, 1024)).toBe(1024)
  })
  test('returns fallback for undefined', () => {
    expect(getTargetDimension(undefined, 1024)).toBe(1024)
  })
  test('returns fallback for zero', () => {
    expect(getTargetDimension('0', 1024)).toBe(1024)
  })
  test('returns fallback for negative numbers', () => {
    expect(getTargetDimension('-100', 1024)).toBe(1024)
  })
  test('returns fallback for non-numeric strings', () => {
    expect(getTargetDimension('abc', 1024)).toBe(1024)
  })
  test('parses decimal as integer (truncates)', () => {
    expect(getTargetDimension('800.7', 1024)).toBe(800)
  })
})

describe('stripExtension', () => {
  test('removes single extension', () => {
    expect(stripExtension('photo.heic')).toBe('photo')
  })
  test('removes only the last extension on dotted names', () => {
    expect(stripExtension('my.photo.heic')).toBe('my.photo')
  })
  test('returns input unchanged when no extension', () => {
    expect(stripExtension('photo')).toBe('photo')
  })
  test('handles empty string', () => {
    expect(stripExtension('')).toBe('')
  })
  test('handles undefined', () => {
    expect(stripExtension(undefined)).toBe('')
  })
  test('handles null', () => {
    expect(stripExtension(null)).toBe('')
  })
  test('preserves uppercase basename', () => {
    expect(stripExtension('IMG_1139.HEIC')).toBe('IMG_1139')
  })
})
