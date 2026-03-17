import { describe, it, expect } from 'vitest'
import { normalizeUrl, validateUrl, buildUtmUrl } from './utm-builder-core.js'

describe('normalizeUrl', () => {
  it('prepends https:// when no protocol', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com')
  })

  it('preserves existing https://', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('preserves http://', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('trims whitespace', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com')
  })
})

describe('validateUrl', () => {
  it('valid https URL returns valid true', () => {
    expect(validateUrl('https://example.com')).toEqual({ valid: true })
  })

  it('valid http URL returns valid true', () => {
    expect(validateUrl('http://example.com')).toEqual({ valid: true })
  })

  it('invalid string returns valid false', () => {
    var result = validateUrl('not-a-url')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('ftp:// returns valid false', () => {
    var result = validateUrl('ftp://example.com')
    expect(result.valid).toBe(false)
  })

  it('empty string returns valid false', () => {
    var result = validateUrl('')
    expect(result.valid).toBe(false)
  })
})

describe('buildUtmUrl', () => {
  var base = 'https://example.com'
  var required = { source: 'google', medium: 'cpc', campaign: 'spring-sale' }

  it('appends params with ? for clean URL', () => {
    var result = buildUtmUrl(base, required)
    expect(result).toContain('?')
    expect(result).toContain('utm_source=google')
    expect(result).toContain('utm_medium=cpc')
    expect(result).toContain('utm_campaign=spring-sale')
  })

  it('appends with & when URL has existing query params', () => {
    var url = 'https://example.com?ref=home'
    var result = buildUtmUrl(url, required)
    expect(result).toContain('?ref=home')
    expect(result).toContain('&utm_source=google')
  })

  it('encodes special chars in values', () => {
    var result = buildUtmUrl(base, { source: 'google ads', medium: 'cpc', campaign: 'sale & promo' })
    expect(result).toContain('utm_source=google%20ads')
    expect(result).toContain('utm_campaign=sale%20%26%20promo')
  })

  it('skips empty optional params', () => {
    var result = buildUtmUrl(base, { ...required, term: '', content: '' })
    expect(result).not.toContain('utm_term')
    expect(result).not.toContain('utm_content')
  })

  it('includes optional params when provided', () => {
    var result = buildUtmUrl(base, { ...required, term: 'keyword', content: 'banner-a' })
    expect(result).toContain('utm_term=keyword')
    expect(result).toContain('utm_content=banner-a')
  })

  it('preserves hash fragment (UTM params before #)', () => {
    var url = 'https://example.com/page#section'
    var result = buildUtmUrl(url, required)
    var hashIdx = result.indexOf('#section')
    var utmIdx = result.indexOf('utm_source')
    expect(utmIdx).toBeLessThan(hashIdx)
    expect(result).toContain('#section')
  })

  it('returns empty string when source is missing', () => {
    expect(buildUtmUrl(base, { medium: 'cpc', campaign: 'sale' })).toBe('')
  })

  it('returns empty string when medium is missing', () => {
    expect(buildUtmUrl(base, { source: 'google', campaign: 'sale' })).toBe('')
  })

  it('returns empty string when campaign is missing', () => {
    expect(buildUtmUrl(base, { source: 'google', medium: 'cpc' })).toBe('')
  })

  it('handles trailing slash in base URL', () => {
    var result = buildUtmUrl('https://example.com/', required)
    expect(result).toContain('utm_source=google')
    expect(result).toContain('https://example.com/')
  })
})
