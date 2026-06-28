import { describe, it, expect } from 'vitest'
import { markdownToHtml } from './markdown-to-html-core.js'

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('')
    expect(markdownToHtml('   ')).toBe('')
  })

  it('converts headings', () => {
    expect(markdownToHtml('# Hello')).toContain('<h1>Hello</h1>')
    expect(markdownToHtml('## World')).toContain('<h2>World</h2>')
  })

  it('converts bold and italic', () => {
    var html = markdownToHtml('**bold** and *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('converts links', () => {
    var html = markdownToHtml('[maratool](https://maratool.com)')
    expect(html).toContain('<a href="https://maratool.com">maratool</a>')
  })

  it('converts unordered lists', () => {
    var html = markdownToHtml('- one\n- two')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
  })

  it('converts fenced code blocks', () => {
    var html = markdownToHtml('```\nconst x = 1\n```')
    expect(html).toContain('<pre><code>')
    expect(html).toContain('const x = 1')
  })

  it('escapes HTML in paragraphs', () => {
    var html = markdownToHtml('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
