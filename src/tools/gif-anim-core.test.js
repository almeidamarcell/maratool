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
  normalizeLoopCount,
  getGifOutputFilename,
  decodedSizeError,
  rewriteGifDelays,
  computeFitPlan,
  describeFitPlan,
  keptFrameCount,
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

describe('normalizeLoopCount', () => {
  it('returns 0 for invalid values', () => {
    expect(normalizeLoopCount(5)).toBe(5)
    expect(normalizeLoopCount(-1)).toBe(0)
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

describe('rewriteGifDelays', () => {
  // Minimal but structurally complete GIF89a: header, logical screen descriptor
  // with a 2-entry global color table, then GCE + image descriptor per frame.
  function buildGif(delays) {
    const bytes = [
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
      0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, // 1x1, GCT flag, size 2
      0x00, 0x00, 0x00, 0xff, 0xff, 0xff, // global color table (2 entries)
    ]
    for (const d of delays) {
      bytes.push(0x21, 0xf9, 0x04, 0x00, d & 0xff, (d >> 8) & 0xff, 0x00, 0x00)
      bytes.push(0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00)
      bytes.push(0x02, 0x02, 0x44, 0x01, 0x00) // LZW min size + one sub-block
    }
    bytes.push(0x3b)
    return new Uint8Array(bytes)
  }

  function readDelays(bytes) {
    const out = []
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
        out.push(bytes[i + 4] | (bytes[i + 5] << 8))
      }
    }
    return out
  }

  it('halves delays at 200% speed', () => {
    expect(readDelays(rewriteGifDelays(buildGif([10, 20, 30]), 200))).toEqual([5, 10, 15])
  })

  it('doubles delays at 50% speed', () => {
    expect(readDelays(rewriteGifDelays(buildGif([10, 20]), 50))).toEqual([20, 40])
  })

  it('clamps to MIN_DELAY so frames never stall the browser', () => {
    expect(readDelays(rewriteGifDelays(buildGif([2, 4]), 1000))).toEqual([2, 2])
  })

  it('leaves the input untouched and preserves length', () => {
    const src = buildGif([10, 20])
    const copy = src.slice()
    const out = rewriteGifDelays(src, 400)
    expect(src).toEqual(copy)
    expect(out.length).toBe(src.length)
  })

  it('preserves every non-delay byte, including pixel data', () => {
    const src = buildGif([10, 20])
    const out = rewriteGifDelays(src, 200)
    const delayOffsets = new Set()
    for (let i = 0; i < src.length - 5; i++) {
      if (src[i] === 0x21 && src[i + 1] === 0xf9) { delayOffsets.add(i + 4); delayOffsets.add(i + 5) }
    }
    for (let i = 0; i < src.length; i++) {
      if (!delayOffsets.has(i)) expect(out[i]).toBe(src[i])
    }
  })

  it('walks past a local color table without losing sync', () => {
    const g = buildGif([10])
    const bytes = Array.from(g)
    const idx = bytes.indexOf(0x2c)
    bytes[idx + 9] = 0x80 // local color table flag, size 2
    bytes.splice(idx + 10, 0, 0, 0, 0, 255, 255, 255)
    // A second frame after the local table must still be found and rescaled.
    const tail = bytes.length - 1
    bytes.splice(tail, 0, 0x21, 0xf9, 0x04, 0x00, 40, 0x00, 0x00, 0x00,
      0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0x02, 0x02, 0x44, 0x01, 0x00)
    expect(readDelays(rewriteGifDelays(new Uint8Array(bytes), 200))).toEqual([5, 20])
  })

  it('rejects non-GIF and truncated input', () => {
    expect(() => rewriteGifDelays(new Uint8Array([1, 2, 3]), 200)).toThrow(/valid GIF/)
    const png = new Uint8Array(20)
    png.set([0x89, 0x50, 0x4e, 0x47])
    expect(() => rewriteGifDelays(png, 200)).toThrow(/valid GIF/)
  })

  it('reports a GIF with no frame timing rather than returning it unchanged', () => {
    expect(() => rewriteGifDelays(buildGif([]), 200)).toThrow(/no frame timing/)
  })
})

describe('computeFitPlan', () => {
  const BUDGET = 120e6

  it('leaves a GIF that already fits untouched', () => {
    const plan = computeFitPlan(500, 500, 100, BUDGET)
    expect(plan.scale).toBe(100)
    expect(plan.skip).toBe(1)
    expect(plan.compressed).toBe(false)
    expect(plan.width).toBe(500)
    expect(plan.frameCount).toBe(100)
  })

  it('fits the real 2808x1650 x597 GIF that used to crash the tab', () => {
    const plan = computeFitPlan(2808, 1650, 597, BUDGET)
    expect(plan.compressed).toBe(true)
    expect(plan.width * plan.height * plan.frameCount).toBeLessThanOrEqual(BUDGET)
    // 10.3 GB decoded at full size; the plan has to land far under that.
    expect((plan.width * plan.height * plan.frameCount * 4) / 1048576).toBeLessThan(500)
  })

  it('gives up resolution before dropping frames', () => {
    // Fits at 50% scale alone, so no frames should be sacrificed.
    const plan = computeFitPlan(2000, 2000, 60, BUDGET)
    expect(plan.skip).toBe(1)
    expect(plan.scale).toBeLessThan(100)
  })

  it('picks the least destructive rung that fits', () => {
    const plan = computeFitPlan(2808, 1650, 597, BUDGET)
    const harder = { scale: 20, skip: 4 }
    expect(plan.scale).toBeGreaterThan(harder.scale)
  })

  it('returns null when even the most aggressive rung overflows', () => {
    expect(computeFitPlan(20000, 20000, 5000, BUDGET)).toBeNull()
  })

  it('rejects unusable input', () => {
    expect(computeFitPlan(0, 100, 10, BUDGET)).toBeNull()
    expect(computeFitPlan(100, 100, 0, BUDGET)).toBeNull()
  })

  it('always reports a plan that actually fits the budget', () => {
    const cases = [[2808, 1650, 597], [1920, 1080, 300], [800, 600, 500], [640, 480, 50]]
    for (const [w, h, n] of cases) {
      const plan = computeFitPlan(w, h, n, BUDGET)
      expect(plan.width * plan.height * plan.frameCount).toBeLessThanOrEqual(BUDGET)
    }
  })
})

describe('keptFrameCount', () => {
  it('counts frames surviving a skip', () => {
    expect(keptFrameCount(597, 1)).toBe(597)
    expect(keptFrameCount(597, 2)).toBe(299)
    expect(keptFrameCount(10, 3)).toBe(4)
  })
})

describe('describeFitPlan', () => {
  it('says nothing when the GIF was not compressed', () => {
    expect(describeFitPlan(computeFitPlan(500, 500, 100, 120e6), 500, 500)).toBe('')
    expect(describeFitPlan(null, 500, 500)).toBe('')
  })

  it('states the new dimensions and frame count concretely', () => {
    const plan = computeFitPlan(2808, 1650, 597, 120e6)
    const msg = describeFitPlan(plan, 2808, 1650)
    expect(msg).toContain('2808×1650')
    expect(msg).toContain(String(plan.width))
    expect(msg).toContain('same total duration')
    expect(msg).not.toContain('—')
  })
})

describe('decodedSizeError', () => {
  const BUDGET = 120e6

  it('passes a normal GIF', () => {
    expect(decodedSizeError(500, 500, 100, BUDGET)).toBeNull()
  })

  it('rejects a GIF whose decoded frames exceed the budget', () => {
    // 862 KB on disk, 1.24 GB decoded — this is the case that crashed the tab.
    const msg = decodedSizeError(2808, 1650, 72, BUDGET)
    expect(msg).toContain('2808×1650')
    expect(msg).toContain('72 frames')
    expect(msg).toContain('1273 MB')
    expect(msg).not.toContain('—')
  })

  it('reports memory from dimensions and frame count, not file size', () => {
    // Same pixel budget reached two ways — both must be rejected.
    expect(decodedSizeError(4000, 4000, 10, BUDGET)).not.toBeNull()
    expect(decodedSizeError(400, 400, 1000, BUDGET)).not.toBeNull()
  })

  it('skips the check when dimensions or frame count are unknown', () => {
    expect(decodedSizeError(0, 1650, 72, BUDGET)).toBeNull()
    expect(decodedSizeError(2808, undefined, 72, BUDGET)).toBeNull()
    expect(decodedSizeError(2808, 1650, 0, BUDGET)).toBeNull()
  })

  it('allows a GIF exactly at the budget', () => {
    expect(decodedSizeError(1000, 1000, 120, BUDGET)).toBeNull()
    expect(decodedSizeError(1000, 1000, 121, BUDGET)).not.toBeNull()
  })
})
