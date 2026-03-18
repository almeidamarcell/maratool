import { describe, it, expect } from 'vitest'
import { validateFps, validateVideoFile, formatDuration, formatFileSize, buildFfmpegArgs, getOutputFilename, FPS_PRESETS, isPresetFps } from './fps-converter-core.js'

describe('validateFps', () => {
  it('accepts 24', () => {
    expect(validateFps(24)).toEqual({ valid: true })
  })

  it('accepts 1 (minimum)', () => {
    expect(validateFps(1)).toEqual({ valid: true })
  })

  it('accepts 240 (maximum)', () => {
    expect(validateFps(240)).toEqual({ valid: true })
  })

  it('rejects 0', () => {
    const r = validateFps(0)
    expect(r.valid).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('rejects negative', () => {
    expect(validateFps(-1).valid).toBe(false)
  })

  it('rejects above 240', () => {
    expect(validateFps(241).valid).toBe(false)
  })

  it('rejects NaN', () => {
    expect(validateFps(NaN).valid).toBe(false)
  })

  it('rejects non-integer float', () => {
    expect(validateFps(29.97).valid).toBe(false)
  })

  it('rejects string', () => {
    expect(validateFps('thirty').valid).toBe(false)
  })

  it('rejects null', () => {
    expect(validateFps(null).valid).toBe(false)
  })

  it('rejects undefined', () => {
    expect(validateFps(undefined).valid).toBe(false)
  })
})

describe('validateVideoFile', () => {
  it('accepts video/mp4', () => {
    expect(validateVideoFile({ type: 'video/mp4' })).toEqual({ valid: true })
  })

  it('accepts video/webm', () => {
    expect(validateVideoFile({ type: 'video/webm' })).toEqual({ valid: true })
  })

  it('accepts video/quicktime', () => {
    expect(validateVideoFile({ type: 'video/quicktime' })).toEqual({ valid: true })
  })

  it('rejects image/png', () => {
    expect(validateVideoFile({ type: 'image/png' }).valid).toBe(false)
  })

  it('rejects audio/mp3', () => {
    expect(validateVideoFile({ type: 'audio/mp3' }).valid).toBe(false)
  })

  it('rejects empty type', () => {
    expect(validateVideoFile({ type: '' }).valid).toBe(false)
  })

  it('rejects null', () => {
    expect(validateVideoFile(null).valid).toBe(false)
  })
})

describe('formatDuration', () => {
  it('formats 0 as "0:00"', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('formats 5 as "0:05"', () => {
    expect(formatDuration(5)).toBe('0:05')
  })

  it('formats 65 as "1:05"', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats 3661 as "1:01:01"', () => {
    expect(formatDuration(3661)).toBe('1:01:01')
  })

  it('formats 3600 as "1:00:00"', () => {
    expect(formatDuration(3600)).toBe('1:00:00')
  })

  it('returns "—" for NaN', () => {
    expect(formatDuration(NaN)).toBe('—')
  })

  it('returns "—" for Infinity', () => {
    expect(formatDuration(Infinity)).toBe('—')
  })

  it('returns "—" for negative', () => {
    expect(formatDuration(-1)).toBe('—')
  })
})

describe('formatFileSize', () => {
  it('formats 0 as "0 B"', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('formats 500 as "500 B"', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats 1024 as "1.0 KB"', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
  })

  it('formats 1048576 as "1.0 MB"', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB')
  })

  it('formats 1073741824 as "1.0 GB"', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })

  it('formats 1536 as "1.5 KB"', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
  })
})

describe('buildFfmpegArgs', () => {
  it('returns correct args for standard conversion', () => {
    expect(buildFfmpegArgs('input.mp4', 'output.mp4', 30)).toEqual(
      ['-i', 'input.mp4', '-filter:v', 'fps=30', '-c:a', 'copy', 'output.mp4']
    )
  })

  it('handles different FPS values', () => {
    const args = buildFfmpegArgs('in.webm', 'out.webm', 60)
    expect(args).toContain('fps=60')
  })
})

describe('getOutputFilename', () => {
  it('appends fps to filename', () => {
    expect(getOutputFilename('video.mp4', 30)).toBe('video-30fps.mp4')
  })

  it('handles multiple dots in name', () => {
    expect(getOutputFilename('my.clip.v2.mp4', 60)).toBe('my.clip.v2-60fps.mp4')
  })

  it('handles no extension', () => {
    expect(getOutputFilename('video', 24)).toBe('video-24fps')
  })

  it('handles .webm extension', () => {
    expect(getOutputFilename('clip.webm', 25)).toBe('clip-25fps.webm')
  })
})

describe('FPS_PRESETS', () => {
  it('contains standard presets', () => {
    expect(FPS_PRESETS).toEqual([24, 25, 30, 50, 60])
  })
})

describe('isPresetFps', () => {
  it('returns true for preset values', () => {
    expect(isPresetFps(24)).toBe(true)
    expect(isPresetFps(30)).toBe(true)
    expect(isPresetFps(60)).toBe(true)
  })

  it('returns false for non-preset values', () => {
    expect(isPresetFps(29)).toBe(false)
    expect(isPresetFps(48)).toBe(false)
    expect(isPresetFps(1)).toBe(false)
  })
})
