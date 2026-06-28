import { calculateCost, MODEL_PRICING } from './ai-cost-calculator-core.js'

/** Compare API costs across models for the same token counts */

export function compareModels(inputTokens, outputTokens, modelIds) {
  const ids = (modelIds && modelIds.length ? modelIds : Object.keys(MODEL_PRICING))
    .filter(id => MODEL_PRICING[id])

  const rows = ids.map(id => {
    const cost = calculateCost(inputTokens, outputTokens, id)
    const pricing = MODEL_PRICING[id]
    return {
      id,
      model: pricing.name,
      inputCost: cost.inputCost,
      outputCost: cost.outputCost,
      totalCost: cost.totalCost,
    }
  })

  return rows.sort((a, b) => a.totalCost - b.totalCost)
}
