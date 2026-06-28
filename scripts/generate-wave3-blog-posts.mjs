#!/usr/bin/env node
/**
 * Generate Wave 3 tool launch blog posts with BlogToolEmbed.
 * Run: node scripts/generate-wave3-blog-posts.mjs
 */
import fs from 'fs'
import path from 'path'

const OUT = path.join(import.meta.dirname, '..', 'src', 'pages', 'blog')
const DATE = 'June 28, 2026'
const DATE_ISO = '2026-06-28'

const posts = [
  {
    slug: 'sql-minifier',
    title: 'How to minify SQL queries online',
    seoTitle: 'SQL minifier — compress SQL online | maratool',
    description: 'Minify SQL queries by removing comments and whitespace. Smaller payloads for logs and APIs. Free browser SQL minifier.',
    lead: 'Paste formatted SQL — get a compressed one-liner with comments and extra whitespace removed.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste SQL to minify',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Formatted SQL is readable; minified SQL is smaller for transport and storage. The <a href="/sql-minifier">SQL Minifier</a> strips comments and collapses whitespace — entirely in your browser.',
    steps: [
      '<strong>Paste SQL</strong> — SELECT, INSERT, or any query with comments.',
      '<strong>Minified output</strong> — updates as you type.',
      '<strong>Copy</strong> — one-liner ready for logs or embedded queries.',
    ],
    sections: [
      { h2: 'When to minify', body: '<p>Use minified SQL when size matters: mobile payloads, audit logs, or storing query templates. For readability, pair with the <a href="/sql-formatter">SQL Formatter</a>.</p>' },
      { h2: 'Privacy', body: '<p>Queries never leave your device. Safe for production schemas and sensitive table names.</p>' },
    ],
  },
  {
    slug: 'sql-insert-generator',
    title: 'How to generate SQL INSERT statements from JSON',
    seoTitle: 'SQL INSERT generator from JSON | maratool',
    description: 'Generate SQL INSERT statements from JSON arrays. Paste JSON and copy ready-to-run INSERT queries. Free browser tool.',
    lead: 'Paste a JSON array of objects — get copy-ready INSERT statements with escaped values.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste JSON array',
    embedHeight: 500,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Seeding a database from API fixtures means hand-writing INSERT statements — or generating them. The <a href="/sql-insert-generator">SQL INSERT Generator</a> converts JSON arrays into INSERT queries with proper quoting.',
    steps: [
      '<strong>Paste JSON</strong> — array of objects with matching keys.',
      '<strong>Table name</strong> — target table for the INSERT statements.',
      '<strong>Copy SQL</strong> — one INSERT per row, values escaped.',
    ],
    sections: [
      { h2: 'JSON shape', body: '<p>Each object becomes one row. Keys map to column names. Nested objects and arrays may need flattening before import.</p>' },
      { h2: 'Schema first', body: '<p>Need the CREATE TABLE DDL? Use the <a href="/sql-create-table-generator">CREATE TABLE Generator</a> from the same JSON sample.</p>' },
    ],
  },
  {
    slug: 'sql-create-table-generator',
    title: 'How to generate CREATE TABLE SQL from JSON',
    seoTitle: 'CREATE TABLE generator from JSON | maratool',
    description: 'Generate CREATE TABLE SQL from JSON schema or sample rows. Infer column types instantly. Free browser tool.',
    lead: 'Paste JSON objects — get CREATE TABLE DDL with inferred column types.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste JSON sample rows',
    embedHeight: 500,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Prototyping a schema from sample data is faster than writing DDL by hand. The <a href="/sql-create-table-generator">CREATE TABLE Generator</a> inspects JSON keys and values to infer VARCHAR, INT, BOOLEAN, and other column types.',
    steps: [
      '<strong>Paste JSON</strong> — one object or an array of sample rows.',
      '<strong>Table name</strong> — name for the generated table.',
      '<strong>Copy DDL</strong> — CREATE TABLE statement ready to run.',
    ],
    sections: [
      { h2: 'Type inference', body: '<p>Types are guessed from JavaScript typeof and value patterns. Review before production — dates and decimals may need manual adjustment.</p>' },
      { h2: 'Seed data', body: '<p>After creating the table, populate it with the <a href="/sql-insert-generator">SQL INSERT Generator</a>.</p>' },
    ],
  },
  {
    slug: 'rag-chunk-calculator',
    title: 'How to calculate RAG chunk count and overlap',
    seoTitle: 'RAG chunk calculator — vector chunk size | maratool',
    description: 'Calculate RAG chunk count from token total, chunk size, and overlap. Plan vector indexing splits in your browser.',
    lead: 'Enter total tokens, chunk size, and overlap — see how many chunks your corpus produces.',
    og: 'developer.svg',
    embedTitle: 'Try it — tokens, chunk size, overlap',
    embedHeight: 420,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Vector search pipelines split documents into overlapping chunks before embedding. The <a href="/rag-chunk-calculator">RAG Chunk Calculator</a> estimates chunk count from token volume, chunk size, and overlap percentage.',
    steps: [
      '<strong>Total tokens</strong> — corpus or document token count.',
      '<strong>Chunk size</strong> — tokens per chunk (e.g. 512 or 1024).',
      '<strong>Overlap</strong> — shared tokens between adjacent chunks.',
    ],
    sections: [
      { h2: 'Why overlap matters', body: '<p>Overlap preserves context across chunk boundaries — a sentence split mid-thought still appears whole in at least one chunk. More overlap means more chunks and higher embedding cost.</p>' },
      { h2: 'Token budgeting', body: '<p>Estimate embedding cost with the <a href="/embedding-cost-calculator">Embedding Cost Calculator</a> or count tokens with the <a href="/ai-token-calculator">AI Token Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'ai-model-comparison',
    title: 'How to compare LLM API costs across providers',
    seoTitle: 'AI model cost comparison — OpenAI vs Claude vs Gemini | maratool',
    description: 'Compare LLM API costs across OpenAI, Claude, and Gemini for the same token counts. Free browser calculator.',
    lead: 'Enter input and output tokens — see side-by-side pricing for GPT, Claude, and Gemini models.',
    og: 'developer.svg',
    embedTitle: 'Try it — token counts and model selection',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Choosing an LLM means balancing quality and unit economics. The <a href="/ai-model-comparison">AI Model Cost Comparison</a> shows per-request and monthly cost estimates for the same workload across major providers.',
    steps: [
      '<strong>Input tokens</strong> — prompt size per request.',
      '<strong>Output tokens</strong> — expected completion length.',
      '<strong>Compare models</strong> — OpenAI, Anthropic, and Google side by side.',
    ],
    sections: [
      { h2: 'Apples to apples', body: '<p>Same token counts applied to each model\'s published per-million rates. Actual bills vary with caching, batching, and tier discounts.</p>' },
      { h2: 'Single-model detail', body: '<p>For one provider deep-dive, use the <a href="/ai-cost-calculator">AI Cost Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'llm-json-extractor',
    title: 'How to extract JSON from LLM output',
    seoTitle: 'Extract JSON from LLM output — parse model responses | maratool',
    description: 'Extract JSON from LLM responses. Parse fenced code blocks and inline objects from pasted model output. Free browser tool.',
    lead: 'Paste raw LLM output — get parsed JSON from code fences or inline objects.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste LLM response text',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Models wrap JSON in markdown fences, add preamble text, or truncate mid-object. The <a href="/llm-json-extractor">LLM JSON Extractor</a> finds and parses JSON from messy chat completions.',
    steps: [
      '<strong>Paste output</strong> — full model response including markdown.',
      '<strong>Auto-detect</strong> — fenced blocks and inline objects found.',
      '<strong>Copy JSON</strong> — validated, formatted result.',
    ],
    sections: [
      { h2: 'Common patterns', body: '<p>Handles <code>```json</code> fences, bare objects, and arrays embedded in explanatory text. Multiple JSON blocks may appear — the tool picks the best match.</p>' },
      { h2: 'Validate after extract', body: '<p>Run extracted JSON through the <a href="/json-formatter">JSON Formatter</a> or <a href="/json-schema-validator">JSON Schema Validator</a> before production use.</p>' },
    ],
  },
  {
    slug: 'hash-identifier',
    title: 'How to identify hash types from a digest',
    seoTitle: 'Hash identifier — detect MD5, SHA-256, bcrypt | maratool',
    description: 'Identify hash types from pasted digests. Detect MD5, SHA-256, bcrypt, and more. Paste only, runs in browser.',
    lead: 'Paste a hash digest — see likely algorithm, length, and format hints.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste a hash digest',
    embedHeight: 400,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'A leaked digest without context could be MD5, SHA-256, or bcrypt. The <a href="/hash-identifier">Hash Identifier</a> analyzes length, charset, and prefix patterns to suggest the most likely algorithm.',
    steps: [
      '<strong>Paste digest</strong> — hex, Base64, or bcrypt string.',
      '<strong>Pattern match</strong> — length and format analyzed.',
      '<strong>Likely type</strong> — ranked candidates with confidence hints.',
    ],
    sections: [
      { h2: 'Heuristic only', body: '<p>Identification is based on format rules, not cracking. Two algorithms can produce the same length — treat results as educated guesses.</p>' },
      { h2: 'Generate hashes', body: '<p>To create digests for comparison, use the <a href="/hash-generator">Hash Generator</a>.</p>' },
    ],
  },
  {
    slug: 'iban-validator',
    title: 'How to validate IBAN numbers online',
    seoTitle: 'IBAN validator — check digit verification | maratool',
    description: 'Validate IBAN numbers with mod-97 check digits. Paste an IBAN to verify format and checksum. Free browser tool.',
    lead: 'Paste an IBAN — verify country code, length, and mod-97 check digit.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste IBAN number',
    embedHeight: 360,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Payment forms reject invalid IBANs before they reach the bank. The <a href="/iban-validator">IBAN Validator</a> checks country-specific length rules and the mod-97 checksum — paste only, no server lookup.',
    steps: [
      '<strong>Paste IBAN</strong> — with or without spaces.',
      '<strong>Format check</strong> — country code and length validated.',
      '<strong>Checksum</strong> — mod-97 check digit verified.',
    ],
    sections: [
      { h2: 'Mod-97 algorithm', body: '<p>IBAN check digits use ISO 7064 mod 97-10. Rearranging country and check digits, converting letters to numbers, and dividing by 97 must leave remainder 1.</p>' },
      { h2: 'Related validators', body: '<p>For card numbers, use the <a href="/luhn-checker">Luhn Checker</a>.</p>' },
    ],
  },
  {
    slug: 'luhn-checker',
    title: 'How to validate credit card numbers with Luhn',
    seoTitle: 'Luhn checker — credit card validation | maratool',
    description: 'Validate numbers with the Luhn algorithm. Check credit card and identifier check digits. Paste only, in browser.',
    lead: 'Paste a card or ID number — verify the Luhn check digit instantly.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste number to validate',
    embedHeight: 360,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'The Luhn algorithm catches single-digit typos in card numbers and many identifier formats. The <a href="/luhn-checker">Luhn Checker</a> runs mod-10 validation on pasted input — no card data sent anywhere.',
    steps: [
      '<strong>Paste number</strong> — digits only or with spaces/dashes.',
      '<strong>Luhn check</strong> — mod-10 checksum validated.',
      '<strong>Result</strong> — valid or invalid with explanation.',
    ],
    sections: [
      { h2: 'Not authorization', body: '<p>Luhn validation confirms format integrity only. It does not verify the card exists, has funds, or belongs to the payer.</p>' },
      { h2: 'IBAN validation', body: '<p>International bank accounts use mod-97 — see the <a href="/iban-validator">IBAN Validator</a>.</p>' },
    ],
  },
  {
    slug: 'jwt-security-checker',
    title: 'How to audit JWT tokens for security issues',
    seoTitle: 'JWT security checker — audit token vulnerabilities | maratool',
    description: 'Audit pasted JWT tokens for security issues. Flag alg none, expiry, and missing claims. Runs in your browser.',
    lead: 'Paste a JWT — see security warnings for alg, expiry, and weak configurations.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste JWT token',
    embedHeight: 520,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'JWT misconfigurations cause real breaches — alg:none attacks, expired tokens accepted, missing audience checks. The <a href="/jwt-security-checker">JWT Security Checker</a> decodes pasted tokens and flags common vulnerabilities.',
    steps: [
      '<strong>Paste JWT</strong> — access or ID token from your app.',
      '<strong>Decode</strong> — header and payload shown as JSON.',
      '<strong>Security audit</strong> — warnings for alg, exp, and claim issues.',
    ],
    sections: [
      { h2: 'What it checks', body: '<p>Flags <code>alg: none</code>, missing <code>exp</code>, expired tokens, weak algorithms, and suspicious claim combinations. Does not verify signatures — use your auth server for that.</p>' },
      { h2: 'Decode only', body: '<p>For payload inspection without security audit, use the <a href="/jwt-decoder">JWT Decoder</a>.</p>' },
    ],
  },
  {
    slug: 'html-minifier',
    title: 'How to minify HTML online',
    seoTitle: 'HTML minifier — compress HTML online | maratool',
    description: 'Minify HTML by removing comments and extra whitespace. Paste HTML and copy compressed output. Runs in browser.',
    lead: 'Paste HTML markup — get minified output with comments and whitespace removed.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste HTML to minify',
    embedHeight: 480,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'Minified HTML ships faster and uses less bandwidth. The <a href="/html-minifier">HTML Minifier</a> strips comments and collapses whitespace while preserving tag structure — all in your browser.',
    steps: [
      '<strong>Paste HTML</strong> — full page or fragment.',
      '<strong>Minified output</strong> — updates as you type.',
      '<strong>Copy</strong> — compressed markup ready to deploy.',
    ],
    sections: [
      { h2: 'What gets removed', body: '<p>HTML comments, inter-tag whitespace, and line breaks collapse. Content inside <code>pre</code> and <code>textarea</code> may need manual review.</p>' },
      { h2: 'Beautify instead', body: '<p>For readable markup, use the <a href="/html-beautifier">HTML Beautifier</a>.</p>' },
    ],
  },
  {
    slug: 'html-beautifier',
    title: 'How to beautify and format HTML online',
    seoTitle: 'HTML beautifier — format HTML online | maratool',
    description: 'Beautify and indent pasted HTML for readability. Format messy markup instantly. Free, runs in your browser.',
    lead: 'Paste minified or messy HTML — get indented, readable markup.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste HTML to format',
    embedHeight: 480,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'HTML from view-source or email templates arrives as one unreadable line. The <a href="/html-beautifier">HTML Beautifier</a> adds indentation and line breaks so you can debug structure quickly.',
    steps: [
      '<strong>Paste HTML</strong> — minified page or template fragment.',
      '<strong>Formatted output</strong> — nested tags indented.',
      '<strong>Copy</strong> — readable markup for review or docs.',
    ],
    sections: [
      { h2: 'Indentation rules', body: '<p>Block elements get new lines and nested indentation. Inline elements stay compact where possible.</p>' },
      { h2: 'Minify for production', body: '<p>After editing, compress with the <a href="/html-minifier">HTML Minifier</a> before deployment.</p>' },
    ],
  },
  {
    slug: 'css-minifier',
    title: 'How to minify CSS online',
    seoTitle: 'CSS minifier — compress CSS online | maratool',
    description: 'Minify CSS stylesheets online. Remove comments and whitespace from pasted CSS. Free browser minifier.',
    lead: 'Paste CSS — get a minified stylesheet with comments and whitespace stripped.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste CSS to minify',
    embedHeight: 480,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'Every byte in CSS blocks first paint. The <a href="/css-minifier">CSS Minifier</a> removes comments, collapses whitespace, and trims rules — paste only, no build step required.',
    steps: [
      '<strong>Paste CSS</strong> — stylesheet or inline style block.',
      '<strong>Minified output</strong> — updates in real time.',
      '<strong>Copy</strong> — production-ready compressed CSS.',
    ],
    sections: [
      { h2: 'Safe minification', body: '<p>Comments and unnecessary whitespace are removed. String values and <code>url()</code> contents are preserved.</p>' },
      { h2: 'HTML and CSS together', body: '<p>Minify page markup with the <a href="/html-minifier">HTML Minifier</a> for a full static asset pass.</p>' },
    ],
  },
  {
    slug: 'url-parser',
    title: 'How to parse and decode URL components',
    seoTitle: 'URL parser — decode URL components online | maratool',
    description: 'Parse URLs into protocol, host, path, query, and hash components. Paste any URL for instant breakdown.',
    lead: 'Paste a URL — see protocol, host, path, query params, and hash decoded.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste any URL',
    embedHeight: 440,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Debugging OAuth redirects and webhook callbacks means dissecting URLs by hand. The <a href="/url-parser">URL Parser</a> breaks any URL into protocol, hostname, path, query string, and fragment — with decoded values.',
    steps: [
      '<strong>Paste URL</strong> — full URL including query and hash.',
      '<strong>Components</strong> — each part shown separately.',
      '<strong>Query params</strong> — key-value pairs decoded from the query string.',
    ],
    sections: [
      { h2: 'Encoding', body: '<p>Percent-encoded characters in path and query are decoded for readability. Invalid URLs show a clear error instead of silent failure.</p>' },
      { h2: 'Build URLs', body: '<p>To construct query strings, see <a href="/query-string-builder">Query String Builder</a> or encode with <a href="/url-encoder">URL Encoder</a>.</p>' },
    ],
  },
  {
    slug: 'gpa-calculator',
    title: 'How to calculate GPA on a 4.0 scale',
    seoTitle: 'GPA calculator — 4.0 scale weighted GPA | maratool',
    description: 'Calculate GPA from letter grades and credit hours on a 4.0 scale. Add courses and see weighted GPA instantly.',
    lead: 'Add courses with letter grades and credit hours — see your weighted GPA on a 4.0 scale.',
    og: 'marketing.svg',
    embedTitle: 'Try it — add courses, grades, and credits',
    embedHeight: 480,
    hub: '/education',
    hubLabel: 'education calculators',
    intro: 'Semester GPA is a credit-weighted average, not a simple mean of letter grades. The <a href="/gpa-calculator">GPA Calculator</a> converts A–F grades to grade points and weights by credit hours.',
    steps: [
      '<strong>Add courses</strong> — name, letter grade, and credit hours.',
      '<strong>Grade points</strong> — A=4.0, B=3.0, etc. on standard scale.',
      '<strong>Weighted GPA</strong> — total grade points ÷ total credits.',
    ],
    sections: [
      { h2: '4.0 scale', body: '<p>Uses the standard US 4.0 scale. Schools with plus/minus grading or 5.0 AP weighting may differ — confirm your institution\'s policy.</p>' },
      { h2: 'Course grades', body: '<p>For a single class weighted average, use the <a href="/grade-calculator">Grade Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'grade-calculator',
    title: 'How to calculate weighted course grades',
    seoTitle: 'Grade calculator — weighted assignment average | maratool',
    description: 'Calculate weighted course grade from assignment scores and weights. See your overall percentage instantly.',
    lead: 'Enter assignment scores and weights — see your overall course percentage.',
    og: 'marketing.svg',
    embedTitle: 'Try it — scores and weights per assignment',
    embedHeight: 460,
    hub: '/education',
    hubLabel: 'education calculators',
    intro: 'A 90% on a 10% homework and 80% on a 40% midterm do not average to 85%. The <a href="/grade-calculator">Grade Calculator</a> multiplies each score by its weight and sums for the true course grade.',
    steps: [
      '<strong>Add assignments</strong> — name, score, and weight percent.',
      '<strong>Weights</strong> — should total 100% (tool warns if not).',
      '<strong>Course grade</strong> — weighted percentage displayed.',
    ],
    sections: [
      { h2: 'Weighted vs simple average', body: '<p>Weighted average = Σ(score × weight) ÷ Σ(weight). A low-weight assignment barely moves the needle; finals dominate.</p>' },
      { h2: 'Final exam planning', body: '<p>Figure out what you need on the final with the <a href="/final-grade-calculator">Final Grade Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'final-grade-calculator',
    title: 'How to calculate the final exam score you need',
    seoTitle: 'Final grade calculator — score needed on final | maratool',
    description: 'Calculate the final exam score you need to reach your target course grade. Enter current grade and final weight.',
    lead: 'Current grade + final exam weight + target grade → score needed on the final.',
    og: 'marketing.svg',
    embedTitle: 'Try it — current grade, final weight, target',
    embedHeight: 400,
    hub: '/education',
    hubLabel: 'education calculators',
    intro: '"What do I need on the final?" is the most searched question during finals week. The <a href="/final-grade-calculator">Final Grade Calculator</a> solves for the required final exam score given your current standing and the final\'s weight.',
    steps: [
      '<strong>Current grade</strong> — your grade before the final (%).',
      '<strong>Final weight</strong> — what percent of the course the final counts.',
      '<strong>Target grade</strong> — the overall grade you want.',
    ],
    sections: [
      { h2: 'The formula', body: '<p>Required final = (target − current × (1 − finalWeight)) ÷ finalWeight. If the result exceeds 100%, the target is not achievable this term.</p>' },
      { h2: 'Track assignments', body: '<p>Calculate your current standing with the <a href="/grade-calculator">Grade Calculator</a> first.</p>' },
    ],
  },
  {
    slug: 'reading-level-calculator',
    title: 'How to calculate Flesch-Kincaid reading level',
    seoTitle: 'Reading level calculator — Flesch-Kincaid grade level | maratool',
    description: 'Estimate reading grade level with Flesch-Kincaid. Paste text to see grade level, reading ease, and word count.',
    lead: 'Paste text — get Flesch-Kincaid grade level, reading ease score, and word stats.',
    og: 'marketing.svg',
    embedTitle: 'Try it — paste text for reading level',
    embedHeight: 440,
    hub: '/education',
    hubLabel: 'education calculators',
    intro: 'Content aimed at eighth graders should not read like a graduate thesis. The <a href="/reading-level-calculator">Reading Level Calculator</a> applies Flesch-Kincaid formulas to estimate US grade level and reading ease.',
    steps: [
      '<strong>Paste text</strong> — article, essay, or marketing copy.',
      '<strong>Grade level</strong> — estimated US school grade to comprehend.',
      '<strong>Reading ease</strong> — 0–100 score (higher = easier).',
    ],
    sections: [
      { h2: 'Flesch-Kincaid formulas', body: '<p>Grade level depends on average sentence length and syllables per word. Short sentences and common words score lower (easier).</p>' },
      { h2: 'Related metrics', body: '<p>For reading time estimates, use the <a href="/reading-time">Reading Time Calculator</a>.</p>' },
    ],
  },
]

function esc(s) {
  return s.replace(/'/g, "\\'")
}

/** Escape {{ }} so Astro does not treat them as expressions in HTML/attributes */
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
      <p class="blog-footer-note">The <a href="/${post.slug}">${post.title.split(' — ')[0]}</a> is free, runs locally, and never sends your data to a server. More <a href="${post.hub}">${post.hubLabel}</a> at <a href="/">maratool.com</a>.</p>
    </BlogPostShell>
  </Layout>
</Base>
`
}

for (const post of posts) {
  const file = path.join(OUT, `${post.slug}.astro`)
  fs.writeFileSync(file, render(post))
  console.log('Wrote', file)
}

console.log('Done:', posts.length, 'Wave 3 blog posts')
