import { describe, it, expect } from 'vitest'
import {
  validateMediaFile,
  buildAudioExtractArgs,
  formatTimestamp,
  normalizeChunks,
  toSRT,
  toVTT,
  toPlainText,
  getOutputFilename,
  LANGUAGES,
  isSupportedLanguage,
  resolveLanguage,
} from './video-to-text-core.js'

describe('validateMediaFile', () => {
  it('accepts video files', () => {
    expect(validateMediaFile({ type: 'video/mp4' })).toEqual({ valid: true })
    expect(validateMediaFile({ type: 'video/webm' })).toEqual({ valid: true })
    expect(validateMediaFile({ type: 'video/quicktime' })).toEqual({ valid: true })
  })

  it('accepts audio files', () => {
    expect(validateMediaFile({ type: 'audio/mpeg' })).toEqual({ valid: true })
    expect(validateMediaFile({ type: 'audio/wav' })).toEqual({ valid: true })
    expect(validateMediaFile({ type: 'audio/mp4' })).toEqual({ valid: true })
  })

  it('rejects non-media files', () => {
    expect(validateMediaFile({ type: 'image/png' }).valid).toBe(false)
    expect(validateMediaFile({ type: 'application/pdf' }).valid).toBe(false)
    expect(validateMediaFile({ type: 'text/plain' }).valid).toBe(false)
  })

  it('rejects missing / typeless files', () => {
    expect(validateMediaFile(null).valid).toBe(false)
    expect(validateMediaFile(undefined).valid).toBe(false)
    expect(validateMediaFile({ type: '' }).valid).toBe(false)
    expect(validateMediaFile({}).valid).toBe(false)
  })
})

describe('buildAudioExtractArgs', () => {
  it('extracts 16 kHz mono PCM WAV (the format Whisper expects)', () => {
    expect(buildAudioExtractArgs('input.mp4', 'audio.wav')).toEqual([
      '-i', 'input.mp4', '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', '-y', 'audio.wav',
    ])
  })

  it('works regardless of source container', () => {
    expect(buildAudioExtractArgs('clip.mov', 'out.wav')).toEqual([
      '-i', 'clip.mov', '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', '-y', 'out.wav',
    ])
  })
})

describe('formatTimestamp', () => {
  it('formats zero', () => {
    expect(formatTimestamp(0, { comma: true })).toBe('00:00:00,000')
    expect(formatTimestamp(0, { comma: false })).toBe('00:00:00.000')
  })

  it('formats sub-second milliseconds', () => {
    expect(formatTimestamp(1.24, { comma: true })).toBe('00:00:01,240')
  })

  it('formats minutes and seconds', () => {
    expect(formatTimestamp(61.5, { comma: true })).toBe('00:01:01,500')
  })

  it('formats hours', () => {
    expect(formatTimestamp(3661.008, { comma: true })).toBe('01:01:01,008')
  })

  it('uses a dot separator for VTT', () => {
    expect(formatTimestamp(3661.008, { comma: false })).toBe('01:01:01.008')
  })

  it('rounds to the nearest millisecond without drifting seconds', () => {
    expect(formatTimestamp(2.9999, { comma: true })).toBe('00:00:03,000')
  })
})

describe('normalizeChunks', () => {
  it('trims text and maps [start,end] timestamps to {start,end,text}', () => {
    const chunks = [
      { text: ' Hello', timestamp: [0, 1.2] },
      { text: ' world.', timestamp: [1.2, 2.5] },
    ]
    expect(normalizeChunks(chunks)).toEqual([
      { start: 0, end: 1.2, text: 'Hello' },
      { start: 1.2, end: 2.5, text: 'world.' },
    ])
  })

  it('drops empty / whitespace-only chunks', () => {
    const chunks = [
      { text: ' Hi', timestamp: [0, 1] },
      { text: '   ', timestamp: [1, 1.1] },
      { text: '', timestamp: [1.1, 1.2] },
    ]
    expect(normalizeChunks(chunks)).toEqual([{ start: 0, end: 1, text: 'Hi' }])
  })

  it('falls back to the next chunk start when end timestamp is null', () => {
    const chunks = [
      { text: ' A', timestamp: [0, null] },
      { text: ' B', timestamp: [2, 3] },
    ]
    expect(normalizeChunks(chunks)).toEqual([
      { start: 0, end: 2, text: 'A' },
      { start: 2, end: 3, text: 'B' },
    ])
  })

  it('falls back to start when the final end timestamp is null', () => {
    const chunks = [{ text: ' End', timestamp: [4, null] }]
    expect(normalizeChunks(chunks)).toEqual([{ start: 4, end: 4, text: 'End' }])
  })

  it('returns [] for missing input', () => {
    expect(normalizeChunks(null)).toEqual([])
    expect(normalizeChunks(undefined)).toEqual([])
    expect(normalizeChunks([])).toEqual([])
  })
})

describe('toSRT', () => {
  it('produces numbered SRT cues with comma timestamps', () => {
    const chunks = [
      { start: 0, end: 1.2, text: 'Hello' },
      { start: 1.2, end: 2.5, text: 'world.' },
    ]
    expect(toSRT(chunks)).toBe(
      '1\n00:00:00,000 --> 00:00:01,200\nHello\n\n' +
      '2\n00:00:01,200 --> 00:00:02,500\nworld.'
    )
  })
})

describe('toVTT', () => {
  it('produces a WEBVTT file with dot timestamps', () => {
    const chunks = [
      { start: 0, end: 1.2, text: 'Hello' },
      { start: 1.2, end: 2.5, text: 'world.' },
    ]
    expect(toVTT(chunks)).toBe(
      'WEBVTT\n\n' +
      '00:00:00.000 --> 00:00:01.200\nHello\n\n' +
      '00:00:01.200 --> 00:00:02.500\nworld.'
    )
  })
})

describe('toPlainText', () => {
  it('joins chunk text with single spaces', () => {
    const chunks = [
      { start: 0, end: 1, text: 'Hello' },
      { start: 1, end: 2, text: 'world.' },
    ]
    expect(toPlainText(chunks)).toBe('Hello world.')
  })

  it('returns an empty string for no chunks', () => {
    expect(toPlainText([])).toBe('')
  })
})

describe('getOutputFilename', () => {
  it('swaps the extension for the requested one', () => {
    expect(getOutputFilename('lecture.mp4', 'srt')).toBe('lecture.srt')
    expect(getOutputFilename('podcast.mp3', 'txt')).toBe('podcast.txt')
    expect(getOutputFilename('clip.MOV', 'vtt')).toBe('clip.vtt')
  })

  it('keeps earlier dots in the stem', () => {
    expect(getOutputFilename('my.talk.webm', 'txt')).toBe('my.talk.txt')
  })

  it('appends when there is no extension', () => {
    expect(getOutputFilename('recording', 'srt')).toBe('recording.srt')
  })

  it('defaults the stem for missing input', () => {
    expect(getOutputFilename('', 'txt')).toBe('transcript.txt')
    expect(getOutputFilename(null, 'vtt')).toBe('transcript.vtt')
  })
})

describe('language handling', () => {
  it('exposes a non-empty language list that includes auto-detect', () => {
    expect(Array.isArray(LANGUAGES)).toBe(true)
    expect(LANGUAGES.length).toBeGreaterThan(1)
    expect(LANGUAGES.some((l) => l.code === 'auto')).toBe(true)
    expect(LANGUAGES.every((l) => typeof l.code === 'string' && typeof l.label === 'string')).toBe(true)
  })

  it('recognizes supported languages', () => {
    expect(isSupportedLanguage('auto')).toBe(true)
    expect(isSupportedLanguage('en')).toBe(true)
    expect(isSupportedLanguage('pt')).toBe(true)
    expect(isSupportedLanguage('xx')).toBe(false)
    expect(isSupportedLanguage('')).toBe(false)
    expect(isSupportedLanguage(null)).toBe(false)
  })

  it('resolves auto to null (let Whisper detect) and passes real codes through', () => {
    expect(resolveLanguage('auto')).toBe(null)
    expect(resolveLanguage('pt')).toBe('pt')
    expect(resolveLanguage('en')).toBe('en')
  })

  it('resolves unknown / empty codes to null', () => {
    expect(resolveLanguage('xx')).toBe(null)
    expect(resolveLanguage('')).toBe(null)
    expect(resolveLanguage(null)).toBe(null)
  })
})
