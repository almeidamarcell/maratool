import { describe, it, expect } from 'vitest'
import { countTitle, countDescription, buildBasicTags, buildOgTags, buildTwitterTags, combineAllTags } from './meta-tag-generator-core.js'

describe('countTitle', () => {
  it('55-char string returns ok', () => {
    expect(countTitle('a'.repeat(55)).status).toBe('ok')
  })

  it('30-char string returns short', () => {
    expect(countTitle('a'.repeat(30)).status).toBe('short')
  })

  it('70-char string returns long', () => {
    expect(countTitle('a'.repeat(70)).status).toBe('long')
  })

  it('returns count', () => {
    expect(countTitle('hello').count).toBe(5)
  })
})

describe('countDescription', () => {
  it('150-char string returns ok', () => {
    expect(countDescription('a'.repeat(150)).status).toBe('ok')
  })

  it('100-char string returns short', () => {
    expect(countDescription('a'.repeat(100)).status).toBe('short')
  })

  it('170-char string returns long', () => {
    expect(countDescription('a'.repeat(170)).status).toBe('long')
  })
})

describe('buildBasicTags', () => {
  it('title produces <title> tag', () => {
    var tags = buildBasicTags({ title: 'My Page' })
    var combined = tags.join('\n')
    expect(combined).toContain('<title>My Page</title>')
  })

  it('canonical produces <link rel="canonical">', () => {
    var tags = buildBasicTags({ canonical: 'https://example.com' })
    expect(tags.join('\n')).toContain('rel="canonical"')
    expect(tags.join('\n')).toContain('https://example.com')
  })

  it('empty fields are omitted', () => {
    var tags = buildBasicTags({ title: '', description: '', canonical: '' })
    expect(tags.length).toBe(0)
  })

  it('description produces <meta name="description">', () => {
    var tags = buildBasicTags({ description: 'My description' })
    expect(tags.join('\n')).toContain('name="description"')
    expect(tags.join('\n')).toContain('My description')
  })
})

describe('buildOgTags', () => {
  it('generates og:title, og:url, og:type', () => {
    var tags = buildOgTags({ title: 'T', url: 'https://x.com', type: 'website' })
    var out = tags.join('\n')
    expect(out).toContain('og:title')
    expect(out).toContain('og:url')
    expect(out).toContain('og:type')
  })

  it('omits og:image when imageUrl is not provided', () => {
    var tags = buildOgTags({ title: 'T' })
    expect(tags.join('\n')).not.toContain('og:image')
  })

  it('includes og:image when imageUrl is provided', () => {
    var tags = buildOgTags({ imageUrl: 'https://example.com/img.jpg' })
    expect(tags.join('\n')).toContain('og:image')
  })
})

describe('buildTwitterTags', () => {
  it('generates twitter:card', () => {
    var tags = buildTwitterTags({ card: 'summary_large_image' })
    expect(tags.join('\n')).toContain('twitter:card')
    expect(tags.join('\n')).toContain('summary_large_image')
  })
})

describe('combineAllTags', () => {
  it('returns a single string', () => {
    var result = combineAllTags(['<title>T</title>'], ['<meta og>'], ['<meta twitter>'])
    expect(typeof result).toBe('string')
  })

  it('contains all input tags', () => {
    var result = combineAllTags(['<title>T</title>'], ['<meta og>'], ['<meta twitter>'])
    expect(result).toContain('<title>T</title>')
    expect(result).toContain('<meta og>')
    expect(result).toContain('<meta twitter>')
  })
})
