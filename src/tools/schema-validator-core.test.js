import { describe, it, expect } from 'vitest'
import { parseJsonLdInput, validateJsonLd, validateSchemaItem } from './schema-validator-core.js'

describe('parseJsonLdInput', () => {
  it('parses a single object', () => {
    var result = parseJsonLdInput('{"@context":"https://schema.org","@type":"WebSite","name":"X","url":"https://x.com"}')
    expect(result.items.length).toBe(1)
  })

  it('returns error for invalid json', () => {
    expect(parseJsonLdInput('{bad').error).toBeTruthy()
  })
})

describe('validateSchemaItem', () => {
  it('requires @context and @type', () => {
    var result = validateSchemaItem({})
    expect(result.valid).toBe(false)
    expect(result.issues.some(function (i) { return i.message.indexOf('@context') !== -1 })).toBe(true)
  })

  it('validates WebSite required fields', () => {
    var result = validateSchemaItem({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'maratool',
      url: 'https://maratool.com',
    })
    expect(result.valid).toBe(true)
  })

  it('flags missing Article fields', () => {
    var result = validateSchemaItem({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Hi',
    })
    expect(result.valid).toBe(false)
  })
})

describe('validateJsonLd', () => {
  it('validates multiple items in array', () => {
    var text = JSON.stringify([
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'A', url: 'https://a.com' },
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Org' },
    ])
    var result = validateJsonLd(text)
    expect(result.results.length).toBe(2)
    expect(result.valid).toBe(true)
  })
})
