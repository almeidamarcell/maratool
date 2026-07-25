#!/usr/bin/env node
/**
 * Generate Wave 5 tool launch blog posts with BlogToolEmbed.
 * Linear posts get a factor table generated from the same data that drives
 * the tools, plus a Sources & methodology section citing the reference.
 * Run: node scripts/generate-wave5-blog-posts.mjs
 */
import fs from 'fs'
import path from 'path'
import { LINEAR, REFS } from './wave5-data-linear.mjs'
import { SPECIAL } from './wave5-data-special.mjs'

const OUT = path.join(import.meta.dirname, '..', 'src', 'pages', 'blog')
const DATE = 'July 25, 2026'
const DATE_ISO = '2026-07-25'
const ROUNDUP_SLUG = 'new-unit-converters'

const ALL_TOOLS = [...LINEAR, ...SPECIAL]
const BLOG_TITLE = {}
const CRUMB = {}
const SUB = {}
for (const t of ALL_TOOLS) {
  BLOG_TITLE[t.slug] = t.blog.title
  CRUMB[t.slug] = t.crumb
  SUB[t.slug] = t.sub
}

/**
 * Smart internal linking: prefer the tool's hand-picked related slugs (when
 * they have Wave 5 guides), then fill with same-family siblings so every
 * guide both links out to and receives links from its topical cluster.
 */
function relatedGuides(cfg) {
  const picks = []
  for (const s of cfg.related) {
    if (BLOG_TITLE[s] && s !== cfg.slug && !picks.includes(s)) picks.push(s)
  }
  for (const t of ALL_TOOLS) {
    if (picks.length >= 3) break
    if (t.slug !== cfg.slug && SUB[t.slug] === SUB[cfg.slug] && !picks.includes(t.slug)) picks.push(t.slug)
  }
  return picks.slice(0, 3).map(s => ({ slug: s, title: BLOG_TITLE[s] }))
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function factorDisplay(f) {
  const n = Number(f)
  if (n >= 1e7 || (n < 1e-4 && n !== 0)) return n.toExponential(4).replace('e+', ' × 10^').replace('e-', ' × 10^-')
  return n.toLocaleString('en-US', { maximumFractionDigits: 12 })
}

function factorTable(cfg) {
  const rows = cfg.units
    .map(([label, f]) => `        <tr><td>${label}</td><td>${factorDisplay(f)}</td></tr>`)
    .join('\n')
  return `<table>
        <thead><tr><th>Unit</th><th>= this many ${cfg.base}s</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>`
}

function linearPost(cfg) {
  const ref = REFS[cfg.ref]
  const radNote = cfg.extraNote ? ` ${cfg.extraNote}` : ''
  return {
    slug: cfg.slug,
    toolName: cfg.crumb,
    title: cfg.blog.title,
    seoTitle: cfg.blog.seoTitle,
    description: cfg.blog.description,
    lead: cfg.blog.lead,
    og: 'converter.svg',
    embedTitle: `Try it — convert ${cfg.catLabel.toLowerCase()} units`,
    embedHeight: 440,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: cfg.blog.intro,
    steps: [
      `<strong>Pick units</strong> — "${cfg.from}" to "${cfg.to}", or any other pair.`,
      '<strong>Type a value</strong> — the result updates as you type, with swap and copy.',
      '<strong>Copy</strong> — one click, with "Copied!" feedback.',
    ],
    sections: [
      { h2: `${cfg.catLabel} conversion factors`, body: `<p>Every unit converts through the ${cfg.base} (the base unit). To convert A → B, multiply by A's factor and divide by B's:</p>\n      ${factorTable(cfg)}` },
      { h2: 'When you need it', body: cfg.blog.use },
      { h2: 'Sources & methodology', body: `<p>Conversion factors follow <a href="${ref.url}" rel="noopener" target="_blank">${ref.name}</a>; exact-by-definition factors are marked in the tool itself. All math runs client-side in your browser — nothing is uploaded.${radNote}</p>` },
    ],
    guides: relatedGuides(cfg),
  }
}

function specialPost(cfg) {
  let sources
  if (cfg.refInline) {
    sources = '<p>The formula is arithmetic stated inline above — no external dataset is involved. Everything runs client-side in your browser; nothing is uploaded.</p>'
  } else {
    const ref = REFS[cfg.ref]
    const extra = cfg.extraNote ? ` ${cfg.extraNote}` : ''
    sources = `<p>Methodology reference: <a href="${ref.url}" rel="noopener" target="_blank">${ref.name}</a>.${extra} Everything runs client-side in your browser; nothing is uploaded.</p>`
  }
  return {
    slug: cfg.slug,
    toolName: cfg.crumb,
    title: cfg.blog.title,
    seoTitle: cfg.blog.seoTitle,
    description: cfg.blog.description,
    lead: cfg.blog.lead,
    og: cfg.blog.og,
    embedTitle: cfg.blog.embedTitle,
    embedHeight: cfg.blog.embedHeight,
    hub: `/${cfg.catSlug}`,
    hubLabel: cfg.catSlug === 'health' ? 'health calculators' : 'converter tools',
    intro: cfg.blog.intro,
    steps: cfg.blog.steps,
    sections: [...cfg.blog.sections, { h2: 'Sources & methodology', body: sources }],
    guides: relatedGuides(cfg),
  }
}

/** Escape {{ }} so Astro does not treat them as expressions */
function braceEsc(s) {
  return s.replace(/\{\{/g, '&#123;&#123;').replace(/\}\}/g, '&#125;&#125;')
}

function render(post) {
  const stepsHtml = post.steps.map(s => `        <li>${braceEsc(s)}</li>`).join('\n')
  const sectionsHtml = post.sections.map(s => `      <h2>${s.h2}</h2>\n      ${braceEsc(s.body)}`).join('\n\n')

  return `---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import BlogPostShell from '../../components/BlogPostShell.astro'
import BlogToolEmbed from '../../components/BlogToolEmbed.astro'

const slug = '${post.slug}'
const seo = {
  title: '${esc(post.seoTitle)}',
  description: '${braceEsc(esc(post.description))}',
  canonical: \`https://maratool.com/blog/\${slug}\`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: '${esc(post.title)}',
    image: 'https://maratool.com/og/${post.og}',
    datePublished: '${DATE_ISO}',
    dateModified: '${DATE_ISO}',
    author: { '@type': 'Person', name: 'Marcell Almeida', url: 'https://marcell.com.br' },
    publisher: {
      '@type': 'Organization',
      name: 'maratool',
      url: 'https://maratool.com',
      logo: { '@type': 'ImageObject', url: 'https://maratool.com/favicon.svg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': \`https://maratool.com/blog/\${slug}\` },
    url: \`https://maratool.com/blog/\${slug}\`,
    description: '${braceEsc(esc(post.description))}',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://maratool.com/blog' },
      { '@type': 'ListItem', position: 3, name: '${esc(post.title)}', item: \`https://maratool.com/blog/\${slug}\` },
    ],
  },
}
---
<Base {...seo}>
  <Layout>
    <BlogPostShell
      title="${esc(post.title)}"
      lead="${braceEsc(esc(post.lead))}"
      date="${DATE}"
      dateIso="${DATE_ISO}"
    >
      <p>${braceEsc(post.intro)}</p>

      <BlogToolEmbed slug="${post.embedSlug || post.slug}" title="${esc(post.embedTitle)}" height={${post.embedHeight}} />

      <h2>How it works</h2>
      <ol>
${stepsHtml}
      </ol>

${sectionsHtml}
${post.guides && post.guides.length ? `
      <h2>More conversion guides</h2>
      <ul>
${post.guides.map(g => `        <li><a href="/blog/${g.slug}">${g.title}</a></li>`).join('\n')}
      </ul>
      <p>Or browse everything at once in the <a href="/blog/${ROUNDUP_SLUG}">new unit &amp; sizing converters roundup</a>.</p>
` : ''}
      <hr class="blog-divider" />
      <p class="blog-footer-note">${post.footerNote || `The <a href="/${post.slug}">${post.toolName}</a> tool is free, runs locally, and never sends your data to a server. More <a href="${post.hub}">${post.hubLabel}</a> at <a href="/">maratool.com</a>.`}</p>
    </BlogPostShell>
  </Layout>
</Base>
`
}

const posts = [...LINEAR.map(linearPost), ...SPECIAL.map(specialPost)]

for (const post of posts) {
  const file = path.join(OUT, `${post.slug}.astro`)
  fs.writeFileSync(file, render(post))
  console.log('Wrote', file)
}

// ── Roundup post: hub page linking every new tool + its guide ──

const ROUNDUP_FAMILIES = [
  { h2: 'Dimension & mechanics', intro: 'The everyday physical quantities — the conversions people reach for when reading a spec sheet, a recipe, or a datasheet from another country.', slugs: ['area-converter', 'volume-converter', 'pressure-converter', 'energy-converter', 'power-converter', 'force-converter', 'torque-converter', 'acceleration-converter', 'density-converter', 'angle-converter', 'frequency-converter', 'bandwidth-converter'] },
  { h2: 'Chemistry & flow', intro: 'Lab and process-engineering units: amounts of substance, viscosities, and flow rates in both SI and US customary systems.', slugs: ['amount-of-substance-converter', 'molar-mass-converter', 'dynamic-viscosity-converter', 'kinematic-viscosity-converter', 'mass-flow-rate-converter', 'volumetric-flow-rate-converter'] },
  { h2: 'Electrical', intro: 'Every prefix jump an electronics bench needs — from picofarads to kiloamps, plus the CGS units that haunt old datasheets.', slugs: ['capacitance-converter', 'electric-charge-converter', 'electric-current-converter', 'electric-potential-converter', 'electrical-conductance-converter', 'electrical-resistance-converter', 'inductance-converter'] },
  { h2: 'Magnetism', intro: 'The SI↔CGS bridges (tesla-gauss, A/m-oersted, weber-maxwell, ampere-turn-gilbert) with their exact 4π relations.', slugs: ['magnetic-field-converter', 'magnetic-field-strength-converter', 'magnetic-flux-converter', 'magnetomotive-force-converter'] },
  { h2: 'Light & photometry', intro: 'Lighting design, display specs, and photography: lux, foot-candles, nits, lumens, and candelas, kept straight.', slugs: ['illuminance-converter', 'luminance-converter', 'luminous-energy-converter', 'luminous-flux-converter', 'luminous-intensity-converter'] },
  { h2: 'Radiation', intro: 'Gray-rad, sievert-rem, and becquerel-curie with exact regulatory factors. Unit conversion only — never dose assessment.', slugs: ['absorbed-dose-converter', 'equivalent-dose-converter', 'radioactivity-converter'] },
  { h2: 'Everyday & sizing', intro: 'Real-world numbers: fuel economy, wind, tires, screens, clothing, hats — plus two health calculators, running pace and pregnancy due date.', slugs: ['mpg-to-l100km', 'wind-speed-converter', 'tire-size-calculator', 'screen-size-calculator', 'clothing-size-converter', 'hat-size-converter', 'running-pace-calculator', 'due-date-calculator'] },
]

function roundupPost() {
  const sections = ROUNDUP_FAMILIES.map(f => {
    const items = f.slugs
      .map(s => `        <li><a href="/${s}">${CRUMB[s]}</a> — <a href="/blog/${s}">guide</a></li>`)
      .join('\n')
    return { h2: f.h2, body: `<p>${f.intro}</p>\n      <ul>\n${items}\n      </ul>` }
  })
  return {
    slug: ROUNDUP_SLUG,
    toolName: 'Unit Converter Tools hub',
    title: '45 new unit & sizing converters on maratool',
    seoTitle: '45 new unit & sizing converters — full tour | maratool',
    description: 'Area, pressure, energy, electrical, magnetism, light, radiation, fuel economy, tires, screens, clothing, and hats — every new converter, with guides.',
    lead: 'The conversion section grew by 45 tools in one release. Here is the full map — every converter, its reference standard, and its guide.',
    og: 'converter.svg',
    embedSlug: 'pressure-converter',
    embedTitle: 'Try one — the pressure converter (PSI, bar, kPa, atm)',
    embedHeight: 440,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Every tool below runs entirely in your browser with zero uploads, and every factor traces to an authoritative reference — NIST SP 811, the BIPM SI Brochure, NOAA, ACOG, ISO, or the US NRC — cited right on the page. Linear conversions share one audited engine; the special tools (tires, due dates, Beaufort winds) implement their published formulas. Pick a family:',
    steps: [
      '<strong>Find your quantity</strong> — the families below group all 45 tools.',
      '<strong>Open the tool</strong> — pick units, type a value, copy the result.',
      '<strong>Read the guide</strong> — each tool ships a post with its factor table and formula.',
    ],
    sections,
    guides: null,
    footerNote: 'Every tool above is free, runs locally, and never sends your data to a server. Browse them all in the <a href="/converter">converter hub</a> at <a href="/">maratool.com</a>.',
  }
}

const roundup = roundupPost()
fs.writeFileSync(path.join(OUT, `${roundup.slug}.astro`), render(roundup))
console.log('Wrote roundup', roundup.slug)

console.log('Done:', posts.length, 'Wave 5 blog posts + roundup')
