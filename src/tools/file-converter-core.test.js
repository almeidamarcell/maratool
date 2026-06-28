/**
 * @vitest-environment jsdom
 */
import { describe, expect, test } from 'vitest'
import {
  normalizeExtension,
  detectExtension,
  getCategory,
  getFormatsForCategory,
  getAvailableOutputs,
  findEngine,
  canConvert,
  buildOutputFilename,
  getAllInputExtensions,
  getCategoryOutputTargets,
  CATEGORIES,
} from './file-converter-core.js'
import { IMAGE_FORMATS, FFMPEG_FORMATS, VIDEO_FORMATS, DOCUMENT_FORMATS } from './file-converter-formats.js'

describe('normalizeExtension', () => {
  test('adds leading dot and lowercases', () => {
    expect(normalizeExtension('PNG')).toBe('.png')
    expect(normalizeExtension('.JPEG')).toBe('.jpeg')
  })
})

describe('detectExtension', () => {
  test('extracts extension from filename', () => {
    expect(detectExtension('photo.JPG')).toBe('.jpg')
    expect(detectExtension('archive.tar.gz')).toBe('.gz')
  })
})

describe('format registry', () => {
  test('has expected format counts', () => {
    expect(IMAGE_FORMATS.length).toBeGreaterThanOrEqual(180)
    expect(FFMPEG_FORMATS.filter((f) => f.isNative && f.toSupported).length).toBeGreaterThanOrEqual(18)
    expect(VIDEO_FORMATS.filter((f) => f.toSupported).length).toBeGreaterThanOrEqual(26)
    expect(DOCUMENT_FORMATS.length).toBe(12)
  })
})

describe('getCategory', () => {
  test('classifies formats into categories', () => {
    expect(getCategory('.png')).toBe('image')
    expect(getCategory('.mp3')).toBe('audio')
    expect(getCategory('.mkv')).toBe('video')
    expect(getCategory('.docx')).toBe('doc')
  })
})

describe('getFormatsForCategory', () => {
  test('returns output-capable formats per category', () => {
    var imageOut = getFormatsForCategory('image')
    expect(imageOut).toContain('.png')
    expect(imageOut).toContain('.webp')
    var audioOut = getFormatsForCategory('audio')
    expect(audioOut).toContain('.mp3')
    expect(audioOut).toContain('.flac')
    var videoOut = getFormatsForCategory('video')
    expect(videoOut).toContain('.mp4')
    expect(videoOut).toContain('.webm')
    var docOut = getFormatsForCategory('doc')
    expect(docOut).toContain('.html')
    expect(docOut).toContain('.epub')
  })
})

describe('getAvailableOutputs', () => {
  test('excludes same format', () => {
    expect(getAvailableOutputs('.png')).not.toContain('.png')
    expect(getAvailableOutputs('.png')).toContain('.jpeg')
  })

  test('allows cross-category video to audio', () => {
    expect(getAvailableOutputs('.mp4')).toContain('.mp3')
  })

  test('allows cross-category audio to video', () => {
    expect(getAvailableOutputs('.mp3')).toContain('.mp4')
  })

  test('image inputs only offer image outputs', () => {
    var outs = getAvailableOutputs('.png')
    expect(outs.every((f) => getCategory(f) === 'image')).toBe(true)
  })
})

describe('findEngine', () => {
  test('routes image conversions to imagemagick', () => {
    expect(findEngine('.png', '.webp')).toBe('imagemagick')
  })

  test('routes document conversions to pandoc', () => {
    expect(findEngine('.docx', '.html')).toBe('pandoc')
  })

  test('routes audio to audio via ffmpeg', () => {
    expect(findEngine('.wav', '.mp3')).toBe('ffmpeg')
  })

  test('routes video to audio via ffmpeg', () => {
    expect(findEngine('.mp4', '.mp3')).toBe('ffmpeg')
  })

  test('routes video to video via ffmpeg (browser vertd substitute)', () => {
    expect(findEngine('.mov', '.mp4')).toBe('ffmpeg')
  })
})

describe('canConvert', () => {
  test('rejects unsupported pairs', () => {
    expect(canConvert('.png', '.mp3')).toBe(false)
    expect(canConvert('.docx', '.png')).toBe(false)
  })

  test('accepts supported conversion pairs', () => {
    expect(canConvert('.heic', '.png')).toBe(true)
    expect(canConvert('.epub', '.md')).toBe(true)
    expect(canConvert('.flac', '.ogg')).toBe(true)
    expect(canConvert('.avi', '.webm')).toBe(true)
  })
})

describe('buildOutputFilename', () => {
  test('replaces extension', () => {
    expect(buildOutputFilename('vacation.MOV', '.mp4')).toBe('vacation.mp4')
    expect(buildOutputFilename('song.flac', '.mp3')).toBe('song.mp3')
  })
})

describe('getAllInputExtensions', () => {
  test('includes formats from all categories', () => {
    var all = getAllInputExtensions()
    expect(all).toContain('.png')
    expect(all).toContain('.mp3')
    expect(all).toContain('.mkv')
    expect(all).toContain('.docx')
  })
})

describe('getCategoryOutputTargets', () => {
  test('video category can convert to audio', () => {
    expect(getCategoryOutputTargets('video')).toContain('audio')
    expect(getCategoryOutputTargets('audio')).toContain('video')
    expect(getCategoryOutputTargets('image')).toEqual([])
  })

  test('CATEGORIES defines cross-category rules', () => {
    expect(CATEGORIES.video.canConvertTo).toContain('audio')
    expect(CATEGORIES.audio.canConvertTo).toContain('video')
  })
})
