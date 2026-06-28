import { describe, it, expect } from 'vitest'
import { extractJsonFromText } from './llm-json-extract-core.js'

describe('extractJsonFromText', () => {
  it('extracts fenced json block', () => {
    var text = 'Here is the result:\n```json\n{"ok":true}\n```\nDone.'
    var r = extractJsonFromText(text)
    expect(r.blocks.length).toBe(1)
    expect(r.blocks[0].valid).toBe(true)
    expect(JSON.parse(r.blocks[0].json).ok).toBe(true)
  })

  it('extracts raw object when no fence', () => {
    var r = extractJsonFromText('Output: {"a":1}')
    expect(r.blocks.length).toBeGreaterThan(0)
  })

  it('marks invalid json', () => {
    var r = extractJsonFromText('```json\n{bad}\n```')
    expect(r.blocks[0].valid).toBe(false)
  })
})
