import { describe, it, expect } from 'vitest'
import {
  parseTimecode,
  formatSrtTimecode,
  formatTimecodeInput,
  normalizeCues,
  validateCues,
  buildSrt,
  parseSubtitleText,
  buildSubtitleStyle,
} from './subtitle-core.js'

describe('parseTimecode', () => {
  it('reads bare seconds', () => {
    expect(parseTimecode('12')).toBe(12)
    expect(parseTimecode('12.5')).toBe(12.5)
    expect(parseTimecode(7)).toBe(7)
  })

  it('reads mm:ss and hh:mm:ss', () => {
    expect(parseTimecode('1:23')).toBe(83)
    expect(parseTimecode('1:23.5')).toBe(83.5)
    expect(parseTimecode('01:02:03')).toBe(3723)
  })

  it('accepts the SRT comma decimal', () => {
    expect(parseTimecode('00:00:01,500')).toBe(1.5)
  })

  it('rejects nonsense rather than guessing', () => {
    expect(parseTimecode('')).toBeNull()
    expect(parseTimecode('later')).toBeNull()
    expect(parseTimecode(null)).toBeNull()
    expect(parseTimecode(undefined)).toBeNull()
    expect(parseTimecode('-3')).toBeNull()
    expect(parseTimecode(-3)).toBeNull()
  })

  it('rejects overflowing minute and second fields', () => {
    expect(parseTimecode('1:90')).toBeNull()
    expect(parseTimecode('1:75:00')).toBeNull()
  })
})

describe('formatSrtTimecode', () => {
  it('formats hours, minutes, seconds and milliseconds', () => {
    expect(formatSrtTimecode(0)).toBe('00:00:00,000')
    expect(formatSrtTimecode(1.5)).toBe('00:00:01,500')
    expect(formatSrtTimecode(3723.25)).toBe('01:02:03,250')
  })

  it('rounds to whole milliseconds before splitting', () => {
    // 1.9996s must land on 00:00:02,000, never 00:00:01,1000.
    expect(formatSrtTimecode(1.9996)).toBe('00:00:02,000')
  })

  it('never renders a negative timecode', () => {
    expect(formatSrtTimecode(-5)).toBe('00:00:00,000')
  })

  it('uses a dot for the editor fields', () => {
    expect(formatTimecodeInput(1.5)).toBe('00:00:01.500')
  })
})

describe('normalizeCues', () => {
  it('parses editor rows and drops the empty ones', () => {
    const cues = normalizeCues([
      { start: '0', end: '2', text: 'First' },
      { start: '2', end: '4', text: '   ' },
      { start: '4', end: '6', text: 'Third' },
    ])
    expect(cues).toEqual([
      { start: 0, end: 2, text: 'First' },
      { start: 4, end: 6, text: 'Third' },
    ])
  })

  it('sorts by start time so out-of-order editing still emits valid SRT', () => {
    const cues = normalizeCues([
      { start: '10', end: '12', text: 'Later' },
      { start: '1', end: '2', text: 'Earlier' },
    ])
    expect(cues.map((c) => c.text)).toEqual(['Earlier', 'Later'])
  })

  it('keeps unparseable times as null for the validator to report', () => {
    expect(normalizeCues([{ start: 'soon', end: '2', text: 'Hi' }])[0].start).toBeNull()
  })

  it('survives a missing list', () => {
    expect(normalizeCues()).toEqual([])
  })
})

describe('validateCues', () => {
  it('rejects an empty caption list', () => {
    expect(validateCues([]).valid).toBe(false)
    expect(validateCues([]).error).toMatch(/at least one caption/i)
  })

  it('rejects an unparseable timecode with the row number', () => {
    const r = validateCues([{ start: null, end: 2, text: 'Hi' }])
    expect(r.valid).toBe(false)
    expect(r.error).toContain('Caption 1')
  })

  it('rejects an end at or before the start', () => {
    expect(validateCues([{ start: 3, end: 3, text: 'Hi' }]).valid).toBe(false)
    expect(validateCues([{ start: 3, end: 1, text: 'Hi' }]).valid).toBe(false)
  })

  it('accepts a well-formed list', () => {
    expect(validateCues([{ start: 0, end: 2, text: 'Hi' }]).valid).toBe(true)
  })
})

describe('buildSrt', () => {
  it('numbers the cues from one and uses comma decimals', () => {
    expect(buildSrt([
      { start: 0, end: 2, text: 'First' },
      { start: 2.5, end: 4, text: 'Second' },
    ])).toBe(
      '1\n00:00:00,000 --> 00:00:02,000\nFirst\n\n' +
      '2\n00:00:02,500 --> 00:00:04,000\nSecond\n'
    )
  })

  it('renumbers rather than trusting the caller order', () => {
    const srt = buildSrt(normalizeCues([
      { start: '5', end: '6', text: 'B' },
      { start: '1', end: '2', text: 'A' },
    ]))
    expect(srt.startsWith('1\n00:00:01,000 --> 00:00:02,000\nA')).toBe(true)
  })
})

describe('parseSubtitleText', () => {
  it('reads an SRT file', () => {
    const cues = parseSubtitleText('1\r\n00:00:01,000 --> 00:00:03,000\r\nHello\r\n\r\n2\r\n00:00:04,000 --> 00:00:05,000\r\nBye\r\n')
    expect(cues).toEqual([
      { start: 1, end: 3, text: 'Hello' },
      { start: 4, end: 5, text: 'Bye' },
    ])
  })

  it('reads a WebVTT file and ignores cue settings', () => {
    const cues = parseSubtitleText('WEBVTT\n\n00:00:02.000 --> 00:00:04.000 line:90%\nOn screen\n')
    expect(cues).toEqual([{ start: 2, end: 4, text: 'On screen' }])
  })

  it('keeps multi-line captions', () => {
    const cues = parseSubtitleText('1\n00:00:00,000 --> 00:00:02,000\nline one\nline two\n')
    expect(cues[0].text).toBe('line one\nline two')
  })

  it('strips a leading byte order mark', () => {
    expect(parseSubtitleText('﻿1\n00:00:00,000 --> 00:00:01,000\nHi\n')).toHaveLength(1)
  })

  it('returns nothing for a file with no cues', () => {
    expect(parseSubtitleText('just some notes')).toEqual([])
    expect(parseSubtitleText('')).toEqual([])
  })

  it('round-trips through buildSrt', () => {
    const original = [{ start: 1, end: 3, text: 'Hello' }]
    expect(parseSubtitleText(buildSrt(original))).toEqual(original)
  })
})

describe('buildSubtitleStyle', () => {
  it('names a font, because libass in wasm has no default face', () => {
    expect(buildSubtitleStyle({})).toContain('FontName=DejaVu Sans')
  })

  it('maps positions onto ASS alignment numbers', () => {
    expect(buildSubtitleStyle({ position: 'bottom' })).toContain('Alignment=2')
    expect(buildSubtitleStyle({ position: 'center' })).toContain('Alignment=5')
    expect(buildSubtitleStyle({ position: 'top' })).toContain('Alignment=8')
    expect(buildSubtitleStyle({ position: 'sideways' })).toContain('Alignment=2')
  })

  it('turns the outline off when unchecked', () => {
    expect(buildSubtitleStyle({ outline: true })).toContain('Outline=2')
    expect(buildSubtitleStyle({ outline: false })).toContain('Outline=0')
  })

  it('clamps the font size', () => {
    expect(buildSubtitleStyle({ fontSize: 500 })).toContain('FontSize=96')
    expect(buildSubtitleStyle({ fontSize: 0 })).toContain('FontSize=8')
    expect(buildSubtitleStyle({ fontSize: '' })).toContain('FontSize=24')
  })

  it('emits no quote that would terminate the force_style argument', () => {
    expect(buildSubtitleStyle({ fontName: 'DejaVu Sans' })).not.toContain("'")
  })
})
