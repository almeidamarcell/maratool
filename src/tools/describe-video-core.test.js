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
  mergeTimeline,
  buildCombinedPlainText,
  buildCombinedVtt,
  buildCombinedSrt,
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

  // Bug repro: MediaRecorder WebMs (browser screen recordings) report
  // duration=Infinity at loadedmetadata. Core must refuse, not emit 150 frames.
  test('returns empty for non-finite duration', () => {
    expect(frameTimesForDuration(Infinity, 1, 150)).toEqual([])
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

  test('false for non-finite duration', () => {
    expect(isTruncated(Infinity, 1, 30)).toBe(false)
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

  // Bug repro: sub-ms fractions must carry into seconds, never emit ".1000".
  // Real trigger: a 30fps clip's duration is 2.9666…s and the last VTT cue
  // ends at the raw duration.
  test('formatVttTime rolls fractional ms into seconds instead of emitting .1000', () => {
    expect(formatVttTime(1.9996)).toBe('00:00:02.000')
    expect(formatVttTime(59.9999)).toBe('00:01:00.000')
    expect(formatVttTime(3599.9996)).toBe('01:00:00.000')
  })

  test('formatSrtTime rolls fractional ms the same way', () => {
    expect(formatSrtTime(1.9996)).toBe('00:00:02,000')
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

// ── Combined audio + visual timeline ──
// visual: [{ time, text }] from frame captioning
// speech: [{ start, end, text }] from Whisper (video-to-text-core shape)

describe('mergeTimeline', () => {
  const visual = [
    { time: 1, text: 'A person stands at a whiteboard.' },
    { time: 6, text: 'A slide with a chart is shown.' },
  ]
  const speech = [
    { start: 0.5, end: 4, text: 'Welcome everyone.' },
    { start: 6, end: 9, text: 'Look at these numbers.' },
  ]

  test('interleaves both streams sorted by time', () => {
    const merged = mergeTimeline(visual, speech)
    expect(merged.map(m => m.kind)).toEqual(['speech', 'visual', 'speech', 'visual'])
    expect(merged.map(m => m.time)).toEqual([0.5, 1, 6, 6])
  })

  test('speech comes before visual at the same timestamp', () => {
    const merged = mergeTimeline([{ time: 6, text: 'v' }], [{ start: 6, end: 7, text: 's' }])
    expect(merged[0].kind).toBe('speech')
    expect(merged[1].kind).toBe('visual')
  })

  test('speech items carry their end time', () => {
    const merged = mergeTimeline([], speech)
    expect(merged[0].end).toBe(4)
  })

  test('empty speech yields visual-only timeline', () => {
    const merged = mergeTimeline(visual, [])
    expect(merged.map(m => m.kind)).toEqual(['visual', 'visual'])
  })

  test('tolerates null/undefined inputs', () => {
    expect(mergeTimeline(null, undefined)).toEqual([])
  })
})

describe('buildCombinedPlainText', () => {
  const visual = [{ time: 1, text: 'A person waves.' }]
  const speech = [{ start: 0.5, end: 4, text: 'Hello there.' }]

  test('labels lines when both streams are present', () => {
    const out = buildCombinedPlainText(mergeTimeline(visual, speech))
    expect(out).toBe('[00:00] Speech: Hello there.\n[00:01] Visual: A person waves.')
  })

  test('omits labels when only visual items exist — matches buildPlainText', () => {
    const merged = mergeTimeline(visual, [])
    expect(buildCombinedPlainText(merged)).toBe(buildPlainText(visual))
  })
})

describe('buildCombinedVtt', () => {
  const visual = [
    { time: 1, text: 'A person waves.' },
    { time: 3, text: 'A dog runs by.' },
  ]
  const speech = [{ start: 0.5, end: 4.5, text: 'Hello there.' }]

  test('speech cues use their real start–end; visual cues chain to next visual', () => {
    const vtt = buildCombinedVtt(mergeTimeline(visual, speech), 5)
    expect(vtt.startsWith('WEBVTT')).toBe(true)
    expect(vtt).toContain('00:00:00.500 --> 00:00:04.500\nSpeech: Hello there.')
    expect(vtt).toContain('00:00:01.000 --> 00:00:03.000\nVisual: A person waves.')
    expect(vtt).toContain('00:00:03.000 --> 00:00:05.000\nVisual: A dog runs by.')
  })

  test('visual-only input is byte-identical to buildVtt (no labels)', () => {
    expect(buildCombinedVtt(mergeTimeline(visual, []), 5)).toBe(buildVtt(visual, 5))
  })
})

describe('buildCombinedSrt', () => {
  const visual = [{ time: 1, text: 'A person waves.' }]
  const speech = [{ start: 0.5, end: 4, text: 'Hello.' }]

  test('numbers cues sequentially across both streams', () => {
    const srt = buildCombinedSrt(mergeTimeline(visual, speech), 5)
    expect(srt.startsWith('1\n00:00:00,500 --> 00:00:04,000\nSpeech: Hello.')).toBe(true)
    expect(srt).toContain('2\n00:00:01,000 --> 00:00:05,000\nVisual: A person waves.')
  })

  test('visual-only input is byte-identical to buildSrt', () => {
    expect(buildCombinedSrt(mergeTimeline(visual, []), 5)).toBe(buildSrt(visual, 5))
  })
})
