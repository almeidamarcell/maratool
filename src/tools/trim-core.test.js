import { describe, it, expect } from 'vitest'
import { validateTrimRange, buildTrimArgs, buildTrimReencodeArgs, getOutputFilename } from './trim-core.js'

describe('validateTrimRange', () => {
  it('accepts a valid range', () => {
    expect(validateTrimRange({ start: 1, end: 5, duration: 10 })).toEqual({ valid: true })
  })

  it('accepts a range with no duration provided', () => {
    expect(validateTrimRange({ start: 0, end: 5 })).toEqual({ valid: true })
  })

  it('rejects negative start', () => {
    const r = validateTrimRange({ start: -1, end: 5, duration: 10 })
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/start/i)
  })

  it('rejects end <= start', () => {
    expect(validateTrimRange({ start: 5, end: 5, duration: 10 }).valid).toBe(false)
    expect(validateTrimRange({ start: 5, end: 3, duration: 10 }).valid).toBe(false)
  })

  it('rejects end past duration', () => {
    const r = validateTrimRange({ start: 1, end: 15, duration: 10 })
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/past the end/i)
  })

  it('allows end exactly at duration (with small float tolerance)', () => {
    expect(validateTrimRange({ start: 0, end: 10, duration: 10 }).valid).toBe(true)
    expect(validateTrimRange({ start: 0, end: 10.04, duration: 10 }).valid).toBe(true)
  })

  it('rejects NaN values', () => {
    expect(validateTrimRange({ start: NaN, end: 5, duration: 10 }).valid).toBe(false)
    expect(validateTrimRange({ start: 0, end: NaN, duration: 10 }).valid).toBe(false)
  })

  it('rejects segments shorter than 0.05s', () => {
    const r = validateTrimRange({ start: 1, end: 1.01, duration: 10 })
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/too short/i)
  })
})

describe('buildTrimArgs', () => {
  it('produces lossless -c copy args in the right order', () => {
    expect(buildTrimArgs({ start: 1.5, end: 6, inputName: 'in.mp4', outputName: 'out.mp4' }))
      .toEqual(['-ss', '1.5', '-to', '6', '-i', 'in.mp4', '-c', 'copy', '-avoid_negative_ts', 'make_zero', '-y', 'out.mp4'])
  })

  it('coerces numeric times to strings', () => {
    const args = buildTrimArgs({ start: 0, end: 10, inputName: 'in.mp4', outputName: 'out.mp4' })
    expect(args[1]).toBe('0')
    expect(args[3]).toBe('10')
  })
})

describe('buildTrimReencodeArgs', () => {
  it('produces re-encode args with libx264 + aac', () => {
    const args = buildTrimReencodeArgs({ start: 0, end: 5, inputName: 'in.mp4', outputName: 'out.mp4' })
    expect(args).toContain('libx264')
    expect(args).toContain('aac')
    expect(args).toContain('-crf')
  })
})

describe('getOutputFilename', () => {
  it('inserts -trimmed before the extension', () => {
    expect(getOutputFilename('vacation.mp4')).toBe('vacation-trimmed.mp4')
    expect(getOutputFilename('clip.webm')).toBe('clip-trimmed.webm')
    expect(getOutputFilename('Movie.MOV')).toBe('Movie-trimmed.MOV')
  })

  it('handles names with no extension', () => {
    expect(getOutputFilename('no-extension')).toBe('no-extension-trimmed.mp4')
  })

  it('handles dot-files gracefully', () => {
    expect(getOutputFilename('.hidden')).toBe('.hidden-trimmed.mp4')
  })

  it('returns a default for missing input', () => {
    expect(getOutputFilename('')).toBe('video-trimmed.mp4')
    expect(getOutputFilename(null)).toBe('video-trimmed.mp4')
  })
})
