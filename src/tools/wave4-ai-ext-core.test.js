import { describe, test, expect } from 'vitest'
import {
  estimateVisionTokens,
  cleanupMarkdown,
  promptDiff,
  promptVersionCompare,
  formatAiOutput,
  generateJsonSchemaFromJson,
} from './wave4-ai-ext-core.js'

describe('estimateVisionTokens', () => {
  test('low detail is flat 85 tokens', () => {
    expect(estimateVisionTokens(1024, 1024, 'low').tokens).toBe(85)
  })
  test('high detail scales with tiles', () => {
    expect(estimateVisionTokens(512, 512, 'high').tokens).toBe(255)
  })
})

describe('cleanupMarkdown', () => {
  test('trims trailing spaces and extra blank lines', () => {
    expect(cleanupMarkdown('a  \n\n\nb')).toBe('a\n\nb')
  })
})

describe('promptDiff', () => {
  test('marks added and removed lines', () => {
    const d = promptDiff('a\nb', 'a\nc')
    expect(d.some(x => x.type === 'added' && x.text === 'c')).toBe(true)
    expect(d.some(x => x.type === 'removed' && x.text === 'b')).toBe(true)
  })
})

describe('promptVersionCompare', () => {
  test('counts change stats', () => {
    const r = promptVersionCompare('x', 'y')
    expect(r.added).toBe(1)
    expect(r.removed).toBe(1)
  })
})

describe('formatAiOutput', () => {
  test('pretty prints fenced JSON', () => {
    const r = formatAiOutput('```json\n{"a":1}\n```', 'json')
    expect(r.output).toContain('"a": 1')
  })
})

describe('generateJsonSchemaFromJson', () => {
  test('infers object schema', () => {
    const r = generateJsonSchemaFromJson('{"name":"Ada","age":30}')
    expect(r.schema.properties.name.type).toBe('string')
    expect(r.schema.properties.age.type).toBe('integer')
  })
})
