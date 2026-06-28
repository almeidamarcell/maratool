import { describe, test, expect } from 'vitest'
import { buildHttpRequest, buildCurlFromRequest, generateMockResponse, inspectWebhookPayload } from './wave4-api-ext-core.js'

describe('buildHttpRequest', () => {
  test('formats raw HTTP request', () => {
    const r = buildHttpRequest({ url: 'https://api.example.com/x', method: 'POST', body: '{}' })
    expect(r).toContain('POST https://api.example.com/x')
    expect(r).toContain('{}')
  })
})

describe('buildCurlFromRequest', () => {
  test('builds curl command', () => {
    expect(buildCurlFromRequest({ url: 'https://x.test', method: 'GET' })).toContain('curl -X GET')
  })
})

describe('generateMockResponse', () => {
  test('generates sample from schema', () => {
    const out = JSON.parse(generateMockResponse({ type: 'object', properties: { id: { type: 'integer' } } }))
    expect(out.id).toBe(1)
  })
})

describe('inspectWebhookPayload', () => {
  test('parses webhook JSON', () => {
    const r = inspectWebhookPayload('{"event":"ping"}')
    expect(r.valid).toBe(true)
    expect(r.keys).toContain('event')
  })
})
