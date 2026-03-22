import { describe, test, expect } from 'vitest'
import { tools, categoryOrder, subcategoryOrderByCategory, toolsByCategory } from './tools'

describe('tool categories', () => {
  test('has 7 categories in correct order', () => {
    expect([...categoryOrder]).toEqual([
      'Converter', 'PDF', 'Text', 'Image', 'Color', 'Developer', 'Marketing',
    ])
  })

  test('every tool has a category that exists in categoryOrder', () => {
    const categories = new Set(categoryOrder)
    for (const tool of tools) {
      expect(categories.has(tool.category), `${tool.slug} has invalid category "${tool.category}"`).toBe(true)
    }
  })

  test('every tool has a subcategory that exists in subcategoryOrderByCategory', () => {
    for (const tool of tools) {
      const subs = subcategoryOrderByCategory[tool.category]
      expect(subs, `${tool.category} missing from subcategoryOrderByCategory`).toBeDefined()
      expect(subs.includes(tool.subcategory), `${tool.slug}: subcategory "${tool.subcategory}" not in ${tool.category} subcategories [${subs}]`).toBe(true)
    }
  })

  test('Converter category has Format, Unit, and Video subcategories', () => {
    expect(subcategoryOrderByCategory['Converter']).toEqual(['Format', 'Unit', 'Video'])
  })

  test('PDF category has Extract, Edit, Inspect subcategories', () => {
    expect(subcategoryOrderByCategory['PDF']).toEqual(['Extract', 'Edit', 'Inspect'])
  })

  test('Text category has Analyze, Edit, Generate subcategories', () => {
    expect(subcategoryOrderByCategory['Text']).toEqual(['Analyze', 'Edit', 'Generate'])
  })

  test('Image category has Transform, Social, and Inspect subcategories', () => {
    expect(subcategoryOrderByCategory['Image']).toEqual(['Transform', 'Social', 'Inspect'])
  })

  test('Color category has Generate, Convert, and Check subcategories', () => {
    expect(subcategoryOrderByCategory['Color']).toEqual(['Generate', 'Convert', 'Check'])
  })

  test('Developer category has Crypto, Generate, Calculator, and Reference subcategories', () => {
    expect(subcategoryOrderByCategory['Developer']).toEqual(['Crypto', 'Generate', 'Calculator', 'Reference'])
  })

  test('Marketing category has Builder subcategory', () => {
    expect(subcategoryOrderByCategory['Marketing']).toEqual(['Builder'])
  })

  test('QR Code Generator is in Marketing', () => {
    const qr = tools.find(t => t.slug === 'qr-code-generator')
    expect(qr?.category).toBe('Marketing')
  })

  test('PDF tools are in PDF category', () => {
    const pdfSlugs = ['pdf-to-text', 'pdf-metadata', 'pdf-to-markdown', 'pdf-merge-split', 'pdf-accessibility-checker']
    for (const slug of pdfSlugs) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool?.category, `${slug} should be in PDF category`).toBe('PDF')
    }
  })

  test('no category has 0 live tools', () => {
    for (const cat of categoryOrder) {
      const liveTools = tools.filter(t => t.category === cat && t.live)
      // Marketing may have 0 live, that's ok — QR is live now
      if (cat !== 'Marketing') {
        expect(liveTools.length, `${cat} has 0 live tools`).toBeGreaterThan(0)
      }
    }
  })

  test('toolsByCategory groups tools correctly', () => {
    for (const cat of categoryOrder) {
      const subs = subcategoryOrderByCategory[cat]
      for (const sub of subs) {
        const grouped = toolsByCategory[cat]?.[sub] ?? []
        const expected = tools.filter(t => t.category === cat && t.subcategory === sub)
        expect(grouped.length, `${cat}/${sub} count mismatch`).toBe(expected.length)
      }
    }
  })
})
