import { describe, it, expect } from 'vitest'
import {
  computeGifStats,
  computeOverlayPosition,
  getCanvasFilterForEffect,
  computeStaticGifKeyframes,
  formatFrameFilename,
} from './ezgif-gif-ext-core.js'

describe('computeGifStats', () => {
  it('summarizes frame count, duration, and dimensions', () => {
    expect(computeGifStats(4, [100, 100, 100, 100], 320, 240)).toEqual({
      frameCount: 4,
      durationMs: 4000,
      width: 320,
      height: 240,
      avgDelayCs: 100,
      fps: 1,
    })
  })
})

describe('computeOverlayPosition', () => {
  it('places overlay at bottom-right with margin', () => {
    expect(computeOverlayPosition(400, 300, 80, 40, 'br', 10)).toEqual({
      x: 310, y: 250,
    })
  })
  it('centers overlay', () => {
    expect(computeOverlayPosition(400, 300, 80, 40, 'mc', 0)).toEqual({
      x: 160, y: 130,
    })
  })
})

describe('getCanvasFilterForEffect', () => {
  it('maps effect names to canvas filter strings', () => {
    expect(getCanvasFilterForEffect('grayscale')).toBe('grayscale(100%)')
    expect(getCanvasFilterForEffect('sepia')).toBe('sepia(100%)')
    expect(getCanvasFilterForEffect('unknown')).toBe('none')
  })
})

describe('computeStaticGifKeyframes', () => {
  it('builds zoom pan keyframes for static image animation', () => {
    const kf = computeStaticGifKeyframes(4, 'zoom-in')
    expect(kf).toHaveLength(4)
    expect(kf[0].scale).toBeLessThan(kf[3].scale)
  })
})

describe('formatFrameFilename', () => {
  it('zero-pads frame index', () => {
    expect(formatFrameFilename('anim', 3, 12, '.png')).toBe('anim-frame-03.png')
  })
})
