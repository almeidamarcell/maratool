import { describe, test, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { tools } from './data/tools.ts'

function readSrc(relPath) {
  return readFileSync(resolve(import.meta.dirname, '..', relPath), 'utf-8')
}

describe('SEO audit — Group 1: Critical', () => {
  test('Base.astro does not contain PostHog script', () => {
    const base = readSrc('src/layouts/Base.astro')
    expect(base).not.toContain('posthog')
    expect(base).not.toContain('YOUR_KEY')
  })

  test('Base.astro accepts optional ogImage prop', () => {
    const base = readSrc('src/layouts/Base.astro')
    expect(base).toMatch(/ogImage\??:\s*string/)
    expect(base).toContain('ogImage')
  })

  test('Base.astro has theme-color meta tag', () => {
    const base = readSrc('src/layouts/Base.astro')
    expect(base).toContain('theme-color')
  })

  test('homepage title does not reference non-existent tools', () => {
    const homepage = readSrc('src/pages/index.astro')
    expect(homepage).not.toContain('Word Counter')
    const titleMatch = homepage.match(/title:\s*['"]([^'"]+)['"]/)
    expect(titleMatch).not.toBeNull()
    expect(titleMatch[1]).toContain('maratool')
  })
})

describe('SEO audit — Group 2: High Impact', () => {
  test('sitemap config uses git-based lastmod, not build date', () => {
    const config = readSrc('astro.config.mjs')
    // Should use git log or a git-date helper, not new Date()
    expect(config).toContain('getPageLastMod')
    // Should NOT have `const lastmod = new Date()` pattern
    expect(config).not.toMatch(/const lastmod\s*=\s*new Date\(\)/)
    // Every return path should still include lastmod
    const returnStatements = config.match(/return\s*\{[^}]*\}/g) ?? []
    expect(returnStatements.length).toBeGreaterThan(0)
    for (const ret of returnStatements) {
      expect(ret).toContain('lastmod')
    }
  })

  test('sitemap config does not include changefreq', () => {
    const config = readSrc('astro.config.mjs')
    expect(config).not.toContain('changefreq')
  })

  test('robots.txt blocks AI scrapers', () => {
    const robots = readSrc('public/robots.txt')
    expect(robots).toContain('GPTBot')
    expect(robots).toContain('CCBot')
    expect(robots).toContain('Sitemap:')
  })

  test('applicationCategory matches tool type', () => {
    // Map categories to expected applicationCategory
    const expected = {
      Image: 'MultimediaApplication',
      Color: 'DesignApplication',
      PDF: 'UtilitiesApplication',
      Text: 'UtilitiesApplication',
      Marketing: 'BusinessApplication',
      Developer: 'DeveloperApplication',
      Converter: 'UtilitiesApplication',
      Mockup: 'DesignApplication',
    }
    // Calculator subcategory in Developer should be UtilitiesApplication
    const calculatorSlugs = tools
      .filter(t => t.category === 'Developer' && t.subcategory === 'Calculator')
      .map(t => t.slug)

    const liveTools = tools.filter(t => t.live)
    for (const tool of liveTools) {
      const page = readSrc(`src/pages/${tool.slug}.astro`)
      const catMatch = page.match(/applicationCategory:\s*['"]([^'"]+)['"]/)
      if (!catMatch) continue // some pages may not have schema

      const actual = catMatch[1]
      if (calculatorSlugs.includes(tool.slug)) {
        expect(actual, `${tool.slug} should be UtilitiesApplication`).toBe('UtilitiesApplication')
      } else {
        const expectedCat = expected[tool.category]
        expect(actual, `${tool.slug} (${tool.category}) should be ${expectedCat}`).toBe(expectedCat)
      }
    }
  })

  test('all 7 category landing pages have FAQ schema', () => {
    const categories = ['converter', 'pdf', 'text', 'image', 'color', 'developer', 'marketing']
    const failures = []
    for (const cat of categories) {
      const page = readSrc(`src/pages/${cat}.astro`)
      if (!page.includes('FAQPage')) {
        failures.push(`${cat}.astro: missing FAQPage schema`)
      }
      if (!page.includes('faqSchema')) {
        failures.push(`${cat}.astro: not passing faqSchema to Base`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  test('homepage has FAQ section and schema', () => {
    const homepage = readSrc('src/pages/index.astro')
    expect(homepage).toContain('FAQPage')
    expect(homepage).toContain('faqSchema')
    expect(homepage).toContain('Frequently asked questions')
  })
})

describe('SEO audit — Group 3: Internal Linking', () => {
  test('every tool page has at least 3 relatedTools', () => {
    const liveTools = tools.filter(t => t.live)
    const failures = []
    for (const tool of liveTools) {
      const page = readSrc(`src/pages/${tool.slug}.astro`)
      // relatedTools can be inline or a separate const — find the array content
      const arrayMatch = page.match(/(?:const\s+relatedTools\s*=\s*\[|relatedTools=\{\[)([\s\S]*?)\]/m)
      if (!arrayMatch) { failures.push(`${tool.slug}: no relatedTools found`); continue }
      const items = arrayMatch[1].match(/slug:/g) ?? []
      if (items.length < 3) {
        failures.push(`${tool.slug}: only ${items.length} relatedTools (need 3)`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})

describe('SEO audit — Group 4: Quick Wins', () => {
  test('ToolShell.astro uses h3 for FAQ questions, not p', () => {
    const shell = readSrc('src/components/ToolShell.astro')
    expect(shell).not.toMatch(/<p\s+class="faq-question"/)
    expect(shell).toMatch(/<h3\s+class="faq-question"/)
  })

  test('tool names in tools.ts match search intent', () => {
    const nameMap = {
      'jwt-decoder': 'Decode JWT Token Online',
      'hash-generator': 'Generate MD5 SHA-256 Hash Online',
      'diff-checker': 'Compare Two Texts Online',
      'regex-tester': 'Test Regex Patterns Online',
      'json-formatter': 'Format and Validate JSON Online',
      'uuid-generator': 'Generate UUID v4 Online',
      'cron-expression': 'Cron Expression Builder & Decoder',
      'contrast-checker': 'Color Contrast Checker (WCAG)',
      'markdown-editor': 'Markdown Editor with Live Preview',
      'lorem-ipsum': 'Generate Lorem Ipsum Text',
      'css-gradient': 'CSS Gradient Generator with Live Preview',
    }
    for (const [slug, expectedName] of Object.entries(nameMap)) {
      const tool = tools.find(t => t.slug === slug)
      expect(tool, `tool ${slug} not found`).toBeDefined()
      expect(tool.name, `${slug} name mismatch`).toBe(expectedName)
    }
  })

  test('llms.txt includes all live tools', () => {
    const llms = readSrc('public/llms.txt')
    const liveTools = tools.filter(t => t.live)
    const missing = []
    for (const tool of liveTools) {
      if (!llms.includes(tool.slug)) {
        missing.push(tool.slug)
      }
    }
    expect(missing, `llms.txt missing: ${missing.join(', ')}`).toEqual([])
  })
})
