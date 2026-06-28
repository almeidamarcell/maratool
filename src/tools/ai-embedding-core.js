/** Embedding API pricing per 1M tokens (approximate, early 2026) */

export const EMBEDDING_PRICING = {
  'text-embedding-3-small': { name: 'OpenAI text-embedding-3-small', perMillion: 0.02 },
  'text-embedding-3-large': { name: 'OpenAI text-embedding-3-large', perMillion: 0.13 },
  'text-embedding-ada-002': { name: 'OpenAI ada-002', perMillion: 0.10 },
  'cohere-embed': { name: 'Cohere Embed', perMillion: 0.10 },
  'voyage-2': { name: 'Voyage 2', perMillion: 0.10 },
}

export function calcEmbeddingCost(tokens, modelId) {
  const p = EMBEDDING_PRICING[modelId] || EMBEDDING_PRICING['text-embedding-3-small']
  const t = Math.max(0, Number(tokens) || 0)
  return { cost: (t / 1_000_000) * p.perMillion, model: p.name, tokens: t }
}

export function formatUsd(n) {
  if (n === 0) return '$0.00'
  if (n < 0.01) return '$' + n.toFixed(4)
  return '$' + n.toFixed(4)
}
