import { describe, it, expect } from 'vitest'
import { parseUrl } from './url-parser-core.js'

describe('parseUrl', () => {
  it('parses standard https URL', () => {
    var r = parseUrl('https://user:pass@example.com:8080/path?q=1#hash')
    expect(r.valid).toBe(true)
    expect(r.protocol).toBe('https:')
    expect(r.hostname).toBe('example.com')
    expect(r.port).toBe('8080')
    expect(r.pathname).toBe('/path')
    expect(r.search).toBe('?q=1')
    expect(r.hash).toBe('#hash')
  })

  it('returns error for invalid URL', () => {
    expect(parseUrl('not a url').valid).toBe(false)
  })
})
