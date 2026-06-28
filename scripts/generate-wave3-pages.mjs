#!/usr/bin/env node
/**
 * Generates Wave 3 tool .astro pages from config.
 * Run: node scripts/generate-wave3-pages.mjs
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.join(import.meta.dirname, '..', 'src', 'pages')

function page(cfg) {
  const catSlug = cfg.categorySlug
  const subSlug = cfg.subcategorySlug
  const breadcrumbs = [
    `{ label: 'Home', href: '/' }`,
    `{ label: '${cfg.categoryLabel}', href: '/${catSlug}' }`,
    `{ label: '${cfg.subcategoryLabel}', href: '/${catSlug}/${subSlug}' }`,
    `{ label: '${cfg.breadcrumbName}' }`,
  ]
  const related = cfg.relatedTools.map(t => `{ slug: '${t.slug}', name: '${t.name}' }`).join(',\n  ')
  const faqItems = cfg.faq.map(f => `      { '@type': 'Question', name: '${f.q.replace(/'/g, "\\'")}', acceptedAnswer: { '@type': 'Answer', text: '${f.a.replace(/'/g, "\\'")}' } }`).join(',\n')
  const faqUi = cfg.faq.map(f => `  { q: '${f.q.replace(/'/g, "\\'")}', a: '${f.a.replace(/'/g, "\\'")}' }`).join(',\n')
  const howTo = cfg.howTo.map(s => `'${s.replace(/'/g, "\\'")}'`).join(',\n  ')

  return `---
import Base from '../layouts/Base.astro'
import Layout from '../components/Layout.astro'
import ToolShell from '../components/ToolShell.astro'

const seo = {
  title: '${cfg.title.replace(/'/g, "\\'")}',
  description: '${cfg.description.replace(/'/g, "\\'")}',
  canonical: 'https://maratool.com/${cfg.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '${cfg.h1.replace(/'/g, "\\'")}',
    url: 'https://maratool.com/${cfg.slug}',
    applicationCategory: '${cfg.appCategory}',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: '${cfg.description.replace(/'/g, "\\'")}',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: '${cfg.categoryLabel}', item: 'https://maratool.com/${catSlug}' },
      { '@type': 'ListItem', position: 3, name: '${cfg.subcategoryLabel}', item: 'https://maratool.com/${catSlug}/${subSlug}' },
      { '@type': 'ListItem', position: 4, name: '${cfg.h1.replace(/'/g, "\\'")}', item: 'https://maratool.com/${cfg.slug}' },
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
  ${howTo}
]

const faq = [
${faqUi}
]

const relatedTools = [
  ${related}
]

const breadcrumbs = [
  ${breadcrumbs.join(',\n  ')}
]
---
<Base {...seo}>
  <Layout>
    <ToolShell slug="${cfg.slug}" name="${cfg.h1.replace(/'/g, "\\'")}" description="${cfg.shellDesc.replace(/'/g, "\\'")}" howTo={howTo} faq={faq} relatedTools={relatedTools} breadcrumbs={breadcrumbs}>
${cfg.body}
    </ToolShell>
  </Layout>
</Base>
${cfg.styles || ''}
<script src="../tools/${cfg.jsFile}"></script>
`
}

const calcStyles = `
<style is:global>
  .calc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .calc-field { margin-bottom: 0.75rem; }
  .calc-select { max-width: 100%; }
  @media (max-width: 600px) { .calc-row { grid-template-columns: 1fr; } }
</style>`

const tools = [
  // ── Developer / SQL ──
  {
    slug: 'sql-minifier', jsFile: 'sql-minifier.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'sql', subcategoryLabel: 'SQL',
    title: 'SQL Minifier — Minify SQL Online | maratool',
    h1: 'SQL Minifier — Minify SQL Online',
    breadcrumbName: 'SQL Minifier',
    description: 'Minify SQL online by removing comments and extra whitespace. Paste messy queries and copy compact output instantly. Free tool, runs in your browser.',
    shellDesc: 'Paste SQL to strip comments and collapse whitespace. Minified output updates automatically with a one-click copy button.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste your SQL query in the input box.', 'Minified output updates automatically as you type.', 'Click Copy to copy the compact SQL.'],
    faq: [
      { q: 'What does SQL minification remove?', a: 'Line and block comments, extra spaces, and line breaks while keeping the query executable.' },
      { q: 'Does minification change SQL meaning?', a: 'No. It only removes comments and redundant whitespace outside string literals.' },
      { q: 'Which SQL dialects are supported?', a: 'Standard SQL comment syntax (-- and /* */) is handled for most databases.' },
      { q: 'Is my SQL sent to a server?', a: 'No. Minification happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'sql-formatter', name: 'SQL Formatter' }, { slug: 'sql-insert-generator', name: 'SQL INSERT Generator' }, { slug: 'sql-create-table-generator', name: 'CREATE TABLE Generator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="sm-input">SQL input</label>
        <textarea id="sm-input" class="tool-textarea" rows="8" placeholder="SELECT id, name FROM users WHERE active = 1"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Minified output</label>
          <button type="button" id="sm-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="sm-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
  },
  {
    slug: 'sql-insert-generator', jsFile: 'sql-insert-generator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'sql', subcategoryLabel: 'SQL',
    title: 'SQL INSERT Generator — JSON to INSERT | maratool',
    h1: 'SQL INSERT Generator — JSON to INSERT',
    breadcrumbName: 'SQL INSERT Generator',
    description: 'Generate SQL INSERT statements from JSON arrays. Enter a table name, paste JSON rows, and copy ready INSERT SQL. Free, runs in your browser.',
    shellDesc: 'Enter a table name and paste a JSON array of objects to generate INSERT INTO statements with escaped values.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter the target table name.', 'Paste a JSON array of row objects in the textarea.', 'Copy the generated INSERT statement from the output.'],
    faq: [
      { q: 'What JSON format is expected?', a: 'A JSON array of objects where each object is one row, e.g. [{"id":1,"name":"Alice"}].' },
      { q: 'How are strings escaped?', a: 'Single quotes in string values are doubled per standard SQL escaping.' },
      { q: 'Does it support NULL values?', a: 'Yes. JSON null becomes SQL NULL in the generated statement.' },
      { q: 'Is my data sent to a server?', a: 'No. Generation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'sql-create-table-generator', name: 'CREATE TABLE Generator' }, { slug: 'sql-minifier', name: 'SQL Minifier' }, { slug: 'csv-to-json', name: 'Convert CSV to JSON' }],
    body: `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-field"><label class="tool-label" for="sig-table">Table name</label><input type="text" id="sig-table" class="tool-input" placeholder="users" style="max-width:280px;" /></div>
        <label class="tool-label" for="sig-json">JSON rows</label>
        <textarea id="sig-json" class="tool-textarea" rows="8" placeholder='[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]'></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">INSERT statement</label>
          <button type="button" id="sig-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="sig-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'sql-create-table-generator', jsFile: 'sql-create-table-generator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'sql', subcategoryLabel: 'SQL',
    title: 'CREATE TABLE Generator — JSON Schema to SQL | maratool',
    h1: 'CREATE TABLE Generator — JSON to SQL',
    breadcrumbName: 'CREATE TABLE Generator',
    description: 'Generate CREATE TABLE SQL from JSON schema or sample rows. Infer column types automatically. Free CREATE TABLE generator, runs in your browser.',
    shellDesc: 'Enter a table name and paste JSON sample rows or a column type map to generate a CREATE TABLE statement.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter the table name.', 'Paste JSON sample rows or a column-name-to-type object.', 'Copy the generated CREATE TABLE SQL.'],
    faq: [
      { q: 'How are column types inferred?', a: 'From the first row in a JSON array: numbers become INTEGER/REAL, booleans BOOLEAN, dates TIMESTAMP, objects JSON.' },
      { q: 'Can I pass explicit column types?', a: 'Yes. Paste a JSON object like {"id":"INTEGER","name":"TEXT"} instead of sample rows.' },
      { q: 'Which SQL dialect is generated?', a: 'Portable SQL similar to SQLite/PostgreSQL with quoted identifiers.' },
      { q: 'Is my data sent to a server?', a: 'No. Generation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'sql-insert-generator', name: 'SQL INSERT Generator' }, { slug: 'sql-formatter', name: 'SQL Formatter' }, { slug: 'json-formatter', name: 'JSON Formatter' }],
    body: `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-field"><label class="tool-label" for="sct-table">Table name</label><input type="text" id="sct-table" class="tool-input" placeholder="users" style="max-width:280px;" /></div>
        <label class="tool-label" for="sct-schema">JSON schema or sample rows</label>
        <textarea id="sct-schema" class="tool-textarea" rows="8" placeholder='[{"id":1,"name":"Alice","active":true}]'></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">CREATE TABLE</label>
          <button type="button" id="sct-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="sct-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
    styles: calcStyles,
  },

  // ── Developer / AI ──
  {
    slug: 'rag-chunk-calculator', jsFile: 'rag-chunk-calculator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'RAG Chunk Calculator — Estimate Chunk Count | maratool',
    h1: 'RAG Chunk Calculator — Estimate Chunk Count',
    breadcrumbName: 'RAG Chunk Calculator',
    description: 'Estimate RAG chunk count from total tokens, chunk size, and overlap. Plan vector index size before embedding. Free, instant, runs in your browser.',
    shellDesc: 'Enter total tokens, chunk size, and overlap to see estimated chunk count and step size for RAG pipelines.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter total document tokens (from your tokenizer).', 'Set chunk size and overlap in tokens.', 'See estimated chunk count and step size instantly.'],
    faq: [
      { q: 'How is chunk count calculated?', a: 'For documents longer than one chunk: ceil((total − overlap) / (chunk size − overlap)).' },
      { q: 'What overlap should I use?', a: 'Common choices: 10–20% of chunk size to preserve context across chunk boundaries.' },
      { q: 'Can overlap equal chunk size?', a: 'No. Overlap must be less than chunk size or the step size would be zero.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'ai-token-calculator', name: 'AI Token Counter' }, { slug: 'context-window-calculator', name: 'AI Context Window Calculator' }, { slug: 'embedding-cost-calculator', name: 'AI Embedding Cost Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="rc-tokens">Total tokens</label><input type="number" id="rc-tokens" class="tool-input" placeholder="50000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="rc-size">Chunk size</label><input type="number" id="rc-size" class="tool-input" placeholder="512" min="1" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="rc-overlap">Overlap</label><input type="number" id="rc-overlap" class="tool-input" placeholder="50" min="0" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="rc-count">—</span><span class="tool-stat-label">Chunk count</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="rc-step">—</span><span class="tool-stat-label">Step size</span></div>
        </div>
        <p id="rc-error" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;"></p>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'ai-model-comparison', jsFile: 'ai-model-comparison.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'AI Model Comparison — Compare API Costs | maratool',
    h1: 'AI Model Comparison — Compare API Costs',
    breadcrumbName: 'AI Model Comparison',
    description: 'Compare AI API costs across GPT, Claude, and Gemini models. Enter input and output tokens, select models, see a cost table. Free, runs in your browser.',
    shellDesc: 'Enter input and output token counts, select models to compare, and see per-model input, output, and total cost in a sortable table.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter input and output token counts.', 'Select one or more models to compare.', 'Review the comparison table sorted by total cost.'],
    faq: [
      { q: 'Which models are included?', a: 'Popular OpenAI, Anthropic, and Google models with published per-million-token pricing.' },
      { q: 'How is total cost calculated?', a: 'Input tokens × input price + output tokens × output price, per model.' },
      { q: 'Are prices up to date?', a: 'Based on published API rates. Verify current pricing on provider websites before budgeting.' },
      { q: 'Is my data sent to a server?', a: 'No. Comparison happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'ai-cost-calculator', name: 'AI API Cost Calculator' }, { slug: 'ai-token-calculator', name: 'AI Token Counter' }, { slug: 'embedding-cost-calculator', name: 'AI Embedding Cost Calculator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="amc-in">Input tokens</label><input type="number" id="amc-in" class="tool-input" placeholder="1000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="amc-out">Output tokens</label><input type="number" id="amc-out" class="tool-input" placeholder="500" min="0" /></div>
        </div>
        <div class="calc-field"><label class="tool-label">Models to compare</label><div id="amc-models" style="display:flex;flex-wrap:wrap;gap:0.75rem 1.25rem;"></div></div>
        <div id="amc-table" style="overflow-x:auto;margin-top:1rem;"></div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'llm-json-extractor', jsFile: 'llm-json-extractor.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'LLM JSON Extractor — Parse JSON from AI Output | maratool',
    h1: 'LLM JSON Extractor — Parse JSON from AI Output',
    breadcrumbName: 'LLM JSON Extractor',
    description: 'Extract JSON blocks from LLM output text. Finds fenced code blocks and raw objects with copy per block. Free, instant, runs in your browser.',
    shellDesc: 'Paste LLM response text to list every JSON block found, with validity status and a copy button per block.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the full LLM response text.', 'JSON blocks are detected automatically in fences and inline.', 'Click Copy on any extracted block to use it in your app.'],
    faq: [
      { q: 'What formats does it detect?', a: 'Markdown ```json fences, generic code fences, and inline { ... } JSON objects.' },
      { q: 'Does it validate JSON syntax?', a: 'Yes. Each block is marked valid or invalid with a parse attempt.' },
      { q: 'Can it extract multiple blocks?', a: 'Yes. Every distinct JSON block in the text is listed separately.' },
      { q: 'Is my text sent to a server?', a: 'No. Extraction happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'json-formatter', name: 'JSON Formatter' }, { slug: 'json-diff', name: 'JSON Diff' }, { slug: 'prompt-variable-tester', name: 'Prompt Variable Tester' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="lje-input">LLM output</label>
        <textarea id="lje-input" class="tool-textarea" rows="10" placeholder="Paste LLM response with JSON blocks…"></textarea>
        <p class="tool-label" style="margin:1rem 0 0.5rem;">Extracted JSON blocks</p>
        <div id="lje-blocks" style="min-height:80px;"></div>
      </div>`,
  },

  // ── Developer / Security (paste-only) ──
  {
    slug: 'hash-identifier', jsFile: 'hash-identifier.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'Hash Identifier — Identify Hash Type Online | maratool',
    h1: 'Hash Identifier — Identify Hash Type Online',
    breadcrumbName: 'Hash Identifier',
    description: 'Identify hash type from a pasted digest. Detect MD5, SHA-1, SHA-256, SHA-512, and bcrypt formats instantly. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste a hash string to identify MD5, SHA-256, bcrypt, and other formats. Does not query breach databases — paste-only.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the hash digest in the input field.', 'See detected hash type and format message instantly.', 'Use the result to pick the right cracking or verification approach.'],
    faq: [
      { q: 'Which hash types are recognized?', a: 'MD5, SHA-1, SHA-256, SHA-512, bcrypt, and unknown hex digests by length.' },
      { q: 'Can this crack or reverse hashes?', a: 'No. It only identifies the format from the digest pattern — paste-only analysis.' },
      { q: 'Does it check breach databases?', a: 'No. No network requests are made. Paste-only local pattern matching.' },
      { q: 'Is my hash sent to a server?', a: 'No. Identification happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'hash-generator', name: 'Hash Generator' }, { slug: 'bcrypt-generator', name: 'Bcrypt Generator' }, { slug: 'password-strength-checker', name: 'Password Strength Checker' }],
    body: `      <div class="tool-container" style="min-height:240px;">
        <div class="calc-field"><label class="tool-label" for="hi-input">Hash digest</label><input type="text" id="hi-input" class="tool-input" placeholder="Paste hash here…" autocomplete="off" spellcheck="false" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="hi-type">—</span><span class="tool-stat-label">Type</span></div>
        </div>
        <p id="hi-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">—</p>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'iban-validator', jsFile: 'iban-validator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'IBAN Validator — Check IBAN Online | maratool',
    h1: 'IBAN Validator — Check IBAN Online',
    breadcrumbName: 'IBAN Validator',
    description: 'Validate IBAN numbers with mod-97 check digits. Paste an IBAN to verify format and checksum instantly. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste an IBAN to validate structure and mod-97 check digits. Does not verify account existence — paste-only.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the IBAN string in the input field.', 'See validation status, country code, and formatted IBAN.', 'Fix check digits or formatting errors before submitting payments.'],
    faq: [
      { q: 'How is IBAN validated?', a: 'Mod-97 checksum on the rearranged IBAN per ISO 13616.' },
      { q: 'Does this verify the bank account exists?', a: 'No. It only validates format and check digits — paste-only, no bank lookup.' },
      { q: 'Are spaces allowed?', a: 'Yes. Spaces are stripped before validation and the formatted output groups by fours.' },
      { q: 'Is my IBAN sent to a server?', a: 'No. Validation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'luhn-checker', name: 'Luhn Checker' }, { slug: 'hash-identifier', name: 'Hash Identifier' }, { slug: 'jwt-security-checker', name: 'JWT Security Checker' }],
    body: `      <div class="tool-container" style="min-height:240px;">
        <div class="calc-field"><label class="tool-label" for="ib-input">IBAN</label><input type="text" id="ib-input" class="tool-input" placeholder="GB82 WEST 1234 5698 7654 32" autocomplete="off" spellcheck="false" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="ib-valid">—</span><span class="tool-stat-label">Valid</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="ib-country">—</span><span class="tool-stat-label">Country</span></div>
        </div>
        <p id="ib-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">—</p>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'luhn-checker', jsFile: 'luhn-checker.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'Luhn Checker — Validate Card Number Online | maratool',
    h1: 'Luhn Checker — Validate Card Number Online',
    breadcrumbName: 'Luhn Checker',
    description: 'Check credit card numbers with the Luhn algorithm. Paste digits to verify checksum validity instantly. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste a card or identifier number to run the Luhn checksum. Does not verify issuer or account — paste-only.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the numeric string (spaces and dashes are ignored).', 'See pass or fail for the Luhn checksum instantly.', 'Use before form validation or payment integration testing.'],
    faq: [
      { q: 'What is the Luhn algorithm?', a: 'A checksum formula used by credit cards and many ID numbers to catch single-digit typos.' },
      { q: 'Does passing Luhn mean the card is real?', a: 'No. It only validates the checksum — not issuer, expiry, or account status.' },
      { q: 'Are spaces and dashes supported?', a: 'Yes. Non-digit characters are stripped before validation.' },
      { q: 'Is my number sent to a server?', a: 'No. The Luhn check runs entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'iban-validator', name: 'IBAN Validator' }, { slug: 'hash-identifier', name: 'Hash Identifier' }, { slug: 'gtin-validator', name: 'GTIN Validator' }],
    body: `      <div class="tool-container" style="min-height:240px;">
        <div class="calc-field"><label class="tool-label" for="lu-input">Number</label><input type="text" id="lu-input" class="tool-input" placeholder="4532 0151 1283 0366" inputmode="numeric" autocomplete="off" spellcheck="false" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="lu-valid">—</span><span class="tool-stat-label">Luhn check</span></div>
        </div>
        <p id="lu-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">—</p>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'jwt-security-checker', jsFile: 'jwt-security-checker.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'JWT Security Checker — Audit JWT Issues | maratool',
    h1: 'JWT Security Checker — Audit JWT Issues',
    breadcrumbName: 'JWT Security Checker',
    description: 'Audit JWT security issues from a pasted token. Flag alg none, missing exp, and weak claims instantly. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste a JWT to decode header and payload and list security issues by severity. Does not verify signatures — paste-only.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the JWT token in the input field.', 'Review decoded header, payload, and security issue list.', 'Fix high-severity issues before deploying to production.'],
    faq: [
      { q: 'Does this verify the JWT signature?', a: 'No. It audits common security issues in header and payload claims — paste-only decode.' },
      { q: 'What issues are flagged?', a: 'alg none, missing exp, expired tokens, weak symmetric setup, and missing subject claims.' },
      { q: 'Is it safe to paste production JWTs?', a: 'Processing is local in your browser, but avoid pasting live secrets in shared environments.' },
      { q: 'Is my JWT sent to a server?', a: 'No. Auditing happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'jwt-decoder', name: 'JWT Decoder' }, { slug: 'hash-identifier', name: 'Hash Identifier' }, { slug: 'password-strength-checker', name: 'Password Strength Checker' }],
    body: `      <div class="tool-container" style="min-height:400px;">
        <label class="tool-label" for="jws-input">JWT token</label>
        <textarea id="jws-input" class="tool-textarea" rows="4" placeholder="Paste JWT here…" spellcheck="false"></textarea>
        <div class="tool-stats" style="margin-top:1rem;">
          <div class="tool-stat"><span class="tool-stat-value" id="jws-risk">—</span><span class="tool-stat-label">Risk level</span></div>
        </div>
        <ul id="jws-issues" style="font-size:13px;color:var(--text-2);padding-left:1.25rem;margin:1rem 0;"></ul>
      </div>`,
  },

  // ── Text / Transform (paste-only for HTML/CSS) ──
  {
    slug: 'html-minifier', jsFile: 'html-minifier.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'transform', subcategoryLabel: 'Transform',
    title: 'HTML Minifier — Minify HTML Online | maratool',
    h1: 'HTML Minifier — Minify HTML Online',
    breadcrumbName: 'HTML Minifier',
    description: 'Minify HTML by removing comments and extra whitespace. Paste HTML and copy compact output instantly. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste HTML to strip comments and collapse whitespace between tags. Does not fetch live URLs — paste-only.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your HTML in the input box.', 'Minified output updates automatically.', 'Click Copy to copy the compact HTML.'],
    faq: [
      { q: 'What does HTML minification remove?', a: 'HTML comments and whitespace between tags. Inline text spacing may be collapsed.' },
      { q: 'Can I minify fetched pages?', a: 'No. Paste HTML from View Source or your editor — this tool does not fetch URLs.' },
      { q: 'Will minification break my page?', a: 'Generally safe for production HTML. Test if you rely on whitespace-sensitive pre/code blocks.' },
      { q: 'Is my HTML sent to a server?', a: 'No. Minification happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'html-beautifier', name: 'HTML Beautifier' }, { slug: 'css-minifier', name: 'CSS Minifier' }, { slug: 'markdown-converter', name: 'Markdown Converter' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="hmin-input">HTML input</label>
        <textarea id="hmin-input" class="tool-textarea" rows="8" placeholder="<div>  Hello   <span>world</span>  </div>"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Minified output</label>
          <button type="button" id="hmin-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="hmin-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
  },
  {
    slug: 'html-beautifier', jsFile: 'html-beautifier.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'transform', subcategoryLabel: 'Transform',
    title: 'HTML Beautifier — Format HTML Online | maratool',
    h1: 'HTML Beautifier — Format HTML Online',
    breadcrumbName: 'HTML Beautifier',
    description: 'Beautify and indent HTML with readable line breaks. Paste minified HTML and copy formatted output. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste HTML to add indentation and line breaks for readability. Does not fetch live URLs — paste-only.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste minified or messy HTML in the input box.', 'Formatted output updates automatically.', 'Click Copy to copy the beautified HTML.'],
    faq: [
      { q: 'How is HTML beautified?', a: 'Tags are placed on separate lines with indentation based on nesting depth.' },
      { q: 'Can I beautify live page HTML?', a: 'Copy HTML from View Source and paste it here — the tool does not fetch URLs.' },
      { q: 'Does it validate HTML?', a: 'It formats structure for readability but does not enforce HTML5 validity.' },
      { q: 'Is my HTML sent to a server?', a: 'No. Formatting happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'html-minifier', name: 'HTML Minifier' }, { slug: 'css-minifier', name: 'CSS Minifier' }, { slug: 'json-formatter', name: 'JSON Formatter' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="hbea-input">HTML input</label>
        <textarea id="hbea-input" class="tool-textarea" rows="8" placeholder="<div><p>Hello</p><ul><li>One</li></ul></div>"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Beautified output</label>
          <button type="button" id="hbea-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="hbea-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
  },
  {
    slug: 'css-minifier', jsFile: 'css-minifier.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'transform', subcategoryLabel: 'Transform',
    title: 'CSS Minifier — Minify CSS Online | maratool',
    h1: 'CSS Minifier — Minify CSS Online',
    breadcrumbName: 'CSS Minifier',
    description: 'Minify CSS by removing comments and extra whitespace. Paste stylesheets and copy compact output. Paste-only, free, runs in your browser.',
    shellDesc: 'Paste CSS to remove comments and collapse whitespace. Does not fetch external stylesheets — paste-only.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your CSS in the input box.', 'Minified output updates automatically.', 'Click Copy to copy the compact CSS.'],
    faq: [
      { q: 'What does CSS minification remove?', a: 'Comments and unnecessary whitespace outside of strings.' },
      { q: 'Can it minify linked stylesheets?', a: 'No. Copy CSS from your file or DevTools and paste it here.' },
      { q: 'Will minification change selectors?', a: 'No. Only whitespace and comments are removed — rules stay the same.' },
      { q: 'Is my CSS sent to a server?', a: 'No. Minification happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'html-minifier', name: 'HTML Minifier' }, { slug: 'html-beautifier', name: 'HTML Beautifier' }, { slug: 'px-to-rem', name: 'PX to REM Converter' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="cssm-input">CSS input</label>
        <textarea id="cssm-input" class="tool-textarea" rows="8" placeholder=".card {&#10;  padding: 1rem;&#10;  /* comment */&#10;  color: #333;&#10;}"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Minified output</label>
          <button type="button" id="cssm-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="cssm-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
  },

  // ── Developer / Reference ──
  {
    slug: 'url-parser', jsFile: 'url-parser.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'reference', subcategoryLabel: 'Reference',
    title: 'URL Parser — Parse URL Components Online | maratool',
    h1: 'URL Parser — Parse URL Components Online',
    breadcrumbName: 'URL Parser',
    description: 'Parse URLs into protocol, host, path, query params, and hash. Paste any URL string for an instant component breakdown. Free, runs in your browser.',
    shellDesc: 'Paste a URL to see protocol, hostname, port, pathname, query parameters, and hash broken into readable fields.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste a full or partial URL in the input field.', 'See each component parsed into labeled fields.', 'Use query params for API debugging and routing tests.'],
    faq: [
      { q: 'What if the URL has no protocol?', a: 'https:// is assumed when parsing URLs without a scheme.' },
      { q: 'Are query parameters decoded?', a: 'Keys and values are listed as parsed by the URL API; encoding is preserved.' },
      { q: 'Does this fetch the URL?', a: 'No. It only parses the string locally — no network requests.' },
      { q: 'Is my URL sent to a server?', a: 'No. Parsing happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'curl-generator', name: 'cURL Command Generator' }, { slug: 'base64', name: 'Base64 Encode / Decode' }, { slug: 'json-formatter', name: 'JSON Formatter' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div class="calc-field"><label class="tool-label" for="up-input">URL</label><input type="text" id="up-input" class="tool-input" placeholder="https://api.example.com/users?page=1#top" spellcheck="false" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="up-valid">—</span><span class="tool-stat-label">Valid</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="up-protocol">—</span><span class="tool-stat-label">Protocol</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="up-host">—</span><span class="tool-stat-label">Hostname</span></div>
        </div>
        <dl id="up-fields" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;display:grid;grid-template-columns:auto 1fr;gap:0.25rem 1rem;"></dl>
        <p id="up-error" style="font-size:13px;color:var(--text-2);margin:0;"></p>
      </div>`,
    styles: calcStyles,
  },

  // ── Education / Calculator ──
  {
    slug: 'gpa-calculator', jsFile: 'gpa-calculator.js',
    categorySlug: 'education', categoryLabel: 'Education', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'GPA Calculator — Calculate GPA Online | maratool',
    h1: 'GPA Calculator — Calculate GPA Online',
    breadcrumbName: 'GPA Calculator',
    description: 'Calculate GPA from letter grades and credit hours on a 4.0 scale. Add courses dynamically and see weighted GPA instantly. Free, runs in your browser.',
    shellDesc: 'Add courses with letter grades and credit hours to calculate your weighted GPA on a standard 4.0 scale.',
    appCategory: 'EducationApplication',
    howTo: ['Add a row for each course with letter grade and credits.', 'Click Add row for additional courses.', 'See your weighted GPA and total credits instantly.'],
    faq: [
      { q: 'What grading scale is used?', a: 'Standard US 4.0 scale: A=4.0, B=3.0, C=2.0, D=1.0, F=0 with plus/minus variants.' },
      { q: 'How is GPA calculated?', a: 'Sum of (grade points × credits) divided by total credits.' },
      { q: 'Can I add unlimited courses?', a: 'Yes. Add as many course rows as needed.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'grade-calculator', name: 'Grade Calculator' }, { slug: 'final-grade-calculator', name: 'Final Grade Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div id="gpa-rows"></div>
        <button type="button" id="gpa-add" class="tool-button" style="margin-bottom:1rem;">Add row</button>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="gpa-value">—</span><span class="tool-stat-label">GPA</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="gpa-credits">—</span><span class="tool-stat-label">Total credits</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'grade-calculator', jsFile: 'grade-calculator.js',
    categorySlug: 'education', categoryLabel: 'Education', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Grade Calculator — Weighted Course Grade | maratool',
    h1: 'Grade Calculator — Weighted Course Grade',
    breadcrumbName: 'Grade Calculator',
    description: 'Calculate weighted course grade from assignments. Enter scores and weights to see your overall percentage. Free grade calculator, runs in your browser.',
    shellDesc: 'Add weighted assignments with scores and weights to calculate your overall course percentage.',
    appCategory: 'EducationApplication',
    howTo: ['Add each assignment with a name, score, and weight percentage.', 'Click Add assignment for more rows.', 'See your weighted course grade percentage instantly.'],
    faq: [
      { q: 'How is weighted grade calculated?', a: 'Sum of (score × weight) divided by total weight. Weights do not need to sum to 100.' },
      { q: 'What score format is used?', a: 'Percentages 0–100 for each assignment score.' },
      { q: 'Can weights be uneven?', a: 'Yes. Enter each assignment weight as a percentage of the total grade.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'final-grade-calculator', name: 'Final Grade Calculator' }, { slug: 'gpa-calculator', name: 'GPA Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div id="gc-rows"></div>
        <button type="button" id="gc-add" class="tool-button" style="margin-bottom:1rem;">Add assignment</button>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="gc-percent">—</span><span class="tool-stat-label">Course grade</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'final-grade-calculator', jsFile: 'final-grade-calculator.js',
    categorySlug: 'education', categoryLabel: 'Education', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Final Grade Calculator — Score Needed on Final | maratool',
    h1: 'Final Grade Calculator — Score Needed on Final',
    breadcrumbName: 'Final Grade Calculator',
    description: 'Calculate the final exam score you need to reach your target grade. Enter current percentage, desired grade, and final weight. Free, runs in your browser.',
    shellDesc: 'Enter current course percentage, desired final grade, and final exam weight to see the score you need on the final.',
    appCategory: 'EducationApplication',
    howTo: ['Enter your current course percentage.', 'Set your desired final grade and the final exam weight.', 'See the required final exam score and whether it is achievable.'],
    faq: [
      { q: 'How is the needed score calculated?', a: 'Needed = (Desired − Current × (1 − FinalWeight/100)) / (FinalWeight/100).' },
      { q: 'What if the needed score is over 100%?', a: 'The tool marks the target as not achievable with your current standing.' },
      { q: 'Are weights in percentages?', a: 'Yes. Final weight is the percentage of your total grade from the final exam.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'grade-calculator', name: 'Grade Calculator' }, { slug: 'gpa-calculator', name: 'GPA Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="fg-current">Current grade (%)</label><input type="number" id="fg-current" class="tool-input" placeholder="85" min="0" max="100" step="any" /></div>
          <div class="calc-field"><label class="tool-label" for="fg-desired">Desired grade (%)</label><input type="number" id="fg-desired" class="tool-input" placeholder="90" min="0" max="100" step="any" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="fg-weight">Final exam weight (%)</label><input type="number" id="fg-weight" class="tool-input" placeholder="30" min="1" max="100" step="any" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="fg-needed">—</span><span class="tool-stat-label">Score needed</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="fg-possible">—</span><span class="tool-stat-label">Achievable</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'reading-level-calculator', jsFile: 'reading-level-calculator.js',
    categorySlug: 'education', categoryLabel: 'Education', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Reading Level Calculator — Flesch-Kincaid Grade | maratool',
    h1: 'Reading Level Calculator — Flesch-Kincaid Grade',
    breadcrumbName: 'Reading Level Calculator',
    description: 'Calculate reading level and Flesch-Kincaid grade from pasted text. See word count, sentences, and readability score. Free, runs in your browser.',
    shellDesc: 'Paste text to see Flesch-Kincaid grade level, reading ease score, word count, and sentence count.',
    appCategory: 'EducationApplication',
    howTo: ['Paste or type your text in the textarea.', 'Reading level stats update automatically.', 'Use grade level and reading ease to target your audience.'],
    faq: [
      { q: 'What is Flesch-Kincaid grade level?', a: 'A US school-grade estimate based on average sentence length and syllables per word.' },
      { q: 'What is reading ease?', a: 'Flesch Reading Ease: higher scores (up to ~100) mean easier text; lower scores mean harder text.' },
      { q: 'How are syllables counted?', a: 'Heuristic vowel-group counting — accurate for most English prose.' },
      { q: 'Is my text sent to a server?', a: 'No. Analysis happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'reading-time', name: 'Reading Time Calculator' }, { slug: 'word-counter', name: 'Word Counter' }, { slug: 'grade-calculator', name: 'Grade Calculator' }],
    body: `      <div class="tool-container" style="min-height:400px;">
        <label class="tool-label" for="rl-input">Text</label>
        <textarea id="rl-input" class="tool-textarea" rows="8" placeholder="Paste text to analyze reading level…"></textarea>
        <div class="tool-stats" style="margin-top:1rem;">
          <div class="tool-stat"><span class="tool-stat-value" id="rl-grade">—</span><span class="tool-stat-label">Grade level</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="rl-ease">—</span><span class="tool-stat-label">Reading ease</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="rl-words">—</span><span class="tool-stat-label">Words</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="rl-sentences">—</span><span class="tool-stat-label">Sentences</span></div>
        </div>
      </div>`,
  },
]

for (const cfg of tools) {
  const file = path.join(ROOT, `${cfg.slug}.astro`)
  fs.writeFileSync(file, page(cfg))
  console.log('Wrote', file)
}

console.log('Done:', tools.length, 'pages')
