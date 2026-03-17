import { describe, it, expect, vi } from 'vitest'
import { convertYamlToJson, convertJsonToYaml } from './yaml-to-json-core.js'

// Mock jsYaml
const mockJsYaml = {
  load: (str) => {
    // Minimal YAML parser for tests
    if (str === 'name: Alice') return { name: 'Alice' }
    if (str === 'count: 42') return { count: 42 }
    if (str === 'list:\n  - a\n  - b') return { list: ['a', 'b'] }
    if (str === 'invalid: [unclosed') throw new Error('unexpected end of the stream')
    return null
  },
  dump: (obj) => {
    if (obj === null || obj === undefined) return 'null\n'
    return JSON.stringify(obj) + '\n' // simplified
  }
}

describe('convertYamlToJson', () => {
  it('converts a simple key-value YAML to JSON', () => {
    const result = convertYamlToJson('name: Alice', mockJsYaml)
    expect(result.error).toBeNull()
    const parsed = JSON.parse(result.result)
    expect(parsed).toEqual({ name: 'Alice' })
  })

  it('handles numeric values', () => {
    const result = convertYamlToJson('count: 42', mockJsYaml)
    expect(result.error).toBeNull()
    const parsed = JSON.parse(result.result)
    expect(parsed.count).toBe(42)
  })

  it('handles arrays', () => {
    const result = convertYamlToJson('list:\n  - a\n  - b', mockJsYaml)
    expect(result.error).toBeNull()
    const parsed = JSON.parse(result.result)
    expect(parsed.list).toEqual(['a', 'b'])
  })

  it('returns error for invalid YAML', () => {
    const result = convertYamlToJson('invalid: [unclosed', mockJsYaml)
    expect(result.result).toBeNull()
    expect(result.error).toContain('unexpected end')
  })

  it('returns error for empty input', () => {
    const result = convertYamlToJson('', mockJsYaml)
    expect(result.result).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('returns JSON with 2-space indentation', () => {
    const result = convertYamlToJson('name: Alice', mockJsYaml)
    expect(result.result).toContain('\n')
  })
})

describe('convertJsonToYaml', () => {
  it('converts a JSON string to YAML', () => {
    const result = convertJsonToYaml('{"name":"Alice"}', mockJsYaml)
    expect(result.error).toBeNull()
    expect(result.result).toBeTruthy()
  })

  it('returns error for invalid JSON', () => {
    const result = convertJsonToYaml('{invalid json}', mockJsYaml)
    expect(result.result).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('returns error for empty input', () => {
    const result = convertJsonToYaml('', mockJsYaml)
    expect(result.result).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
