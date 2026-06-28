import { describe, test, expect } from 'vitest'
import { tools, categoryOrder, subcategoryOrderByCategory, toolsByCategory } from './tools'

describe('tool categories', () => {
  test('has 12 categories in correct order', () => {
    expect([...categoryOrder]).toEqual([
      'Converter', 'PDF', 'Text', 'Image', 'Color', 'Developer', 'Marketing', 'Business', 'Finance', 'Education', 'Mockup', 'Health',
    ])
  })

  test('Health category has expected subcategories', () => {
    expect(subcategoryOrderByCategory['Health']).toEqual([
      'Anthropometric', 'Cardiology', 'Renal', 'Electrolytes', 'Endocrine', 'Hepatology', 'Ventilation', 'Obstetric', 'Pediatric', 'Drug', 'Infusion', 'Trauma', 'Screening', 'Scale', 'Prognosis', 'Score', 'General',
    ])
  })

  test('BMI is in Anthropometric subcategory and live', () => {
    const bmi = tools.find(t => t.slug === 'bmi-calculator')
    expect(bmi).toBeDefined()
    expect(bmi?.category).toBe('Health')
    expect(bmi?.subcategory).toBe('Anthropometric')
    expect(bmi?.live).toBe(true)
  })

  test('Health category has 130+ calculators registered', () => {
    const healthTools = tools.filter(t => t.category === 'Health')
    expect(healthTools.length).toBeGreaterThanOrEqual(130)
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

  test('Converter category has Format, Document, Unit, Video, CSV, and Date subcategories', () => {
    expect(subcategoryOrderByCategory['Converter']).toEqual(['Format', 'Document', 'Media', 'Unit', 'Video', 'CSV', 'Date'])
  })

  test('PDF category has Extract, Edit, Inspect subcategories', () => {
    expect(subcategoryOrderByCategory['PDF']).toEqual(['Extract', 'Edit', 'Inspect'])
  })

  test('Text category has Analyze, Edit, Generate, Transform subcategories', () => {
    expect(subcategoryOrderByCategory['Text']).toEqual(['Analyze', 'Edit', 'Generate', 'Transform'])
  })

  test('Image category has Transform, Social, and Inspect subcategories', () => {
    expect(subcategoryOrderByCategory['Image']).toEqual(['Transform', 'Social', 'Inspect'])
  })

  test('Color category has Generate, Convert, and Check subcategories', () => {
    expect(subcategoryOrderByCategory['Color']).toEqual(['Generate', 'Convert', 'Check'])
  })

  test('Developer category has expected subcategories', () => {
    expect(subcategoryOrderByCategory['Developer']).toEqual(['Crypto', 'Generate', 'Audit', 'Calculator', 'Reference', 'SQL', 'API', 'Security', 'AI', 'Web', 'Data'])
  })

  test('Marketing category has Builder and Calculator subcategories', () => {
    expect(subcategoryOrderByCategory['Marketing']).toEqual(['Builder', 'Calculator'])
  })

  test('Business category has Calculator, Pricing, Fees, Tax, Pay, Invoicing, Generate subcategories', () => {
    expect(subcategoryOrderByCategory['Business']).toEqual(['Calculator', 'Pricing', 'Fees', 'Tax', 'Pay', 'Invoicing', 'Generate'])
  })

  test('Finance category has Loan, Interest, Investment, Retirement subcategories', () => {
    expect(subcategoryOrderByCategory['Finance']).toEqual(['Loan', 'Interest', 'Investment', 'Retirement'])
  })

  test('E-commerce was merged into Business (no standalone E-commerce category)', () => {
    expect([...categoryOrder]).not.toContain('E-commerce')
    expect(subcategoryOrderByCategory['E-commerce']).toBeUndefined()
    // The former e-commerce tools now live under Business
    const amazon = tools.find(t => t.slug === 'amazon-fee-calculator')
    expect(amazon?.category).toBe('Business')
    expect(amazon?.subcategory).toBe('Fees')
  })

  test('Education category has Calculator and Reference subcategories', () => {
    expect(subcategoryOrderByCategory['Education']).toEqual(['Calculator', 'Reference'])
  })

  test('Mockup category has Chat, AI Chat, Posts, Comments, Stories, Email subcategories', () => {
    expect(subcategoryOrderByCategory['Mockup']).toEqual(['Chat', 'AI Chat', 'Posts', 'Comments', 'Stories', 'Email'])
  })

  test('WhatsApp Chat Mockup is in Mockup/Chat and is live', () => {
    const wa = tools.find(t => t.slug === 'whatsapp-chat-mockup')
    expect(wa).toBeDefined()
    expect(wa?.category).toBe('Mockup')
    expect(wa?.subcategory).toBe('Chat')
    expect(wa?.live).toBe(true)
  })

  test('Mockup tools are registered (8 total, 8 live)', () => {
    const mockupTools = tools.filter(t => t.category === 'Mockup')
    expect(mockupTools.length).toBe(8)
    const liveMockupTools = mockupTools.filter(t => t.live)
    expect(liveMockupTools.length).toBe(8)
  })

  test('QR Code Generator is in Marketing', () => {
    const qr = tools.find(t => t.slug === 'qr-code-generator')
    expect(qr?.category).toBe('Marketing')
  })

  test('Wave 1 finance tools are registered and live', () => {
    const slugs = ['mortgage-calculator', 'loan-calculator', 'compound-interest-calculator', 'cagr-calculator']
    for (const slug of slugs) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool?.category, slug).toBe('Finance')
      expect(tool?.live, slug).toBe(true)
    }
  })

  test('Wave 2 tools are registered and live', () => {
    const slugs = [
      'fire-calculator', 'inflation-calculator', 'stock-average-calculator', 'dca-calculator',
      'commission-calculator', 'contractor-rate-calculator', 'pricing-calculator', 'invoice-due-date-calculator',
      'csv-cleaner', 'csv-remove-duplicates', 'csv-split', 'csv-merge',
      'curl-to-fetch', 'curl-to-python', 'postman-collection-generator', 'json-schema-validator',
      'age-calculator', 'iso8601-formatter', 'week-number-calculator',
      'shopify-discount-calculator', 'gtin-validator',
      'prompt-variable-tester', 'embedding-cost-calculator',
    ]
    for (const slug of slugs) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool?.live, slug).toBe(true)
      expect(tool?.blogPost, slug).toBe(true)
    }
  })

  test('Wave 3 tools are registered and live', () => {
    const slugs = [
      'sql-minifier', 'sql-insert-generator', 'sql-create-table-generator',
      'rag-chunk-calculator', 'ai-model-comparison', 'llm-json-extractor',
      'hash-identifier', 'iban-validator', 'luhn-checker', 'jwt-security-checker',
      'html-minifier', 'html-beautifier', 'css-minifier', 'url-parser',
      'gpa-calculator', 'grade-calculator', 'final-grade-calculator', 'reading-level-calculator',
    ]
    for (const slug of slugs) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool?.live, slug).toBe(true)
      expect(tool?.blogPost, slug).toBe(true)
    }
  })

  test('Wave 4 tools are registered and live', () => {
    const slugs = [
      'invoice-number-generator', 'purchase-order-generator', 'business-name-generator', 'currency-margin-calculator',
      'dcf-calculator', 'position-size-calculator', 'crypto-profit-calculator',
      'vision-token-estimator', 'json-schema-generator', 'markdown-cleanup', 'prompt-diff', 'prompt-version-compare', 'ai-output-formatter',
      'sql-query-builder', 'csv-to-sql', 'sql-to-csv', 'er-diagram-generator', 'mongo-to-sql',
      'http-request-builder', 'api-mock-response-generator', 'webhook-payload-inspector',
      'hash-compare', 'checksum-calculator', 'ssl-certificate-decoder', 'csr-generator', 'pem-decoder', 'certificate-expiration-checker',
      'business-days-calculator', 'working-hours-calculator', 'countdown-generator',
      'excel-to-csv', 'csv-to-excel', 'csv-delimiter-converter', 'csv-column-mapper', 'csv-transpose',
      'html-preview', 'css-beautifier', 'js-minifier', 'html-validator', 'css-grid-generator', 'flexbox-generator', 'svg-editor',
      'shipping-calculator', 'sku-generator', 'youtube-timestamp-generator',
      'csv-diff', 'xml-validator', 'yaml-validator', 'toml-converter', 'xml-formatter', 'json-flatten', 'json-path-tester',
      'citation-generator', 'flashcard-formatter', 'apa-mla-converter', 'roman-numeral-converter',
    ]
    for (const slug of slugs) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool?.live, slug).toBe(true)
      expect(tool?.blogPost, slug).toBe(true)
    }
  })

  test('every blogPost: true tool has a blog page with BlogToolEmbed', async () => {
    const { readFileSync, existsSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const pagesDir = resolve(import.meta.dirname, '../pages/blog')
    const blogTools = tools.filter(t => t.blogPost)
    expect(blogTools.length, 'expected at least one blogPost tool').toBeGreaterThan(0)
    for (const tool of blogTools) {
      const blogPath = resolve(pagesDir, `${tool.slug}.astro`)
      expect(existsSync(blogPath), `${tool.slug} missing blog post at src/pages/blog/${tool.slug}.astro`).toBe(true)
      const content = readFileSync(blogPath, 'utf8')
      expect(content, `${tool.slug} blog must use BlogToolEmbed`).toContain('BlogToolEmbed')
      expect(content, `${tool.slug} blog must embed the correct slug`).toContain(`slug="${tool.slug}"`)
    }
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
      expect(liveTools.length, `${cat} has 0 live tools`).toBeGreaterThan(0)
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
