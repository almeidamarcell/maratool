import { describe, test, expect } from 'vitest'
import { parseTimestamp, formatYoutubeTimestamp, secondsToYoutubeLink } from './wave4-social-ext-core.js'

describe('parseTimestamp', () => {
  test('parses mm:ss', () => {
    expect(parseTimestamp('1:30').totalSeconds).toBe(90)
  })
  test('parses hh:mm:ss', () => {
    expect(parseTimestamp('1:02:03').totalSeconds).toBe(3723)
  })
})

describe('formatYoutubeTimestamp', () => {
  test('formats short timestamp', () => {
    expect(formatYoutubeTimestamp(90)).toBe('1:30')
  })
})

describe('secondsToYoutubeLink', () => {
  test('appends t param', () => {
    expect(secondsToYoutubeLink('https://youtu.be/abc', 90)).toContain('t=90')
  })
})
