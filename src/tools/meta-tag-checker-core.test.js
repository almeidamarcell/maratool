import { describe, it, expect } from 'vitest'
import { analyzeMetaTags } from './meta-tag-checker-core.js'

describe('analyzeMetaTags', () => {
  it('flags missing title and description', () => {
    var result = analyzeMetaTags({ title: '', description: '', canonical: '', og: {}, twitter: {} })
    expect(result.issues.some(function (i) { return i.field === 'title' && i.level === 'error' })).toBe(true)
    expect(result.issues.some(function (i) { return i.field === 'description' && i.level === 'error' })).toBe(true)
  })

  it('passes good title and description', () => {
    var result = analyzeMetaTags({
      title: 'A Good Page Title That Fits Google SERP Limits',
      description: 'A well-written meta description that is long enough to meet the recommended character count for search engine results pages and provides a clear summary.',
      canonical: 'https://example.com',
      og: { title: 'OG', description: 'OG desc', image: 'https://x.com/i.png' },
      twitter: { card: 'summary_large_image' },
    })
    expect(result.summary.errors).toBe(0)
    expect(result.score).toBeGreaterThan(50)
  })

  it('returns error for parse failures', () => {
    expect(analyzeMetaTags({ error: 'bad' }).error).toBe('bad')
  })
})
