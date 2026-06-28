/** RAG chunking estimates */

export function calcRagChunks({ totalTokens, chunkSize, overlap }) {
  const total = Math.max(0, Number(totalTokens) || 0)
  const size = Number(chunkSize) || 0
  const ov = Math.max(0, Number(overlap) || 0)

  if (size <= 0) return { error: 'Chunk size must be greater than zero' }
  if (ov >= size) return { error: 'Overlap must be less than chunk size' }

  if (total === 0) {
    return { chunkCount: 0, stepSize: size - ov, effectiveChunkSize: size, overlap: ov }
  }

  const step = size - ov
  const chunkCount = total <= size ? 1 : Math.ceil((total - ov) / step)

  return {
    chunkCount,
    stepSize: step,
    effectiveChunkSize: size,
    overlap: ov,
    totalTokens: total,
  }
}
