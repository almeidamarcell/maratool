#!/usr/bin/env node
/**
 * Wave 4 — generate pages, UI, blogs, and tools.ts entries for browser-only gap tools.
 * Run: node scripts/generate-wave4.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename

const ROOT = path.join(import.meta.dirname, '..')
const PAGES = path.join(ROOT, 'src', 'pages')
const BLOG = path.join(ROOT, 'src', 'pages', 'blog')
const TOOLS_JS = path.join(ROOT, 'src', 'tools')
const TOOLS_TS = path.join(ROOT, 'src', 'data', 'tools.ts')
const BLOG_INDEX = path.join(BLOG, 'index.astro')

const CALC_STYLES = `
<style is:global>
  .calc-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
  .calc-field { margin-bottom: 0.75rem; }
  .calc-select { max-width: 100%; }
  .diff-add { background: #e6ffed; }
  .diff-remove { background: #ffeef0; }
  @media (max-width: 600px) { .calc-row { grid-template-columns: 1fr; } }
</style>`

const WAVE4 = [
  // Business
  { slug: 'invoice-number-generator', name: 'Generate Invoice Numbers Online', emoji: '🧾', category: 'Business', subcategory: 'Invoicing', core: 'wave4-business-ext-core', fn: 'generateInvoiceNumber', ui: 'invoice-number', hub: 'business', hubLabel: 'Business', related: ['invoice-due-date-calculator', 'purchase-order-generator', 'profit-margin-calculator'] },
  { slug: 'purchase-order-generator', name: 'Generate Purchase Order Online', emoji: '📋', category: 'Business', subcategory: 'Invoicing', core: 'wave4-business-ext-core', fn: 'generatePurchaseOrder', ui: 'purchase-order', hub: 'business', hubLabel: 'Business', related: ['invoice-number-generator', 'pricing-calculator', 'profit-margin-calculator'] },
  { slug: 'business-name-generator', name: 'Generate Business Name Ideas', emoji: '💡', category: 'Business', subcategory: 'Generate', core: 'wave4-business-ext-core', fn: 'generateBusinessNames', ui: 'business-names', hub: 'business', hubLabel: 'Business', related: ['pricing-calculator', 'profit-margin-calculator', 'break-even-calculator'] },
  { slug: 'currency-margin-calculator', name: 'Currency Margin Calculator', emoji: '💱', category: 'Business', subcategory: 'Calculator', core: 'wave4-business-ext-core', fn: 'currencyMargin', ui: 'currency-margin', hub: 'business', hubLabel: 'Business', related: ['profit-margin-calculator', 'pricing-calculator', 'vat-calculator'] },
  // Finance
  { slug: 'dcf-calculator', name: 'DCF Calculator — Discounted Cash Flow NPV', emoji: '📊', category: 'Finance', subcategory: 'Investment', core: 'wave4-finance-ext-core', fn: 'dcf', ui: 'dcf', hub: 'finance', hubLabel: 'Finance', related: ['roi-calculator', 'cagr-calculator', 'compound-interest-calculator'] },
  { slug: 'position-size-calculator', name: 'Position Size Calculator — Risk per Trade', emoji: '📈', category: 'Finance', subcategory: 'Investment', core: 'wave4-finance-ext-core', fn: 'positionSize', ui: 'position-size', hub: 'finance', hubLabel: 'Finance', related: ['stock-average-calculator', 'dca-calculator', 'roi-calculator'] },
  { slug: 'crypto-profit-calculator', name: 'Crypto Profit Calculator', emoji: '₿', category: 'Finance', subcategory: 'Investment', core: 'wave4-finance-ext-core', fn: 'cryptoProfit', ui: 'crypto-profit', hub: 'finance', hubLabel: 'Finance', related: ['roi-calculator', 'dca-calculator', 'stock-average-calculator'] },
  // AI
  { slug: 'vision-token-estimator', name: 'Vision Image Token Estimator', emoji: '👁️', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'estimateVisionTokens', ui: 'vision-tokens', hub: 'developer', hubLabel: 'Developer', related: ['ai-token-calculator', 'context-window-calculator', 'ai-cost-calculator'] },
  { slug: 'json-schema-generator', name: 'JSON Schema Generator from JSON', emoji: '📐', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'generateJsonSchemaFromJson', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['json-schema-validator', 'json-formatter', 'llm-json-extractor'] },
  { slug: 'markdown-cleanup', name: 'Clean Up Markdown Text Online', emoji: '🧹', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'cleanupMarkdown', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['markdown-converter', 'markdown-editor', 'reading-time'] },
  { slug: 'prompt-diff', name: 'Compare Two Prompts — Prompt Diff', emoji: '🔀', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'promptDiff', ui: 'prompt-diff', hub: 'developer', hubLabel: 'Developer', related: ['diff-checker', 'prompt-variable-tester', 'ai-token-calculator'] },
  { slug: 'prompt-version-compare', name: 'Compare Prompt Versions', emoji: '📝', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'promptVersionCompare', ui: 'prompt-version', hub: 'developer', hubLabel: 'Developer', related: ['prompt-diff', 'prompt-variable-tester', 'ai-model-comparison'] },
  { slug: 'ai-output-formatter', name: 'Format AI Output — JSON & Markdown', emoji: '✨', category: 'Developer', subcategory: 'AI', core: 'wave4-ai-ext-core', fn: 'formatAiOutput', ui: 'ai-output', hub: 'developer', hubLabel: 'Developer', related: ['llm-json-extractor', 'json-formatter', 'markdown-cleanup'], customBody: 'ai-output' },
  // SQL
  { slug: 'sql-query-builder', name: 'SQL Query Builder — SELECT Generator', emoji: '🏗️', category: 'Developer', subcategory: 'SQL', core: 'wave4-sql-ext-core', fn: 'buildSelectQuery', ui: 'sql-query', hub: 'developer', hubLabel: 'Developer', related: ['sql-formatter', 'sql-create-table-generator', 'csv-to-sql'] },
  { slug: 'csv-to-sql', name: 'Convert CSV to SQL INSERT Statements', emoji: '📥', category: 'Developer', subcategory: 'SQL', core: 'wave4-sql-ext-core', fn: 'csvToSql', ui: 'csv-to-sql', hub: 'developer', hubLabel: 'Developer', related: ['sql-insert-generator', 'csv-to-json', 'sql-to-csv'] },
  { slug: 'sql-to-csv', name: 'Convert SQL INSERT to CSV', emoji: '📤', category: 'Developer', subcategory: 'SQL', core: 'wave4-sql-ext-core', fn: 'sqlToCsv', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['csv-to-sql', 'csv-to-json', 'sql-insert-generator'] },
  { slug: 'er-diagram-generator', name: 'ER Diagram Generator from Schema', emoji: '🗺️', category: 'Developer', subcategory: 'SQL', core: 'wave4-sql-ext-core', fn: 'erDiagramFromTables', ui: 'er-diagram', hub: 'developer', hubLabel: 'Developer', related: ['sql-create-table-generator', 'sql-formatter', 'mongo-to-sql'] },
  { slug: 'mongo-to-sql', name: 'Convert MongoDB JSON to SQL', emoji: '🍃', category: 'Developer', subcategory: 'SQL', core: 'wave4-sql-ext-core', fn: 'mongoToSql', ui: 'mongo-sql', hub: 'developer', hubLabel: 'Developer', related: ['csv-to-sql', 'sql-insert-generator', 'json-formatter'] },
  // API
  { slug: 'http-request-builder', name: 'HTTP Request Builder — Raw & cURL', emoji: '🌐', category: 'Developer', subcategory: 'API', core: 'wave4-api-ext-core', fn: 'buildHttpRequest', ui: 'http-request', hub: 'developer', hubLabel: 'Developer', related: ['curl-generator', 'curl-to-fetch', 'postman-collection-generator'] },
  { slug: 'api-mock-response-generator', name: 'API Mock JSON Response Generator', emoji: '🎭', category: 'Developer', subcategory: 'API', core: 'wave4-api-ext-core', fn: 'generateMockResponse', ui: 'mock-response', hub: 'developer', hubLabel: 'Developer', related: ['json-schema-validator', 'json-schema-generator', 'postman-collection-generator'] },
  { slug: 'webhook-payload-inspector', name: 'Webhook Payload Inspector', emoji: '🔔', category: 'Developer', subcategory: 'API', core: 'wave4-api-ext-core', fn: 'inspectWebhookPayload', ui: 'webhook-inspector', hub: 'developer', hubLabel: 'Developer', related: ['json-formatter', 'jwt-decoder', 'json-schema-validator'] },
  // Security
  { slug: 'hash-compare', name: 'Compare Two Hashes Online', emoji: '🔗', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'compareHashes', ui: 'hash-compare', hub: 'developer', hubLabel: 'Developer', related: ['hash-generator', 'hash-identifier', 'hmac-generator'] },
  { slug: 'checksum-calculator', name: 'Checksum Calculator — SHA-256 & More', emoji: '🔢', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'checksumText', ui: 'checksum', hub: 'developer', hubLabel: 'Developer', related: ['hash-generator', 'hmac-generator', 'hash-compare'] },
  { slug: 'ssl-certificate-decoder', name: 'SSL Certificate Decoder — Paste PEM', emoji: '🔐', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'decodeCertificatePem', ui: 'cert-decode', hub: 'developer', hubLabel: 'Developer', related: ['pem-decoder', 'certificate-expiration-checker', 'jwt-decoder'] },
  { slug: 'csr-generator', name: 'CSR Generator — RSA Key Pair', emoji: '📜', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'generateRsaKeyPairPem', ui: 'csr-generator', hub: 'developer', hubLabel: 'Developer', related: ['pem-decoder', 'ssl-certificate-decoder', 'api-key-generator'] },
  { slug: 'pem-decoder', name: 'PEM Decoder — Parse PEM Blocks', emoji: '📄', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'decodePem', ui: 'pem-decode', hub: 'developer', hubLabel: 'Developer', related: ['ssl-certificate-decoder', 'csr-generator', 'certificate-expiration-checker'] },
  { slug: 'certificate-expiration-checker', name: 'Certificate Expiration Checker', emoji: '⏳', category: 'Developer', subcategory: 'Security', core: 'wave4-security-ext-core', fn: 'decodeCertificatePem', ui: 'cert-expiry', hub: 'developer', hubLabel: 'Developer', related: ['ssl-certificate-decoder', 'pem-decoder', 'unix-timestamp'] },
  // Date
  { slug: 'business-days-calculator', name: 'Business Days Calculator', emoji: '📅', category: 'Converter', subcategory: 'Date', core: 'wave4-date-ext-core', fn: 'businessDaysBetween', ui: 'business-days', hub: 'converter', hubLabel: 'Converter', related: ['invoice-due-date-calculator', 'age-calculator', 'week-number-calculator'] },
  { slug: 'working-hours-calculator', name: 'Working Hours Calculator', emoji: '⏰', category: 'Converter', subcategory: 'Date', core: 'wave4-date-ext-core', fn: 'workingHours', ui: 'working-hours', hub: 'converter', hubLabel: 'Converter', related: ['salary-converter', 'contractor-rate-calculator', 'business-days-calculator'] },
  { slug: 'countdown-generator', name: 'Countdown to Date Calculator', emoji: '⏱️', category: 'Converter', subcategory: 'Date', core: 'wave4-date-ext-core', fn: 'countdownTo', ui: 'countdown', hub: 'converter', hubLabel: 'Converter', related: ['age-calculator', 'unix-timestamp', 'iso8601-formatter'] },
  // CSV
  { slug: 'excel-to-csv', name: 'Excel to CSV Converter Online', emoji: '📊', category: 'Converter', subcategory: 'CSV', core: 'wave4-csv-ext-core', fn: 'excelHtmlToCsv', ui: 'excel-to-csv', hub: 'converter', hubLabel: 'Converter', related: ['csv-cleaner', 'csv-to-json', 'csv-to-excel'] },
  { slug: 'csv-to-excel', name: 'CSV to Excel Converter Online', emoji: '📗', category: 'Converter', subcategory: 'CSV', core: 'wave4-csv-ext-core', fn: 'csvToExcelHtml', ui: 'csv-to-excel', hub: 'converter', hubLabel: 'Converter', related: ['excel-to-csv', 'csv-cleaner', 'csv-merge'] },
  { slug: 'csv-delimiter-converter', name: 'CSV Delimiter Converter', emoji: '🔀', category: 'Converter', subcategory: 'CSV', core: 'wave4-csv-ext-core', fn: 'convertDelimiter', ui: 'delimiter', hub: 'converter', hubLabel: 'Converter', related: ['csv-cleaner', 'csv-to-json', 'csv-merge'] },
  { slug: 'csv-column-mapper', name: 'CSV Column Mapper & Renamer', emoji: '🗂️', category: 'Converter', subcategory: 'CSV', core: 'wave4-csv-ext-core', fn: 'mapCsvColumns', ui: 'column-mapper', hub: 'converter', hubLabel: 'Converter', related: ['csv-cleaner', 'csv-remove-duplicates', 'csv-transpose'] },
  { slug: 'csv-transpose', name: 'Transpose CSV Online', emoji: '↕️', category: 'Converter', subcategory: 'CSV', core: 'wave4-csv-ext-core', fn: 'transposeCsv', ui: 'textarea-io', hub: 'converter', hubLabel: 'Converter', related: ['csv-cleaner', 'csv-merge', 'csv-split'] },
  // Web/HTML
  { slug: 'html-preview', name: 'HTML Preview Online', emoji: '👁️', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'sanitizeHtmlPreview', ui: 'html-preview', hub: 'developer', hubLabel: 'Developer', related: ['html-beautifier', 'html-minifier', 'markdown-converter'] },
  { slug: 'css-beautifier', name: 'CSS Beautifier Online', emoji: '🎨', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'beautifyCss', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['css-minifier', 'html-beautifier', 'tailwind-cheatsheet'] },
  { slug: 'js-minifier', name: 'JavaScript Minifier Online', emoji: '⚡', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'minifyJs', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['html-minifier', 'css-minifier', 'json-formatter'] },
  { slug: 'html-validator', name: 'HTML Structure Validator', emoji: '✅', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'validateHtmlStructure', ui: 'html-validator', hub: 'developer', hubLabel: 'Developer', related: ['html-beautifier', 'html-minifier', 'schema-validator'] },
  { slug: 'css-grid-generator', name: 'CSS Grid Generator', emoji: '▦', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'generateCssGrid', ui: 'css-grid', hub: 'developer', hubLabel: 'Developer', related: ['flexbox-generator', 'css-minifier', 'px-to-rem'] },
  { slug: 'flexbox-generator', name: 'Flexbox CSS Generator', emoji: '📦', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'generateFlexbox', ui: 'flexbox', hub: 'developer', hubLabel: 'Developer', related: ['css-grid-generator', 'css-minifier', 'line-height-calculator'] },
  { slug: 'svg-editor', name: 'SVG Viewer & Editor Online', emoji: '🖼️', category: 'Developer', subcategory: 'Web', core: 'wave4-html-ext-core', fn: 'normalizeSvg', ui: 'svg-editor', hub: 'developer', hubLabel: 'Developer', related: ['svg-optimizer', 'favicon-generator', 'html-preview'] },
  // E-commerce
  { slug: 'shipping-calculator', name: 'Shipping Cost Calculator', emoji: '🚚', category: 'E-commerce', subcategory: 'Pricing', core: 'wave4-ecommerce-ext-core', fn: 'shippingCost', ui: 'shipping', hub: 'e-commerce', hubLabel: 'E-commerce', related: ['amazon-fee-calculator', 'etsy-fee-calculator', 'shopify-discount-calculator'] },
  { slug: 'sku-generator', name: 'SKU Generator Online', emoji: '🏷️', category: 'E-commerce', subcategory: 'Pricing', core: 'wave4-ecommerce-ext-core', fn: 'generateSku', ui: 'sku', hub: 'developer', hubLabel: 'E-commerce', related: ['barcode-generator', 'gtin-validator', 'amazon-fee-calculator'] },
  // Social
  { slug: 'youtube-timestamp-generator', name: 'YouTube Timestamp Link Generator', emoji: '▶️', category: 'Image', subcategory: 'Social', core: 'wave4-social-ext-core', fn: 'secondsToYoutubeLink', ui: 'youtube-timestamp', hub: 'image', hubLabel: 'Image', related: ['social-media-cropper', 'video-to-gif', 'trim-video'] },
  // Data
  { slug: 'csv-diff', name: 'CSV Diff — Compare Two CSV Files', emoji: '🔍', category: 'Developer', subcategory: 'Data', core: 'wave4-csv-ext-core', fn: 'diffCsv', ui: 'csv-diff', hub: 'developer', hubLabel: 'Developer', related: ['diff-checker', 'csv-cleaner', 'json-diff'] },
  { slug: 'xml-validator', name: 'XML Validator Online', emoji: '✅', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'validateXml', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['xml-to-json', 'xml-formatter', 'sitemap-validator'] },
  { slug: 'yaml-validator', name: 'YAML Validator Online', emoji: '✅', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'validateYaml', ui: 'yaml-validator', hub: 'developer', hubLabel: 'Developer', related: ['yaml-to-json', 'json-formatter', 'toml-converter'], customBody: 'textarea-io' },
  { slug: 'toml-converter', name: 'TOML to JSON Converter', emoji: '🔄', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'tomlToJson', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['yaml-to-json', 'json-formatter', 'xml-to-json'] },
  { slug: 'xml-formatter', name: 'XML Formatter Online', emoji: '📝', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'formatXml', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['xml-validator', 'xml-to-json', 'html-beautifier'] },
  { slug: 'json-flatten', name: 'JSON Flatten — Nested to Dot Notation', emoji: '📎', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'flattenJsonString', ui: 'textarea-io', hub: 'developer', hubLabel: 'Developer', related: ['json-formatter', 'json-path-tester', 'json-diff'] },
  { slug: 'json-path-tester', name: 'JSON Path Tester Online', emoji: '🧭', category: 'Developer', subcategory: 'Data', core: 'wave4-data-ext-core', fn: 'testJsonPath', ui: 'json-path', hub: 'developer', hubLabel: 'Developer', related: ['json-formatter', 'json-flatten', 'json-diff'], customBody: 'json-path' },
  // Education
  { slug: 'citation-generator', name: 'Citation Generator — APA & MLA', emoji: '📚', category: 'Education', subcategory: 'Reference', core: 'wave4-education-ext-core', fn: 'formatBibliographyCitation', ui: 'citation', hub: 'education', hubLabel: 'Education', related: ['apa-mla-converter', 'reading-level-calculator', 'grade-calculator'] },
  { slug: 'flashcard-formatter', name: 'Flashcard Formatter — Q&A to Markdown', emoji: '🃏', category: 'Education', subcategory: 'Reference', core: 'wave4-education-ext-core', fn: 'formatFlashcards', ui: 'textarea-io', hub: 'education', hubLabel: 'Education', related: ['markdown-table-generator', 'markdown-editor', 'reading-time'] },
  { slug: 'apa-mla-converter', name: 'APA to MLA Citation Converter', emoji: '🔁', category: 'Education', subcategory: 'Reference', core: 'wave4-education-ext-core', fn: 'convertCitationStyle', ui: 'apa-mla', hub: 'education', hubLabel: 'Education', related: ['citation-generator', 'reading-level-calculator', 'grade-calculator'] },
  { slug: 'roman-numeral-converter', name: 'Roman Numeral Converter', emoji: '🏛️', category: 'Education', subcategory: 'Reference', core: 'wave4-education-ext-core', fn: 'toRoman', ui: 'roman', hub: 'education', hubLabel: 'Education', related: ['base-converter', 'percentage-calculator', 'unit-converter'] },
]

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function hubPath(cfg) {
  const cat = cfg.category === 'E-commerce' ? 'e-commerce' : cfg.hub
  const sub = cfg.subcategory.toLowerCase().replace(/ /g, '-')
  if (cfg.category === 'Converter') return { catPath: '/converter', subPath: `/converter/${sub}` }
  if (cfg.category === 'Developer') return { catPath: '/developer', subPath: `/developer/${sub}` }
  if (cfg.category === 'Business') return { catPath: '/business', subPath: `/business/${sub}` }
  if (cfg.category === 'Finance') return { catPath: '/finance', subPath: `/finance/${sub}` }
  if (cfg.category === 'Education') return { catPath: '/education', subPath: `/education/${sub}` }
  if (cfg.category === 'E-commerce') return { catPath: '/e-commerce', subPath: `/e-commerce/${sub}` }
  if (cfg.category === 'Image') return { catPath: '/image', subPath: `/image/${sub}` }
  return { catPath: `/${cfg.hub}`, subPath: `/${cfg.hub}` }
}

function defaultFaq(cfg) {
  return [
    { q: 'Does this tool send data to a server?', a: 'No. Everything runs locally in your browser. Your data never leaves your device.' },
    { q: 'Do I need an account?', a: 'No sign-up, no limits, no paywall.' },
    { q: 'Can I use this offline?', a: 'Yes, after the page loads once, the tool works without a network connection.' },
    { q: 'Is this tool free?', a: 'Yes, completely free with no usage limits.' },
  ]
}

function pageBody(cfg) {
  const id = cfg.slug.replace(/-/g, '').slice(0, 8)
  const bodies = {
    'textarea-io': `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="w4-in">Input</label>
        <textarea id="w4-in" class="tool-textarea" rows="10" placeholder="Paste content here"></textarea>
        <div class="tool-output-header" style="margin-top:1rem;"><span class="tool-output-label">Output</span><button type="button" class="tool-copy-btn" id="w4-copy">Copy</button></div>
        <pre id="w4-out" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
        <p id="w4-err" class="tool-error" hidden></p>
      </div>`,
    'prompt-diff': `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-row"><textarea id="w4-a" class="tool-textarea" rows="8" placeholder="Original prompt"></textarea><textarea id="w4-b" class="tool-textarea" rows="8" placeholder="Modified prompt"></textarea></div>
        <pre id="w4-out" class="tool-output" style="min-height:160px;white-space:pre-wrap;"></pre>
      </div>`,
    'html-preview': `      <div class="tool-container" style="min-height:560px;">
        <label class="tool-label" for="w4-in">HTML</label>
        <textarea id="w4-in" class="tool-textarea" rows="8" placeholder="<h1>Hello</h1>"></textarea>
        <label class="tool-label" for="w4-preview" style="margin-top:1rem;">Preview</label>
        <iframe id="w4-preview" title="HTML preview" style="width:100%;min-height:240px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;"></iframe>
      </div>`,
    'svg-editor': `      <div class="tool-container" style="min-height:560px;">
        <textarea id="w4-in" class="tool-textarea" rows="8" placeholder="<svg ...></svg>"></textarea>
        <iframe id="w4-preview" title="SVG preview" style="width:100%;min-height:240px;border:1px solid var(--border);border-radius:var(--radius);background:#fff;margin-top:1rem;"></iframe>
        <p id="w4-err" class="tool-error" hidden></p>
      </div>`,
    'csv-diff': `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-row"><div><label class="tool-label" for="w4-a">CSV A</label><textarea id="w4-a" class="tool-textarea" rows="8"></textarea></div><div><label class="tool-label" for="w4-b">CSV B</label><textarea id="w4-b" class="tool-textarea" rows="8"></textarea></div></div>
        <pre id="w4-out" class="tool-output" style="min-height:160px;white-space:pre-wrap;"></pre>
      </div>`,
    'excel-to-csv': `      <div class="tool-container" style="min-height:420px;">
        <label class="tool-label" for="w4-file">Upload .xlsx or paste HTML table / CSV</label>
        <input type="file" id="w4-file" class="tool-input" accept=".xlsx,.xls,.csv,.html" />
        <textarea id="w4-in" class="tool-textarea" rows="6" placeholder="Or paste spreadsheet HTML / CSV" style="margin-top:1rem;"></textarea>
        <div class="tool-output-header" style="margin-top:1rem;"><span class="tool-output-label">CSV output</span><button type="button" class="tool-copy-btn" id="w4-copy">Copy</button></div>
        <pre id="w4-out" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
    'csv-to-excel': `      <div class="tool-container" style="min-height:420px;">
        <label class="tool-label" for="w4-in">CSV input</label>
        <textarea id="w4-in" class="tool-textarea" rows="8" placeholder="name,score&#10;Ada,95"></textarea>
        <button type="button" class="tool-btn" id="w4-dl" style="margin-top:1rem;">Download Excel-compatible HTML</button>
      </div>`,
    'ai-output': `      <div class="tool-container" style="min-height:480px;">
        <div id="w4-root"></div>
        <label class="tool-label" for="w4-in">AI output</label>
        <textarea id="w4-in" class="tool-textarea" rows="8" placeholder="Paste raw LLM output"></textarea>
        <pre id="w4-out" class="tool-output" style="min-height:120px;white-space:pre-wrap;margin-top:1rem;"></pre>
      </div>`,
    'json-path': `      <div class="tool-container" style="min-height:480px;">
        <div id="w4-root"></div>
        <label class="tool-label" for="w4-in">JSON input</label>
        <textarea id="w4-in" class="tool-textarea" rows="8" placeholder='{"name":"Ada"}'></textarea>
        <pre id="w4-out" class="tool-output" style="min-height:120px;white-space:pre-wrap;margin-top:1rem;"></pre>
      </div>`,
  }
  return bodies[cfg.ui] || bodies[cfg.customBody] || `      <div class="tool-container" style="min-height:360px;" data-w4-ui="${cfg.ui}">
        <div id="w4-root"></div>
        <pre id="w4-out" class="tool-output" style="min-height:120px;white-space:pre-wrap;margin-top:1rem;"></pre>
        <p id="w4-err" class="tool-error" hidden></p>
      </div>`
}

function genPage(cfg) {
  const { catPath, subPath } = hubPath(cfg)
  const faq = defaultFaq(cfg)
  const howTo = ['Enter or paste your input in the fields below.', 'Results update instantly as you type.', 'Use Copy to grab the output.']
  const related = cfg.related.map(s => {
    const t = WAVE4.find(x => x.slug === s)
    return { slug: s, name: t?.name || s }
  })
function appCategory(category) {
  const map = {
    Converter: 'UtilitiesApplication',
    PDF: 'UtilitiesApplication',
    Text: 'UtilitiesApplication',
    Image: 'MultimediaApplication',
    Marketing: 'BusinessApplication',
    Developer: 'DeveloperApplication',
    Mockup: 'DesignApplication',
    Health: 'HealthApplication',
    Finance: 'FinanceApplication',
    Business: 'BusinessApplication',
    'E-commerce': 'BusinessApplication',
    Education: 'EducationApplication',
  }
  return map[category] || 'DeveloperApplication'
}
  const desc = `${cfg.name}. Free, instant, runs in your browser — no upload to server.`
  return `---
import Base from '../layouts/Base.astro'
import Layout from '../components/Layout.astro'
import ToolShell from '../components/ToolShell.astro'

const seo = {
  title: '${esc(cfg.name)} | maratool',
  description: '${esc(desc)}',
  canonical: 'https://maratool.com/${cfg.slug}',
  schema: {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '${esc(cfg.name)}',
    url: 'https://maratool.com/${cfg.slug}',
    applicationCategory: '${appCategory(cfg.category)}',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: '${esc(desc)}',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: '${esc(cfg.category)}', item: 'https://maratool.com${catPath}' },
      { '@type': 'ListItem', position: 3, name: '${esc(cfg.subcategory)}', item: 'https://maratool.com${subPath}' },
      { '@type': 'ListItem', position: 4, name: '${esc(cfg.name)}', item: 'https://maratool.com/${cfg.slug}' },
    ],
  },
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
${faq.map(f => `      { '@type': 'Question', name: '${esc(f.q)}', acceptedAnswer: { '@type': 'Answer', text: '${esc(f.a)}' } }`).join(',\n')}
    ]
  }
}

const howTo = [${howTo.map(s => `'${esc(s)}'`).join(', ')}]
const faq = [${faq.map(f => `{ q: '${esc(f.q)}', a: '${esc(f.a)}' }`).join(', ')}]
const relatedTools = [${related.map(r => `{ slug: '${r.slug}', name: '${esc(r.name)}' }`).join(', ')}]
const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: '${esc(cfg.category)}', href: '${catPath}' },
  { label: '${esc(cfg.subcategory)}', href: '${subPath}' },
  { label: '${esc(cfg.name.split('—')[0].trim())}' },
]
---
<Base {...seo}>
  <Layout>
    <ToolShell slug="${cfg.slug}" name="${esc(cfg.name)}" description="${esc(desc)}" howTo={howTo} faq={faq} relatedTools={relatedTools} breadcrumbs={breadcrumbs}>
${pageBody(cfg)}
    </ToolShell>
  </Layout>
</Base>
${CALC_STYLES}
<script src="../tools/${cfg.slug}.js"></script>
`
}

function genBlog(cfg) {
  const title = cfg.name.split('—')[0].trim()
  const blogTitle = `How to use ${title.toLowerCase()}`
  return `---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import BlogPostShell from '../../components/BlogPostShell.astro'
import BlogToolEmbed from '../../components/BlogToolEmbed.astro'

const slug = '${cfg.slug}'
const seo = {
  title: '${esc(blogTitle)} | maratool',
  description: '${esc(cfg.name)}. Free browser-based tool — no sign-up, runs locally.',
  canonical: \`https://maratool.com/blog/\${slug}\`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: '${esc(blogTitle)}',
    image: 'https://maratool.com/og-image.png',
    datePublished: '2026-06-28',
    dateModified: '2026-06-28',
    author: { '@type': 'Person', name: 'Marcell Almeida', url: 'https://marcell.com.br' },
    publisher: { '@type': 'Organization', name: 'maratool', url: 'https://maratool.com', logo: { '@type': 'ImageObject', url: 'https://maratool.com/favicon.svg' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': \`https://maratool.com/blog/\${slug}\` },
    url: \`https://maratool.com/blog/\${slug}\`,
    description: '${esc(cfg.name)}. Free browser-based tool.',
  },
  breadcrumbSchema: {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://maratool.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://maratool.com/blog' },
      { '@type': 'ListItem', position: 3, name: '${esc(blogTitle)}', item: \`https://maratool.com/blog/\${slug}\` },
    ],
  },
}
---
<Base {...seo}>
  <Layout>
    <BlogPostShell title="${esc(blogTitle)}" lead="${esc(cfg.name)} — free, instant, and private." date="June 28, 2026" dateIso="2026-06-28">
      <p>The <a href="/${cfg.slug}">${esc(title)}</a> runs entirely in your browser. No account, no server upload.</p>
      <BlogToolEmbed slug="${cfg.slug}" title="Try it live" height={480} />
      <h2>How it works</h2>
      <ol>
        <li>Open the tool and enter your input.</li>
        <li>Results update instantly as you type.</li>
        <li>Copy or download the output — data stays on your device.</li>
      </ol>
      <h2>Privacy</h2>
      <p>All processing is client-side. Your input never leaves your browser.</p>
      <hr class="blog-divider" />
      <p class="blog-footer-note">More <a href="/${cfg.hub === 'e-commerce' ? 'e-commerce' : cfg.hub}">${esc(cfg.hubLabel)} tools</a> at <a href="/">maratool.com</a>.</p>
    </BlogPostShell>
  </Layout>
</Base>
`
}

function genUi(cfg) {
  return `import { initWave4Tool } from './wave4-ui-factory.js'

initWave4Tool('${cfg.slug}', '${cfg.ui}', '${cfg.core}', '${cfg.fn}')
`
}

function toolsTsEntry(cfg) {
  const kw = cfg.slug.replace(/-/g, ' ')
  return `  {
    slug: '${cfg.slug}',
    name: '${esc(cfg.name)}',
    emoji: '${cfg.emoji}',
    description: '${esc(cfg.name)}. Free, instant, runs in your browser.',
    category: '${cfg.category}',
    subcategory: '${cfg.subcategory}',
    keywords: ['${kw}', '${kw} online', '${kw} calculator', '${kw} tool', 'free ${kw}'],
    live: true,
    blogPost: true,
  },`
}

// Patch tools.ts subcategories
function patchToolsTs() {
  let src = fs.readFileSync(TOOLS_TS, 'utf8')
  src = src.replace(
    "Developer: ['Crypto', 'Generate', 'Audit', 'Calculator', 'Reference', 'SQL', 'API', 'Security', 'AI'],",
    "Developer: ['Crypto', 'Generate', 'Audit', 'Calculator', 'Reference', 'SQL', 'API', 'Security', 'AI', 'Web', 'Data'],",
  )
  src = src.replace(
    "Education: ['Calculator'],",
    "Education: ['Calculator', 'Reference'],",
  )
  src = src.replace(
    "Business: ['Calculator', 'Tax', 'Pay', 'Invoicing'],",
    "Business: ['Calculator', 'Tax', 'Pay', 'Invoicing', 'Generate'],",
  )
  const entries = WAVE4.map(toolsTsEntry).join('\n')
  src = src.replace(/\n\]\n\n\/\/ Ordered categories/, `\n${entries}\n]\n\n// Ordered categories`)
  fs.writeFileSync(TOOLS_TS, src)
}

function patchBlogIndex() {
  let src = fs.readFileSync(BLOG_INDEX, 'utf8')
  const posts = WAVE4.map(t => `  {
    slug: '${t.slug}',
    title: 'How to use ${esc(t.name.split('—')[0].trim().toLowerCase())}',
    date: 'June 28, 2026',
    description: '${esc(t.name)}. Free browser-based tool.',
  },`).join('\n')
  src = src.replace('const posts = [', `const posts = [\n${posts}`)
  fs.writeFileSync(BLOG_INDEX, src)
}

if (isMain) {
  for (const cfg of WAVE4) {
    fs.writeFileSync(path.join(PAGES, `${cfg.slug}.astro`), genPage(cfg))
    fs.writeFileSync(path.join(BLOG, `${cfg.slug}.astro`), genBlog(cfg))
    fs.writeFileSync(path.join(TOOLS_JS, `${cfg.slug}.js`), genUi(cfg))
    console.log('generated', cfg.slug)
  }
  console.log(`Wave 4 pages complete: ${WAVE4.length} tools`)
}

export { WAVE4 }
