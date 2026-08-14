/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { parseFfmpegTime, formatClock, matchesAccept } from './ezgif-ffmpeg-ui.js'

describe('parseFfmpegTime', () => {
  it('reads the timestamp out of a progress line', () => {
    const line = 'frame=  120 fps= 30 q=28.0 size=    512kB time=00:00:04.00 bitrate=1048.6kbits/s'
    expect(parseFfmpegTime(line)).toBe(4)
  })

  it('handles hours and minutes', () => {
    expect(parseFfmpegTime('time=01:02:03.50')).toBeCloseTo(3723.5)
  })

  it('accepts a timestamp with no fractional part', () => {
    expect(parseFfmpegTime('time=00:00:07')).toBe(7)
  })

  it('returns null for lines with no timestamp', () => {
    expect(parseFfmpegTime('Stream #0:0 -> #0:0 (h264 -> gif)')).toBeNull()
  })

  it('returns null rather than throwing on empty input', () => {
    expect(parseFfmpegTime('')).toBeNull()
    expect(parseFfmpegTime(null)).toBeNull()
    expect(parseFfmpegTime(undefined)).toBeNull()
  })
})

describe('formatClock', () => {
  it('formats seconds as m:ss', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(600)).toBe('10:00')
  })

  it('floors fractional seconds', () => {
    expect(formatClock(4.9)).toBe('0:04')
  })

  it('never renders a negative clock', () => {
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('matchesAccept', () => {
  const file = (name, type) => ({ name, type })

  it('accepts an exact MIME match', () => {
    expect(matchesAccept(file('a.gif', 'image/gif'), 'image/gif')).toBe(true)
  })

  it('rejects a type the list does not name', () => {
    expect(matchesAccept(file('a.mp4', 'video/mp4'), 'image/gif')).toBe(false)
  })

  it('honours a type/* wildcard', () => {
    expect(matchesAccept(file('a.wav', 'audio/wav'), 'audio/*')).toBe(true)
    expect(matchesAccept(file('a.mp4', 'video/mp4'), 'audio/*')).toBe(false)
  })

  it('falls back to the extension when the browser reports no MIME type', () => {
    // Safari hands over an empty `type` for .webp and .avif often enough that
    // an extension entry is the only thing that lets those files through.
    expect(matchesAccept(file('photo.webp', ''), 'image/webp,.webp')).toBe(true)
  })

  it('does not let an empty type satisfy a wildcard', () => {
    expect(matchesAccept(file('mystery', ''), 'image/*')).toBe(false)
  })

  it('walks a multi-entry list', () => {
    const accept = 'video/mp4,video/webm,video/quicktime'
    expect(matchesAccept(file('a.mov', 'video/quicktime'), accept)).toBe(true)
    expect(matchesAccept(file('a.gif', 'image/gif'), accept)).toBe(false)
  })

  it('accepts anything when no accept attribute is set', () => {
    expect(matchesAccept(file('a.bin', 'application/octet-stream'), '')).toBe(true)
    expect(matchesAccept(file('a.bin', 'application/octet-stream'), undefined)).toBe(true)
  })

  it('is case-insensitive on both sides', () => {
    expect(matchesAccept(file('A.GIF', 'IMAGE/GIF'), 'image/gif')).toBe(true)
    expect(matchesAccept(file('A.WEBP', ''), '.webp')).toBe(true)
  })
})
