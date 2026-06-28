import { describe, it, expect } from 'vitest'
import { applyGifOperation, getResizeTargetDims, getCropRegionForFrame } from './gif-anim-ui.js'

describe('applyGifOperation via gif-anim-ui', () => {
  it('reverses frames and delays together', () => {
    const frames = [{ rgba: new Uint8ClampedArray(4) }, { rgba: new Uint8ClampedArray(4) }]
    const delays = [10, 20]
    const out = applyGifOperation('reverse', frames, delays, {})
    expect(out.frames).toHaveLength(2)
    expect(out.delays).toEqual([20, 10])
  })
})

describe('getResizeTargetDims', () => {
  it('computes contain dimensions', () => {
    expect(getResizeTargetDims(800, 600, { width: 400, height: 400, mode: 'contain' })).toEqual({
      width: 400,
      height: 300,
    })
  })
})

describe('getCropRegionForFrame', () => {
  it('returns valid crop', () => {
    expect(getCropRegionForFrame(100, 100, { cropW: 50, cropH: 50, cropX: 10, cropY: 10 })).toEqual({
      x: 10, y: 10, width: 50, height: 50,
    })
  })
})
