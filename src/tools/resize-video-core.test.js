import { describe, it, expect } from 'vitest'
import {
  validatePreset,
  getPresetDimensions,
  buildResizeArgs,
  computeAspectHeight,
  computeAspectWidth,
  getOutputFilename,
} from './resize-video-core.js'

describe('validatePreset', () => {
  it('accepts all valid presets', () => {
    for (var p of ['1080', '720', '480', '360', 'custom']) {
      expect(validatePreset(p)).toEqual({ valid: true })
    }
  })

  it('rejects unknown presets', () => {
    var r = validatePreset('2160')
    expect(r.valid).toBe(false)
    expect(r.error).toMatch(/unknown preset/i)
  })

  it('rejects null / undefined / non-string', () => {
    expect(validatePreset(null).valid).toBe(false)
    expect(validatePreset(undefined).valid).toBe(false)
    expect(validatePreset(720).valid).toBe(false)
    expect(validatePreset('').valid).toBe(false)
  })
})

describe('getPresetDimensions', () => {
  it('returns 1920×-2 for 1080p', () => {
    expect(getPresetDimensions('1080')).toEqual({ width: 1920, height: -2 })
  })

  it('returns 1280×-2 for 720p', () => {
    expect(getPresetDimensions('720')).toEqual({ width: 1280, height: -2 })
  })

  it('returns 854×-2 for 480p', () => {
    expect(getPresetDimensions('480')).toEqual({ width: 854, height: -2 })
  })

  it('returns 640×-2 for 360p', () => {
    expect(getPresetDimensions('360')).toEqual({ width: 640, height: -2 })
  })

  it('returns null for custom', () => {
    expect(getPresetDimensions('custom')).toBeNull()
  })
})

describe('buildResizeArgs', () => {
  it('produces correct scale filter with preset width and -2 height', () => {
    expect(
      buildResizeArgs({ inputName: 'in.mp4', outputName: 'out.mp4', width: 1280, height: -2 })
    ).toEqual(['-i', 'in.mp4', '-vf', 'scale=1280:-2', '-c:a', 'copy', '-y', 'out.mp4'])
  })

  it('produces correct scale filter with explicit width and height', () => {
    expect(
      buildResizeArgs({ inputName: 'clip.webm', outputName: 'clip-out.webm', width: 1920, height: 1080 })
    ).toEqual(['-i', 'clip.webm', '-vf', 'scale=1920:1080', '-c:a', 'copy', '-y', 'clip-out.webm'])
  })

  it('keeps -2 as literal string "-2" in the filter', () => {
    var args = buildResizeArgs({ inputName: 'v.mp4', outputName: 'o.mp4', width: 640, height: -2 })
    var filterArg = args[args.indexOf('-vf') + 1]
    expect(filterArg).toBe('scale=640:-2')
  })
})

describe('computeAspectHeight', () => {
  it('calculates correct height for 16:9 source scaled to 1280w', () => {
    // 1920×1080 → scale to 1280w → height should be 720
    expect(computeAspectHeight(1280, 1920, 1080)).toBe(720)
  })

  it('rounds to even number', () => {
    // 1280×719 (odd height source) → must stay even
    var result = computeAspectHeight(640, 1280, 719)
    expect(result % 2).toBe(0)
  })

  it('returns -2 for invalid inputs', () => {
    expect(computeAspectHeight(1280, 0, 1080)).toBe(-2)
    expect(computeAspectHeight(1280, 1920, 0)).toBe(-2)
    expect(computeAspectHeight(1280, -1, 1080)).toBe(-2)
  })
})

describe('computeAspectWidth', () => {
  it('calculates correct width for 16:9 source scaled to 720h', () => {
    // 1920×1080 → scale to 720h → width should be 1280
    expect(computeAspectWidth(720, 1920, 1080)).toBe(1280)
  })

  it('rounds to even number', () => {
    var result = computeAspectWidth(480, 1279, 720)
    expect(result % 2).toBe(0)
  })

  it('returns -2 for invalid inputs', () => {
    expect(computeAspectWidth(720, 0, 1080)).toBe(-2)
    expect(computeAspectWidth(720, 1920, 0)).toBe(-2)
  })
})

describe('getOutputFilename', () => {
  it('uses preset label when width matches a known preset', () => {
    expect(getOutputFilename('video.mp4', 1280, -2)).toBe('video-720p.mp4')
    expect(getOutputFilename('clip.webm', 1920, -2)).toBe('clip-1080p.webm')
    expect(getOutputFilename('film.mov', 854, -2)).toBe('film-480p.mov')
    expect(getOutputFilename('short.mp4', 640, -2)).toBe('short-360p.mp4')
  })

  it('uses WxH label for custom dimensions', () => {
    expect(getOutputFilename('video.mp4', 1280, 720)).toBe('video-1280x720.mp4')
    expect(getOutputFilename('clip.webm', 800, 600)).toBe('clip-800x600.webm')
  })

  it('uses width+w label for custom width with -2 height (non-preset)', () => {
    expect(getOutputFilename('video.mp4', 1024, -2)).toBe('video-1024w.mp4')
  })

  it('handles names without extension', () => {
    expect(getOutputFilename('videofile', 1280, -2)).toBe('videofile-720p.mp4')
  })

  it('returns fallback for empty or null input', () => {
    expect(getOutputFilename('', 1280, -2)).toBe('video-resized.mp4')
    expect(getOutputFilename(null, 1280, -2)).toBe('video-resized.mp4')
  })
})
