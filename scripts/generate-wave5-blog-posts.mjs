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

      <BlogToolEmbed slug="${post.slug}" title="${esc(post.embedTitle)}" height={${post.embedHeight}} />

      <h2>How it works</h2>
      <ol>
${stepsHtml}
      </ol>

${sectionsHtml}

      <hr class="blog-divider" />
      <p class="blog-footer-note">The <a href="/${post.slug}">${post.toolName}</a> tool is free, runs locally, and never sends your data to a server. More <a href="${post.hub}">${post.hubLabel}</a> at <a href="/">maratool.com</a>.</p>
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

console.log('Done:', posts.length, 'Wave 5 blog posts')
