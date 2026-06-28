#!/usr/bin/env node
/**
 * Generate Wave 2 tool launch blog posts with BlogToolEmbed.
 * Run: node scripts/generate-wave2-blog-posts.mjs
 */
import fs from 'fs'
import path from 'path'

const OUT = path.join(import.meta.dirname, '..', 'src', 'pages', 'blog')
const DATE = 'June 28, 2026'
const DATE_ISO = '2026-06-28'

const posts = [
  {
    slug: 'fire-calculator',
    title: 'How to calculate years to financial independence (FIRE)',
    seoTitle: 'FIRE calculator — years to financial independence | maratool',
    description: 'Calculate years to FIRE using savings, expenses, and the 4% rule. Free financial independence calculator in your browser.',
    lead: 'Enter savings, annual expenses, income, and savings rate — see years until you can retire on the 4% rule.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter savings, expenses, and savings rate',
    embedHeight: 480,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Financial Independence, Retire Early (FIRE) boils down to one question: when can your portfolio cover annual spending? The <a href="/fire-calculator">FIRE Calculator</a> projects years to reach your target using savings rate and the 4% withdrawal rule.',
    steps: [
      '<strong>Current savings</strong> — invested assets today.',
      '<strong>Annual expenses</strong> — what you need per year in retirement.',
      '<strong>Income & savings rate</strong> — how much you add each year.',
    ],
    sections: [
      { h2: 'The 4% rule', body: '<p>A common FIRE target is 25× annual expenses (4% safe withdrawal rate). Once savings reach that number, many planners treat the portfolio as self-sustaining — though your risk tolerance may differ.</p>' },
      { h2: 'Inflation and returns', body: '<p>This calculator uses a single expected return assumption. For purchasing power over decades, pair it with the <a href="/inflation-calculator">Inflation Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'inflation-calculator',
    title: 'How to calculate inflation-adjusted purchasing power',
    seoTitle: 'Inflation calculator — purchasing power over time | maratool',
    description: 'See how inflation erodes dollar value between years using CPI data. Free purchasing power calculator in your browser.',
    lead: 'Enter an amount and year range — see equivalent value today or in a past year.',
    og: 'marketing.svg',
    embedTitle: 'Try it — amount, start year, end year',
    embedHeight: 380,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'A dollar in 1990 bought more than a dollar today. The <a href="/inflation-calculator">Inflation Calculator</a> adjusts amounts using historical US CPI so you can compare real purchasing power across years.',
    steps: [
      '<strong>Amount</strong> — dollar value to adjust.',
      '<strong>From year</strong> — original year of the amount.',
      '<strong>To year</strong> — target year for comparison.',
    ],
    sections: [
      { h2: 'CPI methodology', body: '<p>Adjustments use Consumer Price Index ratios between years. This is an approximation — your personal basket (housing, healthcare) may differ from national averages.</p>' },
      { h2: 'Long-term planning', body: '<p>Use this alongside the <a href="/compound-interest-calculator">Compound Interest Calculator</a> when projecting retirement savings in real (inflation-adjusted) terms.</p>' },
    ],
  },
  {
    slug: 'stock-average-calculator',
    title: 'How to calculate average stock purchase price',
    seoTitle: 'Stock average price calculator — cost basis | maratool',
    description: 'Calculate weighted average share price across multiple stock purchases. Free cost basis calculator in your browser.',
    lead: 'Add each buy lot — shares and price — to get your weighted average cost per share.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter shares and price per lot',
    embedHeight: 420,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'After several buys at different prices, your true cost basis is a weighted average — not the last trade price. The <a href="/stock-average-calculator">Stock Average Price Calculator</a> totals shares and computes average cost instantly.',
    steps: [
      '<strong>Add lots</strong> — shares purchased and price per share for each trade.',
      '<strong>Review average</strong> — weighted average cost and total shares.',
      '<strong>Compare to market</strong> — use average cost for gain/loss decisions.',
    ],
    sections: [
      { h2: 'Weighted average', body: '<p>Average cost = total amount paid ÷ total shares. A larger lot at a higher price pulls the average up more than a small lot.</p>' },
      { h2: 'DCA modeling', body: '<p>For recurring investments over time, try the <a href="/dca-calculator">Dollar Cost Averaging Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'dca-calculator',
    title: 'How to model dollar-cost averaging returns',
    seoTitle: 'DCA calculator — dollar cost averaging | maratool',
    description: 'Model recurring investments with dollar-cost averaging. See average cost per share and total invested. Free browser calculator.',
    lead: 'Set contribution amount, frequency, and price path — see average cost and shares accumulated.',
    og: 'marketing.svg',
    embedTitle: 'Try it — recurring contribution and price assumptions',
    embedHeight: 440,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Dollar-cost averaging spreads purchases over time instead of timing the market. The <a href="/dca-calculator">DCA Calculator</a> shows how recurring buys affect average share cost and total invested.',
    steps: [
      '<strong>Contribution</strong> — amount invested each period.',
      '<strong>Frequency</strong> — weekly, monthly, or custom intervals.',
      '<strong>Price series</strong> — enter or simulate share prices per period.',
    ],
    sections: [
      { h2: 'Why DCA matters', body: '<p>Buying fixed dollar amounts buys more shares when prices are low and fewer when high — smoothing entry over volatility.</p>' },
      { h2: 'Cost basis', body: '<p>For lump-sum lots, use the <a href="/stock-average-calculator">Stock Average Price Calculator</a> instead.</p>' },
    ],
  },
  {
    slug: 'commission-calculator',
    title: 'How to calculate sales commission',
    seoTitle: 'Commission calculator — sales commission | maratool',
    description: 'Calculate sales commission from deal value and rate. Supports flat and tiered commission structures. Free in your browser.',
    lead: 'Enter deal value and commission rate — see payout for flat or tiered structures.',
    og: 'marketing.svg',
    embedTitle: 'Try it — deal value and commission rate',
    embedHeight: 400,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Sales reps need a clear commission number before closing. The <a href="/commission-calculator">Commission Calculator</a> handles flat percentage and simple tiered rates on deal value.',
    steps: [
      '<strong>Deal value</strong> — total sale or contract amount.',
      '<strong>Commission rate</strong> — percentage or tier thresholds.',
      '<strong>Review payout</strong> — commission earned on this deal.',
    ],
    sections: [
      { h2: 'Flat vs tiered', body: '<p>Flat rate applies one percentage to the full deal. Tiered rates apply different percentages to portions of revenue above each threshold.</p>' },
      { h2: 'Related tools', body: '<p>For freelance pricing, see the <a href="/contractor-rate-calculator">Contractor Rate Calculator</a> and <a href="/pricing-calculator">Pricing Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'contractor-rate-calculator',
    title: 'How to set your freelance hourly rate',
    seoTitle: 'Contractor rate calculator — hourly to salary | maratool',
    description: 'Convert desired annual salary to an hourly contractor rate. Factor billable hours, expenses, and tax buffer. Free browser tool.',
    lead: 'Target annual income → hourly rate that accounts for non-billable time and overhead.',
    og: 'marketing.svg',
    embedTitle: 'Try it — desired salary, billable hours, expenses',
    embedHeight: 420,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Employees get paid for 2,080 hours; contractors bill far fewer. The <a href="/contractor-rate-calculator">Contractor Rate Calculator</a> backs into an hourly rate from your salary goal, billable percentage, and expense buffer.',
    steps: [
      '<strong>Target annual income</strong> — take-home or gross goal.',
      '<strong>Billable hours</strong> — realistic client-facing hours per year.',
      '<strong>Overhead</strong> — taxes, insurance, software, unpaid admin time.',
    ],
    sections: [
      { h2: 'Billable vs total hours', body: '<p>Most freelancers bill 60–80% of working hours. The rest is sales, invoicing, and learning — you still need to earn during those hours indirectly.</p>' },
      { h2: 'Product pricing', body: '<p>For physical goods, use the <a href="/pricing-calculator">Pricing Calculator</a> for markup and margin.</p>' },
    ],
  },
  {
    slug: 'pricing-calculator',
    title: 'How to calculate selling price from cost and markup',
    seoTitle: 'Pricing calculator — markup and margin | maratool',
    description: 'Calculate selling price from unit cost and markup or margin percentage. See profit per unit instantly. Free browser calculator.',
    lead: 'Enter cost and markup (or margin) — get selling price and profit per unit.',
    og: 'marketing.svg',
    embedTitle: 'Try it — cost, markup or margin',
    embedHeight: 380,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Markup and margin are not the same number. The <a href="/pricing-calculator">Pricing Calculator</a> converts between them and shows the price you need to hit your profit target.',
    steps: [
      '<strong>Unit cost</strong> — what you pay to produce or acquire the item.',
      '<strong>Markup or margin</strong> — choose mode and enter percentage.',
      '<strong>Selling price</strong> — read price and profit per unit.',
    ],
    sections: [
      { h2: 'Markup vs margin', body: '<p>50% markup on $10 cost = $15 price (33% margin). Margin is profit ÷ price; markup is profit ÷ cost.</p>' },
      { h2: 'Business margins', body: '<p>For overall business profitability, see the <a href="/profit-margin-calculator">Profit Margin Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'invoice-due-date-calculator',
    title: 'How to calculate invoice due dates from payment terms',
    seoTitle: 'Invoice due date calculator — Net 30, Net 60 | maratool',
    description: 'Calculate invoice due dates from issue date and payment terms. Net 30, Net 60, or custom days. Free browser tool.',
    lead: 'Pick issue date and terms — get the exact due date for Net 30, Net 60, or custom.',
    og: 'marketing.svg',
    embedTitle: 'Try it — issue date and payment terms',
    embedHeight: 360,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: '"Net 30" means payment is due 30 days after the invoice date — but weekends matter when you chase AR. The <a href="/invoice-due-date-calculator">Invoice Due Date Calculator</a> adds payment terms to any issue date.',
    steps: [
      '<strong>Invoice date</strong> — when the invoice was issued.',
      '<strong>Payment terms</strong> — Net 30, Net 60, or custom day count.',
      '<strong>Due date</strong> — exact calendar date payment is due.',
    ],
    sections: [
      { h2: 'Net terms explained', body: '<p>Net 30 = invoice date + 30 calendar days. Some contracts use business days only — confirm your contract language.</p>' },
      { h2: 'Cash flow', body: '<p>Pair with the <a href="/break-even-calculator">Break-Even Calculator</a> when modeling how payment delays affect runway.</p>' },
    ],
  },
  {
    slug: 'csv-cleaner',
    title: 'How to clean CSV files online',
    seoTitle: 'CSV cleaner — trim and fix CSV files | maratool',
    description: 'Clean CSV files in your browser. Trim whitespace, remove empty rows, fix line endings. No upload to a server.',
    lead: 'Paste messy CSV — get trimmed rows, no empty lines, consistent line endings.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste CSV to clean',
    embedHeight: 480,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Exported CSV from Excel, Shopify, or legacy systems often has trailing spaces and blank rows. The <a href="/csv-cleaner">CSV Cleaner</a> normalizes whitespace and drops empty lines — entirely in your browser.',
    steps: [
      '<strong>Paste CSV</strong> — raw file content into the input.',
      '<strong>Auto-clean</strong> — whitespace trimmed, empty rows removed.',
      '<strong>Copy output</strong> — use cleaned CSV in your pipeline.',
    ],
    sections: [
      { h2: 'Privacy', body: '<p>Data never leaves your device. For structured conversion, see <a href="/csv-to-json">CSV to JSON</a>.</p>' },
      { h2: 'Duplicates', body: '<p>After cleaning, dedupe with <a href="/csv-remove-duplicates">Remove Duplicate Rows from CSV</a>.</p>' },
    ],
  },
  {
    slug: 'csv-remove-duplicates',
    title: 'How to remove duplicate rows from a CSV file',
    seoTitle: 'Remove duplicate rows from CSV — dedupe online | maratool',
    description: 'Remove duplicate rows from CSV files. Dedupe by entire row or a key column. Free, browser-based, no upload.',
    lead: 'Paste CSV and dedupe by full row or a single column — keep first or last occurrence.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste CSV and choose dedupe column',
    embedHeight: 500,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Mailing lists and product feeds accumulate duplicate rows after merges. The <a href="/csv-remove-duplicates">CSV Dedupe Tool</a> removes duplicates by entire row or a specific column key.',
    steps: [
      '<strong>Paste CSV</strong> — include header row if present.',
      '<strong>Dedupe mode</strong> — entire row or one column as key.',
      '<strong>Copy result</strong> — unique rows only.',
    ],
    sections: [
      { h2: 'Key column dedupe', body: '<p>Deduping by email or SKU keeps the first row for each unique key — useful for CRM imports.</p>' },
      { h2: 'Clean first', body: '<p>Run through the <a href="/csv-cleaner">CSV Cleaner</a> first so whitespace does not create false unique keys.</p>' },
    ],
  },
  {
    slug: 'csv-split',
    title: 'How to split a large CSV file into smaller files',
    seoTitle: 'Split CSV file online — divide by row count | maratool',
    description: 'Split a CSV file into multiple chunks by row count. Browser-based CSV splitter for large datasets.',
    lead: 'Paste a large CSV, set rows per chunk — download-ready parts with headers preserved.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste CSV and set chunk size',
    embedHeight: 520,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Email attachments and import tools cap file size. The <a href="/csv-split">CSV Splitter</a> divides a file into equal row chunks while repeating the header row in each part.',
    steps: [
      '<strong>Paste CSV</strong> — full file with header.',
      '<strong>Rows per chunk</strong> — e.g. 1000 rows per file.',
      '<strong>Copy chunks</strong> — each output includes the header.',
    ],
    sections: [
      { h2: 'Header handling', body: '<p>The first row is treated as the header and prepended to every chunk so imports work without manual editing.</p>' },
      { h2: 'Merge back', body: '<p>Combine parts with <a href="/csv-merge">Merge CSV Files</a> when needed.</p>' },
    ],
  },
  {
    slug: 'csv-merge',
    title: 'How to merge multiple CSV files into one',
    seoTitle: 'Merge CSV files online — combine CSV | maratool',
    description: 'Merge multiple CSV files into one. Headers combined automatically. Paste content — runs in your browser.',
    lead: 'Paste two or more CSV blocks — get one combined file with aligned columns.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste multiple CSV sections',
    embedHeight: 520,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Monthly exports from the same system should stack into one dataset. The <a href="/csv-merge">CSV Merger</a> concatenates multiple CSV inputs and aligns headers.',
    steps: [
      '<strong>Paste CSV files</strong> — separate blocks or sequential pastes.',
      '<strong>Review merge</strong> — combined rows with unified header.',
      '<strong>Copy output</strong> — single file ready for analysis.',
    ],
    sections: [
      { h2: 'Column alignment', body: '<p>Files with matching column order merge cleanly. Mismatched columns may need manual review.</p>' },
      { h2: 'Dedupe after merge', body: '<p>Use <a href="/csv-remove-duplicates">CSV Dedupe</a> if merged files contain overlapping rows.</p>' },
    ],
  },
  {
    slug: 'curl-to-fetch',
    title: 'How to convert cURL to JavaScript fetch',
    seoTitle: 'Convert cURL to fetch — JavaScript | maratool',
    description: 'Convert cURL commands to JavaScript fetch() code. Paste curl from DevTools and copy ready-to-run fetch syntax.',
    lead: 'Paste a cURL command — get copy-ready JavaScript fetch() with method, headers, and body.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste cURL from Chrome DevTools',
    embedHeight: 440,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Chrome copies requests as cURL; your frontend needs fetch(). The <a href="/curl-to-fetch">cURL to Fetch Converter</a> parses method, URL, headers, and body into modern JavaScript.',
    steps: [
      '<strong>Copy as cURL</strong> — from Network tab in DevTools.',
      '<strong>Paste</strong> — into the converter input.',
      '<strong>Copy fetch code</strong> — drop into your app or script.',
    ],
    sections: [
      { h2: 'What gets converted', body: '<p>-X method, -H headers, and -d body are mapped to fetch options. Complex curl flags may need manual tweaks.</p>' },
      { h2: 'Python', body: '<p>For Python requests, use <a href="/curl-to-python">Convert cURL to Python</a>.</p>' },
    ],
  },
  {
    slug: 'curl-to-python',
    title: 'How to convert cURL to Python requests',
    seoTitle: 'Convert cURL to Python requests | maratool',
    description: 'Convert cURL commands to Python requests code. Paste curl and copy ready-to-run Python. Free browser tool.',
    lead: 'Paste cURL — get Python requests code with method, headers, and data.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste cURL command',
    embedHeight: 440,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'API docs show curl examples; your script uses requests. The <a href="/curl-to-python">cURL to Python Converter</a> translates headers, method, and body into idiomatic Python.',
    steps: [
      '<strong>Paste cURL</strong> — from docs or DevTools.',
      '<strong>Review Python</strong> — requests.get/post with headers and data.',
      '<strong>Copy</strong> — into your notebook or service.',
    ],
    sections: [
      { h2: 'requests library', body: '<p>Output assumes the popular <code>requests</code> package. Install with <code>pip install requests</code>.</p>' },
      { h2: 'JavaScript', body: '<p>See <a href="/curl-to-fetch">cURL to Fetch</a> for browser or Node fetch syntax.</p>' },
    ],
  },
  {
    slug: 'postman-collection-generator',
    title: 'How to generate a Postman collection from an API request',
    seoTitle: 'Postman collection generator — v2.1 JSON | maratool',
    description: 'Generate Postman Collection v2.1 JSON from URL, method, headers, and body. Import directly into Postman.',
    lead: 'Fill in request details — get import-ready Postman Collection JSON.',
    og: 'developer.svg',
    embedTitle: 'Try it — URL, method, headers, body',
    embedHeight: 520,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Hand-writing Postman collection JSON is tedious. The <a href="/postman-collection-generator">Postman Collection Generator</a> builds v2.1 format from a single request definition.',
    steps: [
      '<strong>Request URL & method</strong> — endpoint details.',
      '<strong>Headers & body</strong> — optional raw body for POST/PUT.',
      '<strong>Copy JSON</strong> — import into Postman via File → Import.',
    ],
    sections: [
      { h2: 'Collection format', body: '<p>Output follows Postman Collection v2.1 schema so it imports without conversion.</p>' },
      { h2: 'From curl', body: '<p>Start from DevTools curl using <a href="/curl-generator">cURL Generator</a> or convert with <a href="/curl-to-fetch">cURL to Fetch</a>.</p>' },
    ],
  },
  {
    slug: 'json-schema-validator',
    title: 'How to validate JSON against a JSON Schema',
    seoTitle: 'JSON Schema validator online | maratool',
    description: 'Validate JSON data against a JSON Schema. Paste instance and schema to see errors instantly. Runs in your browser.',
    lead: 'Paste JSON instance and schema — see validation errors with paths.',
    og: 'developer.svg',
    embedTitle: 'Try it — JSON instance and schema',
    embedHeight: 520,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'API contracts live in JSON Schema; payloads drift. The <a href="/json-schema-validator">JSON Schema Validator</a> checks instance data against your schema and lists every mismatch.',
    steps: [
      '<strong>JSON instance</strong> — the data to validate.',
      '<strong>JSON Schema</strong> — draft-compatible schema document.',
      '<strong>Review errors</strong> — path and message per failure.',
    ],
    sections: [
      { h2: 'When to validate', body: '<p>Validate webhook payloads, config files, and API responses before they hit production pipelines.</p>' },
      { h2: 'Format first', body: '<p>Clean up JSON with the <a href="/json-formatter">JSON Formatter</a> if parsing fails.</p>' },
    ],
  },
  {
    slug: 'age-calculator',
    title: 'How to calculate exact age from a birth date',
    seoTitle: 'Age calculator — years, months, days | maratool',
    description: 'Calculate exact age in years, months, and days from a birth date. Free age calculator — runs in your browser.',
    lead: 'Enter birth date and optional target date — get exact age broken down.',
    og: 'developer.svg',
    embedTitle: 'Try it — birth date and target date',
    embedHeight: 360,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Forms ask for age in years; eligibility rules care about months and days. The <a href="/age-calculator">Age Calculator</a> computes precise age between any two dates.',
    steps: [
      '<strong>Birth date</strong> — date of birth.',
      '<strong>Target date</strong> — defaults to today; change for historical checks.',
      '<strong>Read age</strong> — years, months, and days.',
    ],
    sections: [
      { h2: 'Calendar math', body: '<p>Age accounts for varying month lengths and leap years — not just year subtraction.</p>' },
      { h2: 'ISO dates', body: '<p>For ISO 8601 parsing, use the <a href="/iso8601-formatter">ISO 8601 Date Formatter</a>.</p>' },
    ],
  },
  {
    slug: 'iso8601-formatter',
    title: 'How to parse and format ISO 8601 dates',
    seoTitle: 'ISO 8601 date formatter — parse and convert | maratool',
    description: 'Parse and format ISO 8601 dates. Convert between ISO strings, local datetime, and Unix timestamps. Free browser tool.',
    lead: 'Paste an ISO 8601 string — see local time, Unix timestamp, and normalized ISO output.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste or generate ISO 8601',
    embedHeight: 380,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Logs and APIs use ISO 8601; humans read local time. The <a href="/iso8601-formatter">ISO 8601 Formatter</a> parses Zulu and offset strings and shows equivalent Unix and local values.',
    steps: [
      '<strong>Input</strong> — ISO 8601 string or click Now.',
      '<strong>ISO output</strong> — normalized canonical form.',
      '<strong>Conversions</strong> — local datetime and Unix seconds.',
    ],
    sections: [
      { h2: 'Timezone offsets', body: '<p>Strings with <code>Z</code> or <code>+05:30</code> offsets parse correctly. Local display uses your browser timezone.</p>' },
      { h2: 'Unix timestamps', body: '<p>See also the <a href="/unix-timestamp">Unix Timestamp Converter</a> for epoch ↔ date workflows.</p>' },
    ],
  },
  {
    slug: 'week-number-calculator',
    title: 'How to find the ISO week number for any date',
    seoTitle: 'ISO week number calculator | maratool',
    description: 'Find the ISO week number for any date. See week start, week end, and year-week label. Free browser calculator.',
    lead: 'Pick a date — get ISO week number, week boundaries, and YYYY-Www label.',
    og: 'developer.svg',
    embedTitle: 'Try it — select any date',
    embedHeight: 360,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Sprint planning and payroll often use ISO week numbers, not calendar months. The <a href="/week-number-calculator">ISO Week Number Calculator</a> returns week 1–53 with start and end dates.',
    steps: [
      '<strong>Select date</strong> — any calendar day.',
      '<strong>Week number</strong> — ISO 8601 week of year.',
      '<strong>Week range</strong> — Monday-start week boundaries.',
    ],
    sections: [
      { h2: 'ISO vs US weeks', body: '<p>ISO weeks start on Monday. Week 1 is the week with the year\'s first Thursday. US "week of year" conventions may differ.</p>' },
      { h2: 'Date tools', body: '<p>Pair with <a href="/age-calculator">Age Calculator</a> or <a href="/timezone-converter">Timezone Converter</a> for scheduling.</p>' },
    ],
  },
  {
    slug: 'shopify-discount-calculator',
    title: 'How to calculate stacked Shopify discount prices',
    seoTitle: 'Shopify discount calculator — stacked discounts | maratool',
    description: 'Calculate final price after stacked Shopify discounts. Enter original price and multiple discount percentages.',
    lead: 'Original price + stacked discount percentages → final sale price and total savings.',
    og: 'marketing.svg',
    embedTitle: 'Try it — original price and discount stack',
    embedHeight: 400,
    hub: '/e-commerce',
    hubLabel: 'e-commerce calculators',
    intro: 'Shopify stacks percentage discounts sequentially — 20% then 10% is not 30% off. The <a href="/shopify-discount-calculator">Shopify Discount Calculator</a> applies each discount in order to show the true final price.',
    steps: [
      '<strong>Original price</strong> — pre-discount retail.',
      '<strong>Discount stack</strong> — enter each percentage in apply order.',
      '<strong>Final price</strong> — customer pays and total percent saved.',
    ],
    sections: [
      { h2: 'Sequential stacking', body: '<p>Each discount applies to the current price, not the original. Order matters when mixing codes and automatic discounts.</p>' },
      { h2: 'Fees', body: '<p>After pricing, estimate net with <a href="/amazon-fee-calculator">Amazon Fee Calculator</a> or <a href="/etsy-fee-calculator">Etsy Fee Calculator</a> for marketplace listings.</p>' },
    ],
  },
  {
    slug: 'gtin-validator',
    title: 'How to validate GTIN, EAN-13, and UPC barcodes',
    seoTitle: 'GTIN validator — EAN-13 and UPC check digit | maratool',
    description: 'Validate GTIN, EAN-13, and UPC barcodes. Verify check digits and format. Free, runs in your browser.',
    lead: 'Enter a barcode number — verify check digit and GTIN format instantly.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter GTIN or barcode',
    embedHeight: 360,
    hub: '/e-commerce',
    hubLabel: 'e-commerce calculators',
    intro: 'Marketplaces reject listings with invalid barcodes. The <a href="/gtin-validator">GTIN Validator</a> checks EAN-13, UPC-A, and GTIN-14 check digits before you submit a product feed.',
    steps: [
      '<strong>Enter barcode</strong> — digits only or with spaces.',
      '<strong>Validation</strong> — check digit and length verified.',
      '<strong>Format</strong> — identified as UPC, EAN, or GTIN-14.',
    ],
    sections: [
      { h2: 'Check digit algorithm', body: '<p>GTIN uses modulo-10 check digits. A single typo fails validation — catch it before Amazon or Google Merchant Center does.</p>' },
      { h2: 'Pricing', body: '<p>Model sale prices with the <a href="/shopify-discount-calculator">Shopify Discount Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'prompt-variable-tester',
    title: 'How to test LLM prompt templates with variables',
    seoTitle: 'Prompt variable tester — template preview | maratool',
    description: 'Test prompt templates with {{variables}}. Enter placeholders and preview the filled prompt instantly. Free browser tool.',
    lead: 'Write a template with {{placeholders}} — fill variables and preview the final prompt.',
    og: 'developer.svg',
    embedTitle: 'Try it — template and variable values',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Prompt engineering uses templates with slots for user data. The <a href="/prompt-variable-tester">Prompt Variable Tester</a> detects {{variables}}, lets you fill them, and shows the rendered prompt before you call an API.',
    steps: [
      '<strong>Template</strong> — prompt with <code>{{variable}}</code> placeholders.',
      '<strong>Variables</strong> — auto-detected fields to fill.',
      '<strong>Preview</strong> — final prompt ready to copy.',
    ],
    sections: [
      { h2: 'Mustache-style syntax', body: '<p>Placeholders use double curly braces: <code>{{name}}</code>, <code>{{context}}</code>. Missing variables stay visible so you catch gaps.</p>' },
      { h2: 'Token budgeting', body: '<p>Estimate cost with the <a href="/ai-token-calculator">AI Token Calculator</a> or <a href="/embedding-cost-calculator">Embedding Cost Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'embedding-cost-calculator',
    title: 'How to estimate AI embedding API costs',
    seoTitle: 'Embedding cost calculator — OpenAI, Cohere, Voyage | maratool',
    description: 'Estimate embedding API costs for OpenAI, Cohere, and Voyage. Enter token count and see per-request pricing.',
    lead: 'Pick provider, model, and token count — see estimated cost per request and at scale.',
    og: 'developer.svg',
    embedTitle: 'Try it — provider, tokens, batch size',
    embedHeight: 440,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Vector search pipelines embed millions of tokens. The <a href="/embedding-cost-calculator">Embedding Cost Calculator</a> compares OpenAI, Cohere, and Voyage pricing for your token volume.',
    steps: [
      '<strong>Provider & model</strong> — select embedding model.',
      '<strong>Token count</strong> — tokens per document or batch.',
      '<strong>Volume</strong> — multiply for total corpus cost estimate.',
    ],
    sections: [
      { h2: 'Pricing changes', body: '<p>Provider rates update frequently. Use this for ballpark budgeting; confirm current pricing on vendor sites before procurement.</p>' },
      { h2: 'Chat vs embeddings', body: '<p>For chat completion costs, use the <a href="/ai-cost-calculator">AI Cost Calculator</a>.</p>' },
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

console.log('Done:', posts.length, 'Wave 2 blog posts')
