import { describe, it, expect } from 'vitest'
import {
  buildArticleSchema,
  buildProductSchema,
  buildFaqSchema,
  buildHowToSchema,
  buildLocalBusinessSchema,
  buildPersonSchema,
  formatJsonLd,
} from './schema-generator-core.js'

describe('buildArticleSchema', () => {
  it('returns correct @context and @type', () => {
    var schema = buildArticleSchema({ headline: 'Test', author: 'Alice', datePublished: '2026-01-01', url: 'https://example.com' })
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Article')
  })

  it('maps fields to correct properties', () => {
    var schema = buildArticleSchema({ headline: 'My Article', author: 'Bob', datePublished: '2026-03-01', url: 'https://example.com/article' })
    expect(schema.headline).toBe('My Article')
    expect(schema.author.name).toBe('Bob')
    expect(schema.datePublished).toBe('2026-03-01')
    expect(schema.url).toBe('https://example.com/article')
  })

  it('omits imageUrl when not provided', () => {
    var schema = buildArticleSchema({ headline: 'Test', author: 'Alice', datePublished: '2026-01-01', url: 'https://example.com' })
    expect(schema.image).toBeUndefined()
  })

  it('includes image when imageUrl is provided', () => {
    var schema = buildArticleSchema({ headline: 'Test', author: 'Alice', datePublished: '2026-01-01', url: 'https://example.com', imageUrl: 'https://example.com/img.jpg' })
    expect(schema.image).toBe('https://example.com/img.jpg')
  })
})

describe('buildProductSchema', () => {
  var fields = { name: 'Widget', description: 'A great widget', price: '29.99', currency: 'USD', availability: 'InStock', url: 'https://example.com/widget' }

  it('returns correct @type: Product', () => {
    expect(buildProductSchema(fields)['@type']).toBe('Product')
  })

  it('sets offers.@type: Offer', () => {
    var schema = buildProductSchema(fields)
    expect(schema.offers['@type']).toBe('Offer')
  })

  it('maps price and currency correctly', () => {
    var schema = buildProductSchema(fields)
    expect(schema.offers.price).toBe('29.99')
    expect(schema.offers.priceCurrency).toBe('USD')
  })

  it('maps availability with schema.org prefix', () => {
    var schema = buildProductSchema(fields)
    expect(schema.offers.availability).toContain('InStock')
  })
})

describe('buildFaqSchema', () => {
  it('returns @type: FAQPage', () => {
    expect(buildFaqSchema([])['@type']).toBe('FAQPage')
  })

  it('maps 2 Q&As to mainEntity array with 2 items', () => {
    var items = [
      { question: 'Q1?', answer: 'A1.' },
      { question: 'Q2?', answer: 'A2.' },
    ]
    var schema = buildFaqSchema(items)
    expect(schema.mainEntity.length).toBe(2)
    expect(schema.mainEntity[0]['@type']).toBe('Question')
    expect(schema.mainEntity[0].name).toBe('Q1?')
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('A1.')
  })

  it('empty array produces empty mainEntity', () => {
    expect(buildFaqSchema([]).mainEntity).toEqual([])
  })
})

describe('buildHowToSchema', () => {
  it('returns @type: HowTo', () => {
    var schema = buildHowToSchema({ name: 'How to bake', description: 'Steps', steps: [] })
    expect(schema['@type']).toBe('HowTo')
  })

  it('maps steps to HowToStep with correct @type', () => {
    var schema = buildHowToSchema({
      name: 'How to bake',
      description: 'Baking steps',
      steps: [{ name: 'Preheat', text: 'Preheat the oven to 350°F.' }],
    })
    expect(schema.step[0]['@type']).toBe('HowToStep')
    expect(schema.step[0].name).toBe('Preheat')
    expect(schema.step[0].text).toBe('Preheat the oven to 350°F.')
  })
})

describe('buildLocalBusinessSchema', () => {
  it('returns @type: LocalBusiness', () => {
    var schema = buildLocalBusinessSchema({ name: 'Acme', address: '123 St', phone: '555-0100', url: 'https://acme.com' })
    expect(schema['@type']).toBe('LocalBusiness')
  })

  it('maps address to PostalAddress', () => {
    var schema = buildLocalBusinessSchema({ name: 'Acme', address: '123 Main St', phone: '555-0100', url: 'https://acme.com' })
    expect(schema.address['@type']).toBe('PostalAddress')
  })
})

describe('buildPersonSchema', () => {
  it('returns @type: Person', () => {
    var schema = buildPersonSchema({ name: 'Alice', jobTitle: 'Engineer', url: 'https://alice.dev', email: 'alice@example.com' })
    expect(schema['@type']).toBe('Person')
  })

  it('maps name and jobTitle correctly', () => {
    var schema = buildPersonSchema({ name: 'Alice', jobTitle: 'Engineer', url: 'https://alice.dev', email: 'alice@example.com' })
    expect(schema.name).toBe('Alice')
    expect(schema.jobTitle).toBe('Engineer')
  })
})

describe('formatJsonLd', () => {
  it('wraps schema in script tag with correct type attribute', () => {
    var result = formatJsonLd({ '@type': 'Article' })
    expect(result).toContain('<script type="application/ld+json">')
    expect(result).toContain('</script>')
  })

  it('output contains valid JSON (parseable)', () => {
    var result = formatJsonLd({ '@type': 'Article', name: 'Test' })
    var jsonStart = result.indexOf('{')
    var jsonEnd = result.lastIndexOf('}') + 1
    var json = result.slice(jsonStart, jsonEnd)
    expect(() => JSON.parse(json)).not.toThrow()
  })
})
