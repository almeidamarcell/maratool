import { describe, test, expect } from 'vitest'
import {
  frameTimesForDuration,
  isTruncated,
  formatTimestamp,
  formatVttTime,
  formatSrtTime,
  cleanCaption,
  buildPlainText,
  buildVtt,
  buildSrt,
  baseName,
} from './describe-video-core.js'

describe('frameTimesForDuration', () => {
  test('samples once per interval up to duration', () => {
    const times = frameTimesForDuration(5, 1, 100)
    expect(times.length).toBe(5) // ~0, 1, 2, 3, 4
    expect(times[1]).toBeCloseTo(1)
    expect(times[4]).toBeCloseTo(4)
  })

  test('nudges the first frame off t=0 to avoid a black frame', () => {
    const times = frameTimesForDuration(10, 2, 100)
    expect(times[0]).toBeGreaterThan(0)
    expect(times[0]).toBeLessThanOrEqual(0.1)
  })

  test('respects the maxFrames cap', () => {
    const times = frameTimesForDuration(120, 1, 30)
    expect(times.length).toBe(30)
  })

  test('returns empty for invalid input', () => {
    expect(frameTimesForDuration(0, 1, 10)).toEqual([])
    expect(frameTimesForDuration(10, 0, 10)).toEqual([])
    expect(frameTimesForDuration(NaN, 1, 10)).toEqual([])
  })

  test('never samples at or past the duration', () => {
    const times = frameTimesForDuration(3, 1, 100)
    for (const t of times) expect(t).toBeLessThan(3)
  })
})

describe('isTruncated', () => {
  test('true when interval yields more frames than the cap', () => {
    expect(isTruncated(120, 1, 30)).toBe(true)
  })
  test('false when within the cap', () => {
    expect(isTruncated(20, 1, 30)).toBe(false)
  })
  test('false for degenerate input', () => {
    expect(isTruncated(0, 1, 30)).toBe(false)
  })
})

describe('timestamp formatting', () => {
  test('formatTimestamp under an hour is MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00')
    expect(formatTimestamp(5)).toBe('00:05')
    expect(formatTimestamp(65)).toBe('01:05')
    expect(formatTimestamp(600)).toBe('10:00')
  })

  test('formatTimestamp over an hour adds the hour field', () => {
    expect(formatTimestamp(3661)).toBe('1:01:01')
  })

  test('formatVttTime is HH:MM:SS.mmm', () => {
    expect(formatVttTime(1.5)).toBe('00:00:01.500')
    expect(formatVttTime(3661.25)).toBe('01:01:01.250')
  })

  test('formatSrtTime uses a comma for milliseconds', () => {
    expect(formatSrtTime(1.5)).toBe('00:00:01,500')
  })
})

describe('cleanCaption', () => {
  test('capitalizes and adds terminal punctuation', () => {
    expect(cleanCaption('a cat on a sofa')).toBe('A cat on a sofa.')
  })
  test('collapses whitespace', () => {
    expect(cleanCaption('  a   dog\n running ')).toBe('A dog running.')
  })
  test('keeps existing terminal punctuation', () => {
    expect(cleanCaption('Who is there?')).toBe('Who is there?')
  })
  test('empty in, empty out', () => {
    expect(cleanCaption('')).toBe('')
    expect(cleanCaption(null)).toBe('')
  })
})

describe('transcript builders', () => {
  const items = [
    { time: 1, text: 'A person waves.' },
    { time: 2, text: 'A dog runs by.' },
  ]

  test('buildPlainText prefixes each line with a timestamp', () => {
    expect(buildPlainText(items)).toBe('[00:01] A person waves.\n[00:02] A dog runs by.')
  })

  test('buildVtt emits a WEBVTT header and cues that chain end-to-start', () => {
    const vtt = buildVtt(items, 3)
    expect(vtt.startsWith('WEBVTT')).toBe(true)
    expect(vtt).toContain('00:00:01.000 --> 00:00:02.000')
    // last cue runs to the video duration
    expect(vtt).toContain('00:00:02.000 --> 00:00:03.000')
    expect(vtt).toContain('A dog runs by.')
  })

  test('buildSrt numbers cues from 1', () => {
    const srt = buildSrt(items, 3)
    expect(srt.startsWith('1\n')).toBe(true)
    expect(srt).toContain('00:00:01,000 --> 00:00:02,000')
  })
})

describe('baseName', () => {
  test('strips a single extension', () => {
    expect(baseName('clip.mp4')).toBe('clip')
    expect(baseName('my.holiday.mov')).toBe('my.holiday')
  })
  test('falls back for empty input', () => {
    expect(baseName('')).toBe('video-description')
  })
})
