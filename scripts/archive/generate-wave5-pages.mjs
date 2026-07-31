#!/usr/bin/env node
/**
 * Generates Wave 5 tool pages (.astro) + per-tool engine configs (src/tools/<slug>.js).
 * Linear converters share src/tools/convert-engine.js; special tools have hand-written JS.
 * Run: node scripts/generate-wave5-pages.mjs
 */
import fs from 'fs'
import path from 'path'
import { LINEAR, REFS } from './wave5-data-linear.mjs'
import { SPECIAL } from './wave5-data-special.mjs'

const PAGES = path.join(import.meta.dirname, '..', '..', 'src', 'pages')
const TOOLS = path.join(import.meta.dirname, '..', '..', 'src', 'tools')

const SUB_SLUGS = { Unit: 'unit', Science: 'science', Electrical: 'electrical', Magnetism: 'magnetism', Light: 'light', Radiation: 'radiation', Sizing: 'sizing' }

// slug → display name for related-tool links (wave 5 + existing tools referenced)
const NAMES = {}
for (const t of LINEAR) NAMES[t.slug] = t.crumb
for (const t of SPECIAL) NAMES[t.slug] = t.crumb
Object.assign(NAMES, {
  'unit-converter': 'Unit Converter',
  'px-to-rem': 'PX to REM Converter',
  'base-converter': 'Number Base Converter',
  'shoe-size-converter': 'Shoe Size Converter',
  'bmi-calculator': 'BMI Calculator',
  'age-calculator': 'Age Calculator',
  'gestational-age-lmp': 'Gestational Age by LMP Calculator',
  'gestational-age-ultrasound': 'Gestational Age by Ultrasound Calculator',
})

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function plain(label) {
  return label.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase()
}

export function fmtNum(x) {
  if (!isFinite(x)) return ''
  if (Math.abs(x) >= 1e6 || (Math.abs(x) < 1e-3 && x !== 0)) return x.toExponential(4)
  const s = Math.abs(x) >= 100 ? x.toFixed(2) : x.toPrecision(6)
  return parseFloat(s).toString()
}

function noteHtml(cfg) {
  let inner
  if (cfg.refInline) {
    inner = cfg.note.replace(/\s*—\s*$/, '.')
  } else {
    const ref = REFS[cfg.ref]
    inner = `${cfg.note} <a href="${ref.url}" rel="noopener" target="_blank">${ref.name}</a>.`
  }
  const extra = cfg.extraNote ? ` <em>${cfg.extraNote}</em>` : ''
  return `<div class="tool-note"><strong>How this conversion works.</strong> ${inner}${extra}</div>`
}

function relatedList(cfg) {
  return cfg.related.map(slug => {
    const name = NAMES[slug]
    if (!name) throw new Error(`No name for related slug ${slug} (in ${cfg.slug})`)
    return { slug, name }
  })
}

/** FAQ for linear tools: computed pair Q + 2 hand-written + privacy */
export function linearFaq(cfg) {
  const units = {}
  for (const [label, f] of cfg.units) units[label] = Number(f)
  const a = cfg.from
  const b = cfg.to
  const ratio = units[a] / units[b]
  const pairQ = {
    q: `How do I convert ${plain(a)} to ${plain(b)}?`,
    a: `1 ${plain(a)} = ${fmtNum(ratio)} ${plain(b)}. Choose "${a}" as From and "${b}" as To, type a value, and the result updates instantly.`,
  }
  const privacy = {
    q: 'Is my data sent to a server?',
    a: `No. Conversions run entirely in your browser using fixed factors — nothing is uploaded or logged.`,
  }
  return [pairQ, cfg.faqB, cfg.faqC, privacy]
}

const LINEAR_HOWTO = [
  'Choose the units to convert from and to.',
  'Enter a value — the converted result updates instantly.',
  'Click Copy to copy the result to your clipboard.',
]

const UC_STYLES = `
<style is:global>
  .uc-converter { display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: start; }
  .uc-col { background: var(--bg-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; }
  .uc-select { width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text); font-size: 14px; margin-bottom: 0.75rem; cursor: pointer; }
  .uc-value { width: 100%; font-size: 18px; font-family: var(--font-mono); }
  .uc-result { font-size: 24px; font-weight: 700; font-family: var(--font-mono); color: var(--text); margin-bottom: 0.5rem; min-height: 36px; word-break: break-all; }
  .uc-swap-col { display: flex; align-items: center; padding-top: 2rem; }
  .uc-swap-btn { width: 40px; height: 40px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); color: var(--text-2); font-size: 18px; cursor: pointer; transition: background 0.1s; }
  .uc-swap-btn:hover { background: var(--bg-soft); }
  @media (max-width: 600px) {
    .uc-converter { grid-template-columns: 1fr; }
    .uc-swap-col { justify-content: center; padding-top: 0; }
  }
</style>`

const CALC_STYLES = `
<style is:global>
  .calc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem; }
  .calc-field { margin-bottom: 0.75rem; }
  .calc-select { max-width: 100%; }
  @media (max-width: 600px) { .calc-row { grid-template-columns: 1fr !important; } }
</style>`

function linearBody(cfg) {
  const p = cfg.prefix
  return `      <div class="tool-container" style="min-height:340px;">
        <div class="uc-converter">
          <div class="uc-col">
            <label class="tool-label" for="${p}-from-unit">From</label>
            <select id="${p}-from-unit" class="uc-select"></select>
            <input type="number" id="${p}-from-value" class="tool-input uc-value" placeholder="1" step="any" />
          </div>
          <div class="uc-swap-col">
            <button class="uc-swap-btn" id="${p}-swap" title="Swap units">&hArr;</button>
          </div>
          <div class="uc-col">
            <label class="tool-label" for="${p}-to-unit">To</label>
            <select id="${p}-to-unit" class="uc-select"></select>
            <div class="uc-result" id="${p}-result">&mdash;</div>
            <button class="copy-btn" id="${p}-copy">Copy</button>
          </div>
        </div>
        ${noteHtml(cfg)}
      </div>`
}

function specialBody(cfg) {
  return `      <div class="tool-container" style="min-height:${cfg.minHeight}px;">
${cfg.body}
        ${noteHtml(cfg)}
      </div>`
}

function page(cfg, { catSlug, catLabel, subSlug, subLabel, appCategory, howTo, faq, body, styles, scripts }) {
  const faqItems = faq.map(f => `      { '@type': 'Question', name: '${esc(f.q)}', acceptedAnswer: { '@type': 'Answer', text: '${esc(f.a)}' } }`).join(',\n')
  const faqUi = faq.map(f => `  { q: '${esc(f.q)}', a: '${esc(f.a)}' }`).join(',\n')
  const howToStr = howTo.map(s => `'${esc(s)}'`).join(',\n  ')
  const related = relatedList(cfg).map(t => `{ slug: '${t.slug}', name: '${esc(t.name)}' }`).join(',\n  ')

  return `---
import Base from '../layouts/Base.astro'
import Layout from '../components/Layout.astro'
import ToolShell from '../components/ToolShell.astro'

const seo = {
  title: '${esc(cfg.title)}',
  description: '${esc(cfg.desc)}',
  canonical: 'https://maratool.com/${cfg.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '${esc(cfg.name)}',
    url: 'https://maratool.com/${cfg.slug}',
    applicationCategory: '${appCategory}',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: '${esc(cfg.desc)}',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: '${catLabel}', item: 'https://maratool.com/${catSlug}' },
      { '@type': 'ListItem', position: 3, name: '${subLabel}', item: 'https://maratool.com/${catSlug}/${subSlug}' },
      { '@type': 'ListItem', position: 4, name: '${esc(cfg.name)}', item: 'https://maratool.com/${cfg.slug}' },
    ],
  },
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
${faqItems}
    ]
  }
}

const howTo = [
  ${howToStr}
]

const faq = [
${faqUi}
]

const relatedTools = [
  ${related}
]

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: '${catLabel}', href: '/${catSlug}' },
  { label: '${subLabel}', href: '/${catSlug}/${subSlug}' },
  { label: '${esc(cfg.crumb)}' },
]
---
<Base {...seo}>
  <Layout>
    <ToolShell slug="${cfg.slug}" name="${esc(cfg.name)}" description="${esc(cfg.shellDesc)}" howTo={howTo} faq={faq} relatedTools={relatedTools} breadcrumbs={breadcrumbs}>
${body}
    </ToolShell>
  </Layout>
</Base>
${styles}
${scripts}
`
}

/** Per-tool engine config file with NIST audit comments per factor line. */
function linearConfigJs(cfg) {
  const unitLines = cfg.units
    .map(([label, factor, comment]) => `        '${label.replace(/'/g, "\\'")}': ${factor}, // ${comment}`)
    .join('\n')
  return `/**
 * ${cfg.crumb} — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: ${REFS[cfg.ref].name} (${REFS[cfg.ref].url})
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: '${cfg.prefix}',
    categories: {
      ${cfg.catKey}: { label: '${cfg.catLabel.replace(/'/g, "\\'")}', base: '${cfg.base}', units: {
${unitLines}
      } }
    },
    defaultFrom: '${cfg.from.replace(/'/g, "\\'")}',
    defaultTo: '${cfg.to.replace(/'/g, "\\'")}',
  })
})()
`
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)
if (isMain) {
  for (const cfg of LINEAR) {
    const subSlug = SUB_SLUGS[cfg.sub]
    if (!subSlug) throw new Error(`No sub slug for ${cfg.sub}`)
    fs.writeFileSync(path.join(TOOLS, `${cfg.slug}.js`), linearConfigJs(cfg))
    fs.writeFileSync(path.join(PAGES, `${cfg.slug}.astro`), page(cfg, {
      catSlug: 'converter', catLabel: 'Converter', subSlug, subLabel: cfg.sub,
      appCategory: 'UtilitiesApplication',
      howTo: LINEAR_HOWTO,
      faq: linearFaq(cfg),
      body: linearBody(cfg),
      styles: UC_STYLES,
      scripts: `<script src="../tools/${cfg.slug}.js"></script>`,
    }))
    console.log('Wrote', cfg.slug)
  }

  for (const cfg of SPECIAL) {
    fs.writeFileSync(path.join(PAGES, `${cfg.slug}.astro`), page(cfg, {
      catSlug: cfg.catSlug, catLabel: cfg.catLabel, subSlug: cfg.subSlug, subLabel: cfg.subLabel,
      appCategory: cfg.appCategory,
      howTo: cfg.howTo,
      faq: cfg.faq,
      body: specialBody(cfg),
      styles: CALC_STYLES,
      scripts: `<script src="../tools/${cfg.jsFile}"></script>`,
    }))
    console.log('Wrote', cfg.slug)
  }

  console.log('Done:', LINEAR.length + SPECIAL.length, 'pages,', LINEAR.length, 'engine configs')
}
