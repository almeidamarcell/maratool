/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { parseSitemapXml, validateSitemap } from './sitemap-validator-core.js'

var URLSET = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
</urlset>`

describe('parseSitemapXml', () => {
  it('parses urlset', () => {
    var parsed = parseSitemapXml(URLSET)
    expect(parsed.type).toBe('urlset')
    expect(parsed.urls.length).toBe(2)
  })

  it('rejects invalid xml', () => {
    expect(parseSitemapXml('<not>xml').error).toBeTruthy()
  })
})

describe('validateSitemap', () => {
  it('validates a good sitemap', () => {
    var result = validateSitemap(parseSitemapXml(URLSET))
    expect(result.valid).toBe(true)
    expect(result.stats.count).toBe(2)
  })

  it('flags duplicate urls', () => {
    var dup = URLSET.replace('</urlset>', '<url><loc>https://example.com/</loc></url></urlset>')
    var result = validateSitemap(parseSitemapXml(dup))
    expect(result.issues.some(function (i) { return i.message.indexOf('Duplicate') !== -1 })).toBe(true)
  })
})
