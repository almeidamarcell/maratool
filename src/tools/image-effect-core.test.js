import { describe, test, expect } from 'vitest'
import { invertRgba, partialShuffleIndices, halftoneRgba } from './image-effect-core.js'

describe('image-effect-core', () => {
  test('invertRgba inverts all channels', () => {
    var data = new Uint8ClampedArray([100, 150, 200, 255])
    var out = invertRgba(data)
    expect(out[0]).toBe(155)
    expect(out[1]).toBe(105)
    expect(out[2]).toBe(55)
    expect(out[3]).toBe(255)
  })

  test('partialShuffleIndices keeps group boundaries', () => {
    var out = partialShuffleIndices(6, 2, function () { return 0.5 })
    expect(out.length).toBe(6)
    expect(out.sort().join(',')).toBe('0,1,2,3,4,5')
  })

  test('halftoneRgba returns same length buffer', () => {
    var data = new Uint8ClampedArray(16)
    for (var i = 0; i < 16; i += 4) { data[i] = 0; data[i + 3] = 255 }
    var out = halftoneRgba(data, 2, 2, 2, 'dots', false)
    expect(out.length).toBe(16)
  })
})
