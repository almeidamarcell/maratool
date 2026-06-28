import { describe, test, expect } from 'vitest'
import {
  validateXml,
  parseToml,
  tomlToJson,
  flattenJson,
  flattenJsonString,
  testJsonPath,
} from './wave4-data-ext-core.js'

class MockDOMParser {
  parseFromString(str) {
    if (str.includes('<broken')) {
      return { querySelector: () => ({ textContent: 'XML parse error' }) }
    }
    return { querySelector: () => null }
  }
}

describe('validateXml', () => {
  test('accepts valid xml', () => {
    expect(validateXml('<root><a/></root>', MockDOMParser).valid).toBe(true)
  })
  test('rejects broken xml', () => {
    expect(validateXml('<broken', MockDOMParser).valid).toBe(false)
  })
})

describe('parseToml', () => {
  test('parses key values and sections', () => {
    const r = parseToml('name = "Ada"\n[meta]\nage = 30')
    expect(r.data.meta.age).toBe(30)
  })
})

describe('tomlToJson', () => {
  test('converts to json', () => {
    const r = tomlToJson('x = 1')
    expect(JSON.parse(r.json).x).toBe(1)
  })
})

describe('flattenJson', () => {
  test('flattens nested object', () => {
    expect(flattenJson({ a: { b: 1 } })).toEqual({ 'a.b': 1 })
  })
})

describe('flattenJsonString', () => {
  test('parses and flattens', () => {
    const r = flattenJsonString('{"a":{"b":2}}')
    expect(r.result['a.b']).toBe(2)
  })
})

describe('testJsonPath', () => {
  test('reads nested path', () => {
    const r = testJsonPath('{"users":[{"name":"Ada"}]}', '$.users[0].name')
    expect(r.value).toBe('Ada')
  })
})
