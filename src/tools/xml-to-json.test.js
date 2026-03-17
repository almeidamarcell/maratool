import { describe, it, expect } from 'vitest'
import { xmlNodeToObject, parseXmlToJson, convertXmlToJson } from './xml-to-json-core.js'

// Minimal mock DOMParser for Node.js test environment
class MockDOMParser {
  parseFromString(str, type) {
    // Return a minimal document-like object based on the input
    if (str.includes('parseerror') || str.includes('<broken>')) {
      return {
        documentElement: {
          nodeName: 'parsererror',
          nodeType: 1,
          childNodes: [],
          attributes: { length: 0 },
          textContent: 'parse error',
        }
      }
    }
    // Simulate <root><name>Alice</name></root>
    if (str === '<root><name>Alice</name></root>') {
      return {
        documentElement: {
          nodeName: 'root',
          nodeType: 1,
          attributes: { length: 0 },
          childNodes: [
            {
              nodeName: 'name',
              nodeType: 1,
              attributes: { length: 0 },
              childNodes: [{ nodeType: 3, nodeValue: 'Alice', childNodes: [] }]
            }
          ]
        }
      }
    }
    // Simulate <root attr="x"><item>1</item><item>2</item></root>
    if (str.includes('attr=')) {
      return {
        documentElement: {
          nodeName: 'root',
          nodeType: 1,
          attributes: { length: 1, 0: { name: 'attr', value: 'x' } },
          childNodes: [
            {
              nodeName: 'item', nodeType: 1, attributes: { length: 0 },
              childNodes: [{ nodeType: 3, nodeValue: '1', childNodes: [] }]
            },
            {
              nodeName: 'item', nodeType: 1, attributes: { length: 0 },
              childNodes: [{ nodeType: 3, nodeValue: '2', childNodes: [] }]
            }
          ]
        }
      }
    }
    return {
      documentElement: {
        nodeName: 'root',
        nodeType: 1,
        attributes: { length: 0 },
        childNodes: []
      }
    }
  }
}

describe('xmlNodeToObject', () => {
  it('converts a simple element with text content', () => {
    const node = {
      nodeName: 'name',
      nodeType: 1,
      attributes: { length: 0 },
      childNodes: [{ nodeType: 3, nodeValue: 'Alice', childNodes: [] }]
    }
    const result = xmlNodeToObject(node)
    expect(result).toEqual({ name: 'Alice' })
  })

  it('converts element with attributes', () => {
    const node = {
      nodeName: 'item',
      nodeType: 1,
      attributes: { length: 1, 0: { name: 'id', value: '42' } },
      childNodes: []
    }
    const result = xmlNodeToObject(node)
    expect(result.item['@id']).toBe('42')
  })

  it('converts repeated child elements into an array', () => {
    const node = {
      nodeName: 'root',
      nodeType: 1,
      attributes: { length: 0 },
      childNodes: [
        { nodeName: 'item', nodeType: 1, attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeValue: '1', childNodes: [] }] },
        { nodeName: 'item', nodeType: 1, attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeValue: '2', childNodes: [] }] }
      ]
    }
    const result = xmlNodeToObject(node)
    expect(Array.isArray(result.root.item)).toBe(true)
    expect(result.root.item).toHaveLength(2)
  })
})

describe('convertXmlToJson', () => {
  it('converts a simple XML document to JSON string', () => {
    const result = convertXmlToJson('<root><name>Alice</name></root>', MockDOMParser)
    expect(result.error).toBeNull()
    const parsed = JSON.parse(result.result)
    expect(parsed.root.name).toBe('Alice')
  })

  it('returns error for empty input', () => {
    const result = convertXmlToJson('', MockDOMParser)
    expect(result.result).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('returns error for parse errors', () => {
    const result = convertXmlToJson('<broken>', MockDOMParser)
    expect(result.result).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('output is valid JSON', () => {
    const result = convertXmlToJson('<root><name>Alice</name></root>', MockDOMParser)
    expect(() => JSON.parse(result.result)).not.toThrow()
  })
})
