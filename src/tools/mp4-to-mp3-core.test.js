import { describe, it, expect } from 'vitest'
import { validateBitrate, buildMp3Args, getOutputFilename } from './mp4-to-mp3-core.js'

describe('validateBitrate', () => {
  it('accepts 128 as a number', () => {
    expect(validateBitrate(128)).toEqual({ valid: true })
  })

  it('accepts 192 as a number', () => {
    expect(validateBitrate(192)).toEqual({ valid: true })
  })

  it('accepts 320 as a number', () => {
    expect(validateBitrate(320)).toEqual({ valid: true })
  })

  it('accepts 128 as a string', () => {
    expect(validateBitrate('128')).toEqual({ valid: true })
  })

  it('accepts 192 as a string', () => {
    expect(validateBitrate('192')).toEqual({ valid: true })
  })

  it('accepts 320 as a string', () => {
    expect(validateBitrate('320')).toEqual({ valid: true })
  })

  it('rejects 256 (not in list)', () => {
    const r = validateBitrate(256)
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/128|192|320/)
  })

  it('rejects 0', () => {
    expect(validateBitrate(0).valid).toBe(false)
  })

  it('rejects a string that is not a valid bitrate', () => {
    expect(validateBitrate('bad').valid).toBe(false)
  })

  it('rejects null', () => {
    expect(validateBitrate(null).valid).toBe(false)
  })
})

describe('buildMp3Args', () => {
  it('produces the exact FFmpeg arg array for 192k', () => {
    expect(buildMp3Args({ inputName: 'input.mp4', outputName: 'output.mp3', bitrate: 192 }))
      .toEqual(['-i', 'input.mp4', '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-y', 'output.mp3'])
  })

  it('produces the exact FFmpeg arg array for 128k', () => {
    expect(buildMp3Args({ inputName: 'in.webm', outputName: 'out.mp3', bitrate: 128 }))
      .toEqual(['-i', 'in.webm', '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', '-y', 'out.mp3'])
  })

  it('produces the exact FFmpeg arg array for 320k', () => {
    expect(buildMp3Args({ inputName: 'clip.mov', outputName: 'clip.mp3', bitrate: 320 }))
      .toEqual(['-i', 'clip.mov', '-vn', '-c:a', 'libmp3lame', '-b:a', '320k', '-y', 'clip.mp3'])
  })

  it('coerces numeric bitrate to string in args', () => {
    const args = buildMp3Args({ inputName: 'a.mp4', outputName: 'a.mp3', bitrate: 192 })
    const bitrateArg = args[args.indexOf('-b:a') + 1]
    expect(typeof bitrateArg).toBe('string')
    expect(bitrateArg).toBe('192k')
  })

  it('includes -vn flag to strip video', () => {
    const args = buildMp3Args({ inputName: 'a.mp4', outputName: 'a.mp3', bitrate: 192 })
    expect(args).toContain('-vn')
  })

  it('includes libmp3lame codec', () => {
    const args = buildMp3Args({ inputName: 'a.mp4', outputName: 'a.mp3', bitrate: 192 })
    expect(args).toContain('libmp3lame')
  })
})

describe('getOutputFilename', () => {
  it('replaces mp4 extension with mp3', () => {
    expect(getOutputFilename('video.mp4')).toBe('video.mp3')
  })

  it('replaces MOV extension (uppercase) with mp3', () => {
    expect(getOutputFilename('clip.MOV')).toBe('clip.mp3')
  })

  it('replaces webm extension with mp3', () => {
    expect(getOutputFilename('recording.webm')).toBe('recording.mp3')
  })

  it('handles filenames with no extension', () => {
    expect(getOutputFilename('no-extension')).toBe('no-extension.mp3')
  })

  it('returns audio.mp3 for empty string', () => {
    expect(getOutputFilename('')).toBe('audio.mp3')
  })

  it('returns audio.mp3 for null', () => {
    expect(getOutputFilename(null)).toBe('audio.mp3')
  })

  it('returns audio.mp3 for undefined', () => {
    expect(getOutputFilename(undefined)).toBe('audio.mp3')
  })

  it('handles multi-dot filenames, replacing only the last extension', () => {
    expect(getOutputFilename('my.video.file.mp4')).toBe('my.video.file.mp3')
  })
})
