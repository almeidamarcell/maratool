import { describe, it, expect } from 'vitest'
import { compareModels } from './ai-model-comparison-core.js'

describe('compareModels', () => {
  it('returns costs for each selected model', () => {
    var rows = compareModels(1000, 500, ['gpt-4o', 'gpt-4o-mini'])
    expect(rows.length).toBe(2)
    expect(rows[0].model).toBeTruthy()
    expect(rows[0].totalCost).toBeGreaterThanOrEqual(0)
  })

  it('sorts by total cost ascending', () => {
    var rows = compareModels(10000, 5000, ['gpt-4o', 'gpt-4o-mini', 'gpt-4'])
    expect(rows[0].totalCost).toBeLessThanOrEqual(rows[1].totalCost)
  })
})
