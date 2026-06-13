import { describe, it, expect } from 'vitest'
import {
  validateAspectRatio,
  getAspectValue,
  pctToPixels,
  buildCropArgs,
  getOutputFilename,
  snapToAspect,
} from './crop-video-core.js'

describe('validateAspectRatio', () => {
  it('accepts all valid ratios', () => {
    expect(validateAspectRatio('free').valid).toBe(true)
    expect(validateAspectRatio('16:9').valid).toBe(true)
    expect(validateAspectRatio('9:16').valid).toBe(true)
    expect(validateAspectRatio('1:1').valid).toBe(true)
    expect(validateAspectRatio('4:3').valid).toBe(true)
    expect(validateAspectRatio('3:4').valid).toBe(true)
  })

  it('rejects unknown ratios', () => {
    expect(validateAspectRatio('21:9').valid).toBe(false)
    expect(validateAspectRatio('').valid).toBe(false)
    expect(validateAspectRatio('Free').valid).toBe(false)
    expect(validateAspectRatio('2:1').valid).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(validateAspectRatio(null).valid).toBe(false)
    expect(validateAspectRatio(16 / 9).valid).toBe(false)
    expect(validateAspectRatio(undefined).valid).toBe(false)
  })
})

describe('getAspectValue', () => {
  it('returns null for free', () => {
    expect(getAspectValue('free')).toBe(null)
  })

  it('returns 16/9 for 16:9', () => {
    expect(getAspectValue('16:9')).toBeCloseTo(16 / 9)
  })

  it('returns 9/16 for 9:16', () => {
    expect(getAspectValue('9:16')).toBeCloseTo(9 / 16)
  })

  it('returns 1 for 1:1', () => {
    expect(getAspectValue('1:1')).toBe(1)
  })

  it('returns 4/3 for 4:3', () => {
    expect(getAspectValue('4:3')).toBeCloseTo(4 / 3)
  })

  it('returns 3/4 for 3:4', () => {
    expect(getAspectValue('3:4')).toBeCloseTo(3 / 4)
  })

  it('returns null for unknown ratio', () => {
    expect(getAspectValue('21:9')).toBe(null)
  })
})

describe('pctToPixels', () => {
  it('converts percentages to even pixel values', () => {
    var result = pctToPixels({ leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }, 1920, 1080)
    expect(result.x % 2).toBe(0)
    expect(result.y % 2).toBe(0)
    expect(result.w % 2).toBe(0)
    expect(result.h % 2).toBe(0)
  })

  it('clamps so x+w <= videoW', () => {
    var result = pctToPixels({ leftPct: 50, topPct: 0, widthPct: 80, heightPct: 50 }, 1920, 1080)
    expect(result.x + result.w).toBeLessThanOrEqual(1920)
  })

  it('clamps so y+h <= videoH', () => {
    var result = pctToPixels({ leftPct: 0, topPct: 50, widthPct: 50, heightPct: 80 }, 1920, 1080)
    expect(result.y + result.h).toBeLessThanOrEqual(1080)
  })

  it('returns exact values for a centered 80% box on 1920x1080', () => {
    var result = pctToPixels({ leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }, 1920, 1080)
    // 10% of 1920 = 192, 80% of 1920 = 1536
    // 10% of 1080 = 108, 80% of 1080 = 864
    expect(result.x).toBe(192)
    expect(result.y).toBe(108)
    expect(result.w).toBe(1536)
    expect(result.h).toBe(864)
  })

  it('produces all even values for non-divisible percentages', () => {
    var result = pctToPixels({ leftPct: 15, topPct: 25, widthPct: 70, heightPct: 60 }, 1920, 1080)
    expect(result.x % 2).toBe(0)
    expect(result.y % 2).toBe(0)
    expect(result.w % 2).toBe(0)
    expect(result.h % 2).toBe(0)
  })
})

describe('buildCropArgs', () => {
  it('produces the correct ffmpeg arg array', () => {
    expect(buildCropArgs({ inputName: 'input.mp4', outputName: 'output.mp4', x: 192, y: 108, w: 1536, h: 864 }))
      .toEqual(['-i', 'input.mp4', '-vf', 'crop=1536:864:192:108', '-c:a', 'copy', '-y', 'output.mp4'])
  })

  it('uses crop=W:H:X:Y order (width before height, then x then y)', () => {
    var args = buildCropArgs({ inputName: 'in.mp4', outputName: 'out.mp4', x: 10, y: 20, w: 100, h: 50 })
    var vfArg = args[args.indexOf('-vf') + 1]
    expect(vfArg).toBe('crop=100:50:10:20')
  })
})

describe('getOutputFilename', () => {
  it('inserts -cropped before the extension', () => {
    expect(getOutputFilename('video.mp4')).toBe('video-cropped.mp4')
    expect(getOutputFilename('clip.webm')).toBe('clip-cropped.webm')
    expect(getOutputFilename('Movie.MOV')).toBe('Movie-cropped.MOV')
  })

  it('handles names with no extension', () => {
    expect(getOutputFilename('no-extension')).toBe('no-extension-cropped.mp4')
  })

  it('handles dot-files gracefully', () => {
    expect(getOutputFilename('.hidden')).toBe('.hidden-cropped.mp4')
  })

  it('returns a default for missing input', () => {
    expect(getOutputFilename('')).toBe('video-cropped.mp4')
    expect(getOutputFilename(null)).toBe('video-cropped.mp4')
  })
})

describe('snapToAspect', () => {
  it('returns unchanged box for free ratio', () => {
    var box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 80 }
    expect(snapToAspect(box, 'free')).toEqual(box)
  })

  it('preserves 16:9 ratio (within float tolerance)', () => {
    var box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 60 }
    var result = snapToAspect(box, '16:9')
    var actualRatio = result.widthPct / result.heightPct
    expect(actualRatio).toBeCloseTo(16 / 9, 5)
  })

  it('preserves 9:16 ratio', () => {
    var box = { leftPct: 20, topPct: 10, widthPct: 40, heightPct: 50 }
    var result = snapToAspect(box, '9:16')
    var actualRatio = result.widthPct / result.heightPct
    expect(actualRatio).toBeCloseTo(9 / 16, 5)
  })

  it('preserves 1:1 ratio', () => {
    var box = { leftPct: 10, topPct: 10, widthPct: 80, heightPct: 60 }
    var result = snapToAspect(box, '1:1')
    expect(result.widthPct).toBeCloseTo(result.heightPct, 5)
  })

  it('keeps box inside [0, 100]', () => {
    var box = { leftPct: 40, topPct: 40, widthPct: 50, heightPct: 50 }
    var result = snapToAspect(box, '16:9')
    expect(result.leftPct).toBeGreaterThanOrEqual(0)
    expect(result.topPct).toBeGreaterThanOrEqual(0)
    expect(result.leftPct + result.widthPct).toBeLessThanOrEqual(100)
    expect(result.topPct + result.heightPct).toBeLessThanOrEqual(100)
  })

  it('handles box near edges without going out of bounds', () => {
    var box = { leftPct: 0, topPct: 0, widthPct: 100, heightPct: 100 }
    var result = snapToAspect(box, '16:9')
    expect(result.leftPct).toBeGreaterThanOrEqual(0)
    expect(result.topPct).toBeGreaterThanOrEqual(0)
    expect(result.leftPct + result.widthPct).toBeLessThanOrEqual(100)
    expect(result.topPct + result.heightPct).toBeLessThanOrEqual(100)
    // ratio preserved
    expect(result.widthPct / result.heightPct).toBeCloseTo(16 / 9, 5)
  })
})
