export const MODEL_PRICING = {
  'gpt-4o': { name: 'GPT-4o', inputPerMillion: 2.5, outputPerMillion: 10 },
  'gpt-4o-mini': { name: 'GPT-4o mini', inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'gpt-4': { name: 'GPT-4', inputPerMillion: 30, outputPerMillion: 60 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', inputPerMillion: 0.5, outputPerMillion: 1.5 },
  'claude-sonnet': { name: 'Claude Sonnet', inputPerMillion: 3, outputPerMillion: 15 },
  'claude-opus': { name: 'Claude Opus', inputPerMillion: 15, outputPerMillion: 75 },
  'gemini-pro': { name: 'Gemini Pro', inputPerMillion: 1.25, outputPerMillion: 5 },
  'llama-3': { name: 'Llama 3 (hosted)', inputPerMillion: 0.2, outputPerMillion: 0.2 },
}

export function calculateCost(inputTokens, outputTokens, modelId) {
  var pricing = MODEL_PRICING[modelId] || MODEL_PRICING['gpt-4o']
  var input = Math.max(0, Number(inputTokens) || 0)
  var output = Math.max(0, Number(outputTokens) || 0)
  var inputCost = (input / 1_000_000) * pricing.inputPerMillion
  var outputCost = (output / 1_000_000) * pricing.outputPerMillion
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: pricing.name,
  }
}

export function formatUsd(amount) {
  if (amount === 0) return '$0.00'
  if (amount < 0.01) return '$' + amount.toFixed(4)
  if (amount < 1) return '$' + amount.toFixed(3)
  return '$' + amount.toFixed(2)
}
