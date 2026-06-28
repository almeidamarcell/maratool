/** AI model context window limits */

export const CONTEXT_MODELS = {
  'gpt-4o': { name: 'GPT-4o', contextWindow: 128000 },
  'gpt-4o-mini': { name: 'GPT-4o mini', contextWindow: 128000 },
  'gpt-4': { name: 'GPT-4', contextWindow: 8192 },
  'claude-sonnet': { name: 'Claude Sonnet', contextWindow: 200000 },
  'claude-opus': { name: 'Claude Opus', contextWindow: 200000 },
  'gemini-pro': { name: 'Gemini Pro', contextWindow: 1000000 },
  'llama-3': { name: 'Llama 3', contextWindow: 8192 },
}

export function estimateTokens(text) {
  if (!text) return 0
  // Same heuristic as ai-token-calculator: ~4 chars per token for English
  return Math.ceil(text.length / 4)
}

export function contextUsage(tokenCount, modelId) {
  const model = CONTEXT_MODELS[modelId] || CONTEXT_MODELS['gpt-4o']
  const limit = model.contextWindow
  const pct = limit > 0 ? (tokenCount / limit) * 100 : 0
  const remaining = Math.max(0, limit - tokenCount)
  return {
    model: model.name,
    limit,
    tokens: tokenCount,
    percent: pct,
    remaining,
    overLimit: tokenCount > limit,
  }
}
