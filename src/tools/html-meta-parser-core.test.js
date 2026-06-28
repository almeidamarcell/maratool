/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { parseMetaFromHtml } from './html-meta-parser-core.js'

describe('parseMetaFromHtml', () => {
  it('extracts title and description', () => {
    var html = '<html><head><title>Hello</title><meta name="description" content="A page" /></head></html>'
    var meta = parseMetaFromHtml(html)
    expect(meta.title).toBe('Hello')
    expect(meta.description).toBe('A page')
  })

  it('extracts Open Graph tags', () => {
    var html = '<meta property="og:title" content="OG Title" /><meta property="og:image" content="https://x.com/a.png" />'
    var meta = parseMetaFromHtml(html)
    expect(meta.og.title).toBe('OG Title')
    expect(meta.og.image).toBe('https://x.com/a.png')
  })

  it('returns error for empty input', () => {
    expect(parseMetaFromHtml('').error).toBeTruthy()
  })
})
