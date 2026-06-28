import { describe, it, expect } from 'vitest'
import { calcRagChunks } from './rag-chunk-core.js'

describe('calcRagChunks', () => {
  it('returns zero chunks for zero tokens', () => {
    var r = calcRagChunks({ totalTokens: 0, chunkSize: 500, overlap: 50 })
    expect(r.chunkCount).toBe(0)
  })

  it('calculates chunk count with overlap', () => {
    var r = calcRagChunks({ totalTokens: 1000, chunkSize: 300, overlap: 50 })
    expect(r.chunkCount).toBe(4)
    expect(r.stepSize).toBe(250)
  })

  it('rejects overlap >= chunk size', () => {
    expect(calcRagChunks({ totalTokens: 100, chunkSize: 100, overlap: 100 }).error).toBeTruthy()
  })
})
