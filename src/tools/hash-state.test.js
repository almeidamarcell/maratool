import { describe, it, expect, vi } from 'vitest'
import { encode, decode, debounce } from './hash-state.js'

describe('encode', () => {
  it('returns empty string for empty object', () => {
    expect(encode({})).toBe('')
  })

  it('encodes a single key-value pair', () => {
    expect(encode({ input: 'hello' })).toBe('input=hello')
  })

  it('encodes multiple key-value pairs', () => {
    expect(encode({ a: 'foo', b: 'bar' })).toBe('a=foo&b=bar')
  })

  it('omits empty string values', () => {
    expect(encode({ a: 'foo', b: '', c: 'baz' })).toBe('a=foo&c=baz')
  })

  it('omits null and undefined values', () => {
    expect(encode({ a: 'foo', b: null, c: undefined })).toBe('a=foo')
  })

  it('encodes special characters', () => {
    expect(encode({ q: 'a&b=c d' })).toBe('q=a%26b%3Dc%20d')
  })

  it('encodes unicode characters', () => {
    var result = encode({ text: 'cafe\u0301' })
    expect(decode(result).text).toBe('cafe\u0301')
  })
})

describe('decode', () => {
  it('returns empty object for empty string', () => {
    expect(decode('')).toEqual({})
  })

  it('returns empty object for null/undefined', () => {
    expect(decode(null)).toEqual({})
    expect(decode(undefined)).toEqual({})
  })

  it('decodes a single key-value pair', () => {
    expect(decode('input=hello')).toEqual({ input: 'hello' })
  })

  it('decodes multiple key-value pairs', () => {
    expect(decode('a=foo&b=bar')).toEqual({ a: 'foo', b: 'bar' })
  })

  it('decodes percent-encoded special characters', () => {
    expect(decode('q=a%26b%3Dc%20d')).toEqual({ q: 'a&b=c d' })
  })

  it('handles values containing equals signs', () => {
    expect(decode('input=a=b=c')).toEqual({ input: 'a=b=c' })
  })

  it('skips entries without equals sign', () => {
    expect(decode('orphan&a=1')).toEqual({ a: '1' })
  })
})

describe('round-trip', () => {
  it('encode then decode returns original object', () => {
    var obj = { input: 'hello world', tab: 'text' }
    expect(decode(encode(obj))).toEqual(obj)
  })

  it('round-trips special characters', () => {
    var obj = { q: 'foo&bar=baz', text: 'line1\nline2' }
    expect(decode(encode(obj))).toEqual(obj)
  })

  it('round-trips unicode', () => {
    var obj = { text: '\u{1F600} emoji \u00E9' }
    expect(decode(encode(obj))).toEqual(obj)
  })
})

describe('debounce', () => {
  it('fires after the delay', async () => {
    vi.useFakeTimers()
    var called = 0
    var fn = debounce(function () { called++ }, 100)
    fn()
    expect(called).toBe(0)
    vi.advanceTimersByTime(100)
    expect(called).toBe(1)
    vi.useRealTimers()
  })

  it('resets on repeated calls', () => {
    vi.useFakeTimers()
    var called = 0
    var fn = debounce(function () { called++ }, 100)
    fn()
    vi.advanceTimersByTime(50)
    fn()
    vi.advanceTimersByTime(50)
    expect(called).toBe(0)
    vi.advanceTimersByTime(50)
    expect(called).toBe(1)
    vi.useRealTimers()
  })
})
