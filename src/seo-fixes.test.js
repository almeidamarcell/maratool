// Tests for SEO audit fixes — written test-first.
// Each describe block corresponds to a task from .context/seo-audit/ACTION-PLAN.md
import { describe, test, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'fs'
import { resolve } from 'path'
import { tools } from './data/tools.ts'

function readSrc(relPath) {
  return readFileSync(resolve(import.meta.dirname, '..', relPath), 'utf-8')
}

function srcExists(relPath) {
  return existsSync(resolve(import.meta.dirname, '..', relPath))
}

describe('P0.2 — Organization JSON-LD is parseable', () => {
  test('Base.astro uses set:html JSON.stringify for Organization (no template-literal bug)', () => {
    const base = readSrc('src/layouts/Base.astro')
    // The buggy pattern was: <script type="application/ld+json">{`{...}`}</script>
    // The fix is: <script type="application/ld+json" set:html={JSON.stringify(orgSchema)} />
    // Find the script after the Organization JSON-LD comment — accept either
    // a self-closing tag or a regular close tag.
    const orgBlock = base.match(/Organization JSON-LD[\s\S]*?(\/>|<\/script>)/)?.[0] ?? ''
    expect(orgBlock).toContain('set:html')
    expect(orgBlock).not.toMatch(/\{`\{/)
    expect(orgBlock).not.toMatch(/\}`\}/)
  })

  test('Base.astro defines orgSchema as a real JS object', () => {
    const base = readSrc('src/layouts/Base.astro')
    expect(base).toMatch(/const\s+orgSchema\s*=\s*\{/)
    expect(base).toMatch(/'@type':\s*'Organization'/)
  })
})

describe('P0.4 — AI search bots are allowed', () => {
  const robots = readSrc('public/robots.txt')

  test('GPTBot is not blocked', () => {
    // Look for explicit Disallow under GPTBot user-agent
    expect(robots).not.toMatch(/User-agent:\s*GPTBot[\s\S]{0,100}Disallow:\s*\//)
  })

  test('ClaudeBot is not blocked', () => {
    expect(robots).not.toMatch(/User-agent:\s*ClaudeBot[\s\S]{0,100}Disallow:\s*\//)
  })

  test('PerplexityBot is not blocked', () => {
    expect(robots).not.toMatch(/User-agent:\s*PerplexityBot[\s\S]{0,100}Disallow:\s*\//)
  })

  test('Google-Extended is not blocked', () => {
    expect(robots).not.toMatch(/User-agent:\s*Google-Extended[\s\S]{0,100}Disallow:\s*\//)
  })

  test('Applebot-Extended is not blocked', () => {
    expect(robots).not.toMatch(/User-agent:\s*Applebot-Extended[\s\S]{0,100}Disallow:\s*\//)
  })

  test('anthropic-ai is not blocked', () => {
    expect(robots).not.toMatch(/User-agent:\s*anthropic-ai[\s\S]{0,100}Disallow:\s*\//)
  })

  test('CCBot remains blocked (training-only, no citation upside)', () => {
    expect(robots).toMatch(/User-agent:\s*CCBot[\s\S]{0,100}Disallow:\s*\//)
  })

  test('Bytespider remains blocked', () => {
    expect(robots).toMatch(/User-agent:\s*Bytespider[\s\S]{0,100}Disallow:\s*\//)
  })

  test('Sitemap directive is still present', () => {
    expect(robots).toContain('Sitemap: https://maratool.com/sitemap-index.xml')
  })
})

describe('P0.5 — 404 page exists with correct meta', () => {
  test('src/pages/404.astro exists', () => {
    expect(srcExists('src/pages/404.astro')).toBe(true)
  })

  test('404 page sets noindex (via prop or meta tag)', () => {
    if (!srcExists('src/pages/404.astro')) return
    const page = readSrc('src/pages/404.astro')
    // Either inline meta tag or noindex: true prop passed to Base
    const hasMetaTag = /<meta\s+name="robots"\s+content="noindex,\s*follow"/.test(page)
    const hasProp = /noindex:\s*true/.test(page)
    expect(hasMetaTag || hasProp, 'expected either meta robots tag or noindex:true prop').toBe(true)
  })

  test('Base.astro renders noindex meta when prop is set', () => {
    const base = readSrc('src/layouts/Base.astro')
    expect(base).toMatch(/\{noindex\s*&&\s*<meta\s+name="robots"\s+content="noindex,\s*follow"/)
  })

  test('404 page links to homepage and major hubs', () => {
    if (!srcExists('src/pages/404.astro')) return
    const page = readSrc('src/pages/404.astro')
    expect(page).toMatch(/href="\/"/)
    expect(page).toMatch(/href="\/all/)
  })
})

describe('P0.6 — _redirects file fixes broken slugs', () => {
  test('public/_redirects exists', () => {
    expect(srcExists('public/_redirects')).toBe(true)
  })

  test('color-picker redirects to color-converter with 301', () => {
    if (!srcExists('public/_redirects')) return
    const redirects = readSrc('public/_redirects')
    expect(redirects).toMatch(/\/color-picker\s+\/color-converter\s+301/)
  })

  test('pdf-merger redirects to pdf-merge-split with 301', () => {
    if (!srcExists('public/_redirects')) return
    const redirects = readSrc('public/_redirects')
    expect(redirects).toMatch(/\/pdf-merger\s+\/pdf-merge-split\s+301/)
  })
})

describe('P1.1 — Medical tools use MedicalRiskCalculator schema', () => {
  test('HealthCalc.astro emits MedicalRiskCalculator @type', () => {
    expect(srcExists('src/components/HealthCalc.astro')).toBe(true)
    const comp = readSrc('src/components/HealthCalc.astro')
    expect(comp).toContain('MedicalRiskCalculator')
    // Should be in @type array alongside WebApplication
    expect(comp).toMatch(/'@type':\s*\[[^\]]*MedicalRiskCalculator[^\]]*WebApplication/)
  })

  test('ScoreCalc.astro inherits MedicalRiskCalculator via HealthCalc', () => {
    expect(srcExists('src/components/ScoreCalc.astro')).toBe(true)
    const comp = readSrc('src/components/ScoreCalc.astro')
    // ScoreCalc is a wrapper around HealthCalc — verifies the delegation
    expect(comp).toContain('HealthCalc')
  })
})

describe('P1.2 — YMYL trust pages exist', () => {
  test('src/pages/privacy.astro exists', () => {
    expect(srcExists('src/pages/privacy.astro')).toBe(true)
  })

  test('src/pages/terms.astro exists', () => {
    expect(srcExists('src/pages/terms.astro')).toBe(true)
  })

  test('src/pages/medical-disclaimer.astro exists', () => {
    expect(srcExists('src/pages/medical-disclaimer.astro')).toBe(true)
  })

  test('src/pages/methodology.astro exists', () => {
    expect(srcExists('src/pages/methodology.astro')).toBe(true)
  })

  test('Footer links to all 4 trust pages', () => {
    const footer = readSrc('src/components/Footer.astro')
    expect(footer).toMatch(/href="\/privacy/)
    expect(footer).toMatch(/href="\/terms/)
    expect(footer).toMatch(/href="\/medical-disclaimer/)
    expect(footer).toMatch(/href="\/methodology/)
  })
})

describe('P1.3 — Medical tools surface reviewer + lastReviewed', () => {
  test('ReviewedBy.astro component exists', () => {
    expect(srcExists('src/components/ReviewedBy.astro')).toBe(true)
  })

  test('HealthCalc.astro renders ReviewedBy component', () => {
    const comp = readSrc('src/components/HealthCalc.astro')
    expect(comp).toContain('ReviewedBy')
  })

  test('ScoreCalc inherits ReviewedBy via HealthCalc wrapping', () => {
    // ScoreCalc uses <HealthCalc {...calcProps}>, so ReviewedBy is emitted
    // by HealthCalc once on every score page. Verifies the delegation chain.
    const comp = readSrc('src/components/ScoreCalc.astro')
    expect(comp).toContain('HealthCalc')
  })

  test('HealthCalc accepts lastReviewed and reviewer optional props', () => {
    const comp = readSrc('src/components/HealthCalc.astro')
    expect(comp).toMatch(/lastReviewed\??:\s*string/)
    expect(comp).toMatch(/reviewer\??:\s*string/)
  })
})

describe('P1.5 — llms.txt is auto-generated and complete', () => {
  test('llms.txt generator script exists', () => {
    // Either build hook in astro.config.mjs or a standalone scripts/gen-llms.mjs
    const hasBuildHook = readSrc('astro.config.mjs').includes('llms.txt')
    const hasScript = srcExists('scripts/gen-llms.mjs') || srcExists('scripts/gen-llms.js')
    expect(hasBuildHook || hasScript).toBe(true)
  })

  test('llms.txt includes every live tool slug', () => {
    const llms = readSrc('public/llms.txt')
    const liveTools = tools.filter(t => t.live)
    const missing = liveTools.filter(t => !llms.includes(t.slug)).map(t => t.slug)
    expect(missing, `llms.txt missing: ${missing.join(', ')}`).toEqual([])
  })
})

describe('P1.7 — Heading hierarchy: no orphan h3 in EmbedButton', () => {
  test('EmbedButton.astro does not emit <h3>', () => {
    const comp = readSrc('src/components/EmbedButton.astro')
    expect(comp).not.toMatch(/<h3[\s>]/)
  })
})

describe('P1.8 — Security headers configured', () => {
  test('public/_headers exists', () => {
    expect(srcExists('public/_headers')).toBe(true)
  })

  test('HSTS header is set for all routes', () => {
    if (!srcExists('public/_headers')) return
    const headers = readSrc('public/_headers')
    expect(headers).toMatch(/Strict-Transport-Security:\s*max-age=\d+/)
  })

  test('Permissions-Policy is set', () => {
    if (!srcExists('public/_headers')) return
    const headers = readSrc('public/_headers')
    expect(headers).toMatch(/Permissions-Policy:/)
  })

  test('immutable Cache-Control for /_astro/ hashed bundles', () => {
    if (!srcExists('public/_headers')) return
    const headers = readSrc('public/_headers')
    expect(headers).toMatch(/\/_astro\/\*[\s\S]*?Cache-Control:[^\n]*immutable/)
  })
})

describe('P2.3 — BlogPosting schema has required Article fields', () => {
  test('may-2026-discoverability-redesign post has image, dateModified, mainEntityOfPage', () => {
    const post = readSrc('src/pages/blog/may-2026-discoverability-redesign.astro')
    expect(post).toMatch(/image:\s*['"]https:/)
    expect(post).toMatch(/dateModified:/)
    expect(post).toMatch(/mainEntityOfPage:/)
  })

  test('may-2026-health-calculators post has image, dateModified, mainEntityOfPage', () => {
    const post = readSrc('src/pages/blog/may-2026-health-calculators.astro')
    expect(post).toMatch(/image:/)
    expect(post).toMatch(/dateModified:/)
    expect(post).toMatch(/mainEntityOfPage:/)
  })

  test('homepage-redesign-march-2026 post has image, dateModified, mainEntityOfPage', () => {
    const post = readSrc('src/pages/blog/homepage-redesign-march-2026.astro')
    expect(post).toMatch(/image:/)
    expect(post).toMatch(/dateModified:/)
    expect(post).toMatch(/mainEntityOfPage:/)
  })
})

describe('P2.8 — mascot.gif is reduced or removed', () => {
  test('mascot.gif is either deleted or under 100KB', () => {
    const path = resolve(import.meta.dirname, '..', 'public/mascot.gif')
    if (!existsSync(path)) return // deleted is acceptable
    const size = statSync(path).size
    expect(size, `mascot.gif is ${size} bytes; should be <100KB or removed`).toBeLessThan(100_000)
  })
})

describe('Pre-existing test fixes', () => {
  test('homepage title does not reference removed tools', () => {
    const homepage = readSrc('src/pages/index.astro')
    expect(homepage).not.toContain('Word Counter')
    // Accept template-literal backticks in addition to plain quotes
    const titleMatch = homepage.match(/title:\s*['"`]([^'"`]+)['"`]/)
    expect(titleMatch).not.toBeNull()
    expect(titleMatch[1]).toContain('maratool')
  })

  test('no tool page uses typo "UtilityApplication" instead of "UtilitiesApplication"', () => {
    const liveTools = tools.filter(t => t.live)
    const failures = []
    for (const tool of liveTools) {
      const path = `src/pages/${tool.slug}.astro`
      if (!srcExists(path)) continue
      const page = readSrc(path)
      // The right value is "UtilitiesApplication". The typo is "UtilityApplication" (no -ies).
      if (/applicationCategory:\s*['"]UtilityApplication['"]/.test(page)) {
        failures.push(`${tool.slug}: uses typo UtilityApplication`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})
