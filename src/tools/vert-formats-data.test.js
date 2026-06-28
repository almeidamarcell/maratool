import { describe, expect, test } from 'vitest'
import { IMAGE_FORMATS, FFMPEG_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS } from './vert-formats-data.js'
import { getCategory, getAllInputExtensions, CATEGORIES } from './vert-converter-core.js'

describe('VERT format registry parity', () => {
  test('image format count matches VERT reference', () => {
    expect(IMAGE_FORMATS.length).toBe(183)
  })

  test('ffmpeg format count matches VERT reference', () => {
    expect(FFMPEG_FORMATS.length).toBe(29)
  })

  test('video format count matches VERT reference', () => {
    expect(VIDEO_FORMATS.length).toBe(28)
  })

  test('document format count matches VERT reference', () => {
    expect(DOCUMENT_FORMATS.length).toBe(12)
  })

  test('all registered input extensions resolve to a category', () => {
    var inputs = getAllInputExtensions()
    expect(inputs.length).toBeGreaterThan(180)
    for (var i = 0; i < inputs.length; i++) {
      expect(getCategory(inputs[i]), inputs[i]).not.toBeNull()
    }
  })

  test('category output lists are non-empty', () => {
    expect(CATEGORIES.image.formats.length).toBeGreaterThan(100)
    expect(CATEGORIES.audio.formats.length).toBeGreaterThan(18)
    expect(CATEGORIES.video.formats.length).toBeGreaterThanOrEqual(26)
    expect(CATEGORIES.doc.formats.length).toBe(12)
  })
})
