import { describe, it, expect } from 'vitest'
import {
  reverseFrameOrder,
  scaleDelays,
  clampDelay,
  cutFramesByIndex,
  frameIndexAtTime,
  cutFramesByTime,
  pingPongFrames,
  shuffleFrames,
  extendToDuration,
  computeResizeDims,
  computeCropRegion,
  normalizeRotation,
  combineLayoutDims,
  validateLoopCount,
  getGifOutputFilename,
  speedPercentToDelayFactor,
  totalDurationMs,
} from './gif-anim-core.js'

describe('reverseFrameOrder', () => {
  it('reverses frame array without mutating input', () => {
    const frames = [{ id: 0 }, { id: 1 }, { id: 2 }]
    const out = reverseFrameOrder(frames)
    expect(out).toEqual([{ id: 2 }, { id: 1 }, { id: 0 }])
    expect(frames[0].id).toBe(0)
  })
})

describe('scaleDelays', () => {
  it('doubles delay at 50% speed (slower)', () => {
    expect(scaleDelays([100, 200], 50)).toEqual([200, 400])
  })
  it('halves delay at 200% speed (faster)', () => {
    expect(scaleDelays([100, 200], 200)).toEqual([50, 100])
  })
  it('clamps each delay to minimum 2 hundredths', () => {
    expect(scaleDelays([10, 20], 500)).toEqual([2, 4])
  })
})

describe('clampDelay', () => {
  it('enforces minimum delay of 2', () => {
    expect(clampDelay(0)).toBe(2)
    expect(clampDelay(1)).toBe(2)
    expect(clampDelay(50)).toBe(50)
  })
})

describe('cutFramesByIndex', () => {
  const frames = ['a', 'b', 'c', 'd', 'e']
  it('cuts inclusive start and exclusive end', () => {
    expect(cutFramesByIndex(frames, 1, 4)).toEqual(['b', 'c', 'd'])
  })
  it('returns empty for invalid range', () => {
    expect(cutFramesByIndex(frames, 5, 6)).toEqual([])
    expect(cutFramesByIndex(frames, 3, 2)).toEqual([])
  })
})

describe('frameIndexAtTime', () => {
  const delays = [100, 200, 300] // 1s, 2s, 3s in hundredths → 10+20+30 = 60 hundredths = 600ms
  it('maps time to frame index', () => {
    expect(frameIndexAtTime(delays, 0)).toBe(0)
    expect(frameIndexAtTime(delays, 500)).toBe(0)
    expect(frameIndexAtTime(delays, 1000)).toBe(1)
    expect(frameIndexAtTime(delays, 2500)).toBe(1)
  })
  it('clamps past end to last frame', () => {
    expect(frameIndexAtTime(delays, 99999)).toBe(2)
  })
})

describe('cutFramesByTime', () => {
  const frames = ['a', 'b', 'c', 'd']
  const delays = [100, 100, 100, 100]
  it('cuts by millisecond range', () => {
    expect(cutFramesByTime(frames, delays, 1000, 3000)).toEqual({
      frames: ['b', 'c'],
      delays: [100, 100],
    })
  })
})

describe('pingPongFrames', () => {
  it('appends reversed tail without duplicating endpoints', () => {
    expect(pingPongFrames([1, 2, 3])).toEqual([1, 2, 3, 2, 1])
    expect(pingPongFrames([1])).toEqual([1])
  })
})

describe('shuffleFrames', () => {
  it('permutes frames deterministically with seeded rng', () => {
    function makeRng() {
      var n = 0
      return function () {
        n = (n * 1103515245 + 12345) & 0x7fffffff
        return n / 0x7fffffff
      }
    }
    const frames = [0, 1, 2, 3, 4]
    const a = shuffleFrames(frames, makeRng())
    const b = shuffleFrames(frames, makeRng())
    expect([...a].sort((x, y) => x - y)).toEqual(frames)
    expect(b).toEqual(a)
  })
})

describe('extendToDuration', () => {
  it('loops frames until target duration is met', () => {
    const frames = ['a', 'b']
    const delays = [100, 100]
    const out = extendToDuration(frames, delays, 2500)
    expect(out.frames.length).toBeGreaterThanOrEqual(2)
    expect(totalDurationMs(out.delays)).toBeGreaterThanOrEqual(500)
  })
})

describe('computeResizeDims', () => {
  it('scales proportionally in contain mode', () => {
    expect(computeResizeDims(800, 600, 400, 400, 'contain')).toEqual({ width: 400, height: 300 })
  })
  it('fills target in cover mode', () => {
    expect(computeResizeDims(800, 600, 400, 400, 'cover')).toEqual({ width: 533, height: 400 })
  })
  it('stretches in stretch mode', () => {
    expect(computeResizeDims(800, 600, 400, 400, 'stretch')).toEqual({ width: 400, height: 400 })
  })
})

describe('computeCropRegion', () => {
  it('clamps crop box inside source', () => {
    expect(computeCropRegion(100, 100, 50, 50, 60, 60)).toEqual({ x: 50, y: 50, width: 50, height: 50 })
  })
  it('rejects zero-size crop', () => {
    expect(computeCropRegion(100, 100, 0, 50, 0, 0)).toBe(null)
  })
})

describe('normalizeRotation', () => {
  it('normalizes angle to 0-359', () => {
    expect(normalizeRotation(90)).toBe(90)
    expect(normalizeRotation(450)).toBe(90)
    expect(normalizeRotation(-90)).toBe(270)
  })
})

describe('combineLayoutDims', () => {
  it('computes horizontal layout canvas size', () => {
    expect(combineLayoutDims('horizontal', [{ w: 100, h: 50 }, { w: 80, h: 60 }])).toEqual({
      width: 180,
      height: 60,
    })
  })
  it('computes 2x2 grid canvas size', () => {
    expect(combineLayoutDims('grid2x2', [
      { w: 100, h: 50 },
      { w: 80, h: 60 },
      { w: 90, h: 40 },
      { w: 70, h: 70 },
    ])).toEqual({ width: 190, height: 120 })
  })
})

describe('validateLoopCount', () => {
  it('accepts 0 for infinite and positive integers', () => {
    expect(validateLoopCount(0)).toBe(true)
    expect(validateLoopCount(3)).toBe(true)
    expect(validateLoopCount(-1)).toBe(false)
  })
})

describe('getGifOutputFilename', () => {
  it('inserts suffix before .gif extension', () => {
    expect(getGifOutputFilename('cat.gif', 'reversed')).toBe('cat-reversed.gif')
    expect(getGifOutputFilename('anim', 'cut')).toBe('anim-cut.gif')
  })
})

describe('speedPercentToDelayFactor', () => {
  it('converts speed percent to delay multiplier', () => {
    expect(speedPercentToDelayFactor(200)).toBe(0.5)
    expect(speedPercentToDelayFactor(50)).toBe(2)
  })
})

describe('totalDurationMs', () => {
  it('sums delays in milliseconds', () => {
    expect(totalDurationMs([100, 200])).toBe(3000)
  })
})
