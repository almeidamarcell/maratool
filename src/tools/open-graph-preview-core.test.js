/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { resolveOgPreview, ogPreviewFromHtml } from './open-graph-preview-core.js'

describe('resolveOgPreview', () => {
  it('falls back from og fields to basic meta', () => {
    var preview = resolveOgPreview({
      title: 'Page Title',
      description: 'Page desc',
      ogTitle: '',
      ogDescription: '',
    })
    expect(preview.title).toBe('Page Title')
    expect(preview.description).toBe('Page desc')
  })

  it('detects when image is missing', () => {
    expect(resolveOgPreview({ title: 'T', description: 'D' }).hasImage).toBe(false)
  })
})

describe('ogPreviewFromHtml', () => {
  it('builds preview from HTML string', () => {
    var html = '<title>My Page</title><meta property="og:image" content="https://cdn.example.com/og.png" />'
    var preview = ogPreviewFromHtml(html)
    expect(preview.title).toBe('My Page')
    expect(preview.hasImage).toBe(true)
  })
})
