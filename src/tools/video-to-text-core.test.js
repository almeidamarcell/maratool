import { describe, it, expect } from 'vitest'
import {
  validateMediaFile,
  buildAudioExtractArgs,
  formatTimestamp,
  normalizeChunks,
  toSRT,
  toVTT,
  toPlainText,
  toParagraphs,
  buildAsrOptions,
  sanitizeVocabulary,
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

describe('toParagraphs', () => {
  it('breaks paragraphs on a silence gap larger than gapSeconds', () => {
    const chunks = [
      { start: 0, end: 2, text: 'First part' },
      { start: 2.2, end: 4, text: 'still going' },
      { start: 6, end: 8, text: 'new thought' }, // gap 2s > 1.5
    ]
    expect(toParagraphs(chunks)).toBe('First part still going\n\nnew thought')
  })

  it('does not break when the gap equals gapSeconds (strict >)', () => {
    const chunks = [
      { start: 0, end: 2, text: 'one' },
      { start: 3.5, end: 5, text: 'two' }, // gap exactly 1.5
    ]
    expect(toParagraphs(chunks)).toBe('one two')
  })

  it('breaks after maxSentences completed sentences', () => {
    const chunks = [
      { start: 0, end: 1, text: 'A.' },
      { start: 1, end: 2, text: 'B.' },
      { start: 2, end: 3, text: 'C.' },
      { start: 3, end: 4, text: 'D.' },
      { start: 4, end: 5, text: 'E.' },
    ]
    expect(toParagraphs(chunks)).toBe('A. B. C. D.\n\nE.')
  })

  it('soft char cap only breaks at a sentence end, never mid-sentence', () => {
    const long = 'x'.repeat(400)
    const chunks = [
      { start: 0, end: 1, text: long + '.' },
      { start: 1, end: 2, text: long + '.' },
    ]
    // cap crossed after the first (ends in '.') → break; each is its own paragraph
    expect(toParagraphs(chunks, { maxChars: 300 })).toBe(long + '.\n\n' + long + '.')
  })

  it('keeps a run-on with no terminal punctuation as one paragraph', () => {
    const chunks = [
      { start: 0, end: 1, text: 'no punctuation here' },
      { start: 1, end: 2, text: 'and still none' },
    ]
    expect(toParagraphs(chunks, { maxChars: 5 })).toBe('no punctuation here and still none')
  })

  it('respects custom gapSeconds', () => {
    const chunks = [
      { start: 0, end: 1, text: 'a' },
      { start: 2, end: 3, text: 'b' }, // gap 1s
    ]
    expect(toParagraphs(chunks, { gapSeconds: 0.5 })).toBe('a\n\nb')
  })

  it('handles degenerate/missing timestamps without breaking', () => {
    expect(toParagraphs([{ start: 0, end: 0, text: 'only text' }])).toBe('only text')
    expect(toParagraphs([{ text: 'no ts' }, { text: 'still no ts' }])).toBe('no ts still no ts')
  })

  it('returns empty string for empty or non-array input', () => {
    expect(toParagraphs([])).toBe('')
    expect(toParagraphs(null)).toBe('')
    expect(toParagraphs(undefined)).toBe('')
  })

  it('counts closing punctuation and ellipsis as sentence ends', () => {
    const chunks = [
      { start: 0, end: 1, text: 'He said "go."' },
      { start: 1, end: 2, text: 'Wait…' },
      { start: 2, end: 3, text: 'Done!)' },
      { start: 3, end: 4, text: 'Next.' },
      { start: 4, end: 5, text: 'After' },
    ]
    // 4 sentence-ends reached at 'Next.' → break before 'After'
    expect(toParagraphs(chunks)).toBe('He said "go." Wait… Done!) Next.\n\nAfter')
  })
})

describe('buildAsrOptions', () => {
  it('sets the baseline pipeline keys', () => {
    const o = buildAsrOptions({ language: 'pt' })
    expect(o.return_timestamps).toBe(true)
    expect(o.chunk_length_s).toBe(30)
    expect(o.stride_length_s).toBe(5)
    expect(o.task).toBe('transcribe')
  })

  it('passes language through, defaulting nullish to null', () => {
    expect(buildAsrOptions({ language: 'es' }).language).toBe('es')
    expect(buildAsrOptions({ language: null }).language).toBe(null)
    expect(buildAsrOptions({}).language).toBe(null)
    expect(buildAsrOptions().language).toBe(null)
  })

  it('includes the anti-repetition guard', () => {
    expect(buildAsrOptions({ language: null }).no_repeat_ngram_size).toBe(3)
  })

  it('includes prompt_ids only for a non-empty array', () => {
    expect(buildAsrOptions({ language: null, promptIds: [1, 2, 3] }).prompt_ids).toEqual([1, 2, 3])
    expect('prompt_ids' in buildAsrOptions({ language: null })).toBe(false)
    expect('prompt_ids' in buildAsrOptions({ language: null, promptIds: [] })).toBe(false)
    expect('prompt_ids' in buildAsrOptions({ language: null, promptIds: null })).toBe(false)
  })
})

describe('sanitizeVocabulary', () => {
  it('returns empty string for non-strings and whitespace-only', () => {
    expect(sanitizeVocabulary(null)).toBe('')
    expect(sanitizeVocabulary(undefined)).toBe('')
    expect(sanitizeVocabulary(42)).toBe('')
    expect(sanitizeVocabulary('   ')).toBe('')
  })

  it('trims and collapses internal whitespace', () => {
    expect(sanitizeVocabulary('  Astro   Cloudflare\n\tmaratool ')).toBe('Astro Cloudflare maratool')
  })

  it('leaves input at or below the cap untouched', () => {
    const s = 'a'.repeat(200)
    expect(sanitizeVocabulary(s)).toBe(s)
  })

  it('truncates on a word boundary without a trailing separator', () => {
    const input = Array(60).fill('brand').join(', ') // well over 200 chars
    const out = sanitizeVocabulary(input)
    expect(out.length).toBeLessThanOrEqual(200)
    expect(out.endsWith(',')).toBe(false)
    expect(out.endsWith(' ')).toBe(false)
    expect(out.split(' ').every((w) => w.replace(/,$/, '') === 'brand')).toBe(true)
  })

  it('respects a custom maxChars', () => {
    expect(sanitizeVocabulary('one two three four', { maxChars: 7 })).toBe('one two')
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
