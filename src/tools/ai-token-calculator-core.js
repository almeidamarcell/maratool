export const TOKEN_MODELS = {
  'gpt-4o': { name: 'GPT-4o', charsPerToken: 4, wordFactor: 1.3 },
  'gpt-4o-mini': { name: 'GPT-4o mini', charsPerToken: 4, wordFactor: 1.3 },
  'gpt-4': { name: 'GPT-4', charsPerToken: 4, wordFactor: 1.3 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', charsPerToken: 4, wordFactor: 1.3 },
  'claude-sonnet': { name: 'Claude Sonnet', charsPerToken: 3.5, wordFactor: 1.25 },
  'claude-opus': { name: 'Claude Opus', charsPerToken: 3.5, wordFactor: 1.25 },
  'gemini-pro': { name: 'Gemini Pro', charsPerToken: 4, wordFactor: 1.3 },
  'llama-3': { name: 'Llama 3', charsPerToken: 4, wordFactor: 1.3 },
}

export function countWords(text) {
  if (!text || !text.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function countTokens(text, modelId) {
  if (!text) return 0
  var model = TOKEN_MODELS[modelId] || TOKEN_MODELS['gpt-4o']
  var chars = text.length
  var words = countWords(text)
  var charEstimate = Math.ceil(chars / model.charsPerToken)
  var wordEstimate = Math.ceil(words * model.wordFactor)
  return Math.max(charEstimate, wordEstimate, words > 0 ? 1 : 0)
}

export function getTextStats(text, modelId) {
  return {
    characters: text ? text.length : 0,
    words: countWords(text),
    tokens: countTokens(text, modelId),
  }
}
