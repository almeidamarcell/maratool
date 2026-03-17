import { describe, it, expect } from 'vitest'
import { buildRule, buildRobotsTxt, validatePath } from './robots-txt-generator-core.js'

describe('validatePath', () => {
  it('/ is valid', () => {
    expect(validatePath('/').valid).toBe(true)
  })

  it('/admin/ is valid', () => {
    expect(validatePath('/admin/').valid).toBe(true)
  })

  it('admin (no leading slash) is invalid', () => {
    var result = validatePath('admin')
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('empty string is invalid', () => {
    expect(validatePath('').valid).toBe(false)
  })

  it('/wp-admin is valid', () => {
    expect(validatePath('/wp-admin').valid).toBe(true)
  })
})

describe('buildRule', () => {
  it('single Disallow produces correct format', () => {
    var rule = buildRule('*', [{ type: 'Disallow', path: '/admin/' }])
    expect(rule).toContain('User-agent: *')
    expect(rule).toContain('Disallow: /admin/')
  })

  it('multiple directives are all present', () => {
    var rule = buildRule('Googlebot', [
      { type: 'Allow', path: '/public/' },
      { type: 'Disallow', path: '/private/' },
    ])
    expect(rule).toContain('User-agent: Googlebot')
    expect(rule).toContain('Allow: /public/')
    expect(rule).toContain('Disallow: /private/')
  })

  it('wildcard user-agent is formatted correctly', () => {
    var rule = buildRule('*', [{ type: 'Disallow', path: '/' }])
    expect(rule).toContain('User-agent: *')
  })
})

describe('buildRobotsTxt', () => {
  var rules = [{ userAgent: '*', directives: [{ type: 'Disallow', path: '/admin/' }] }]

  it('adds Sitemap: line when sitemapUrl is provided', () => {
    var result = buildRobotsTxt(rules, 'https://example.com/sitemap.xml')
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml')
  })

  it('omits Sitemap when not provided', () => {
    var result = buildRobotsTxt(rules)
    expect(result).not.toContain('Sitemap:')
  })

  it('multiple rules are separated by blank lines', () => {
    var multiRules = [
      { userAgent: '*', directives: [{ type: 'Disallow', path: '/' }] },
      { userAgent: 'Googlebot', directives: [{ type: 'Allow', path: '/' }] },
    ]
    var result = buildRobotsTxt(multiRules)
    expect(result).toContain('\n\n')
  })

  it('crawlDelay adds Crawl-delay line', () => {
    var result = buildRobotsTxt(rules, '', 10)
    expect(result).toContain('Crawl-delay: 10')
  })
})
