#!/usr/bin/env node
/**
 * Generate tool launch blog posts with BlogToolEmbed.
 * Run: node scripts/generate-tool-blog-posts.mjs
 *
 * Rule: every new live tool MUST have a matching blog post at
 * src/pages/blog/<slug>.astro using BlogToolEmbed (or a screenshot).
 */
import fs from 'fs'
import path from 'path'

const OUT = path.join(import.meta.dirname, '..', 'src', 'pages', 'blog')
const DATE = 'June 28, 2026'
const DATE_ISO = '2026-06-28'

const posts = [
  {
    slug: 'mortgage-calculator',
    title: 'How to calculate monthly mortgage payments',
    seoTitle: 'Mortgage calculator — monthly payment & amortization | maratool',
    description: 'Calculate monthly mortgage payments, total interest, and amortization schedule. Free home loan calculator that runs in your browser.',
    lead: 'Enter loan amount, rate, and term — see monthly payment, total interest, and a year-one amortization schedule instantly.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter loan amount, rate, and term',
    embedHeight: 520,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Before you sign, you need to know the monthly payment and how much interest you will pay over the life of the loan. The <a href="/mortgage-calculator">Mortgage Calculator</a> uses the standard amortization formula and shows the first 12 months of your schedule — no spreadsheet required.',
    steps: [
      '<strong>Loan amount</strong> — principal borrowed after your down payment.',
      '<strong>Interest rate</strong> — annual percentage rate (APR) from your lender.',
      '<strong>Term</strong> — loan length in years (30, 20, 15 are common).',
    ],
    sections: [
      { h2: 'The payment formula', body: '<p>Monthly payment = P × [r(1+r)<sup>n</sup>] / [(1+r)<sup>n</sup> − 1], where P is principal, r is monthly rate (annual ÷ 12), and n is total months. Early payments are mostly interest; later payments shift toward principal.</p>' },
      { h2: 'What this does not include', body: '<p>Property tax, homeowners insurance, PMI, and HOA fees are not in this calculator. Add those separately for total housing cost.</p><p>Also see the <a href="/loan-calculator">Loan Calculator</a> for personal or auto loans measured in months.</p>' },
    ],
  },
  {
    slug: 'loan-calculator',
    title: 'How to calculate monthly loan payments',
    seoTitle: 'Loan calculator — monthly payment & interest | maratool',
    description: 'Calculate monthly loan payments and total interest for personal, auto, or business loans. Free amortization calculator in your browser.',
    lead: 'Any fixed-rate installment loan — enter principal, APR, and term in months to see payment and total interest.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter amount, rate, and term in months',
    embedHeight: 380,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Personal loans, auto loans, and equipment financing all use the same math: fixed monthly payments over a set term. The <a href="/loan-calculator">Loan Calculator</a> gives you the payment and total interest in one screen.',
    steps: [
      '<strong>Loan amount</strong> — total principal.',
      '<strong>Annual interest rate</strong> — APR from your lender.',
      '<strong>Term in months</strong> — e.g. 36 for 3 years, 60 for 5 years.',
    ],
    sections: [
      { h2: 'Months vs years', body: '<p>This calculator takes term in <em>months</em>, not years. A 5-year loan = 60 months. For mortgages measured in years, use the <a href="/mortgage-calculator">Mortgage Calculator</a>.</p>' },
      { h2: 'Zero-interest loans', body: '<p>If the rate is 0%, payment is simply principal ÷ months. The calculator handles this automatically.</p>' },
    ],
  },
  {
    slug: 'compound-interest-calculator',
    title: 'How to calculate compound interest on savings',
    seoTitle: 'Compound interest calculator — savings growth | maratool',
    description: 'Project savings growth with compound interest and monthly contributions. Free calculator that runs in your browser.',
    lead: 'See how a starting balance plus monthly contributions grows over time with compound interest.',
    og: 'marketing.svg',
    embedTitle: 'Try it — set principal, rate, years, and monthly contribution',
    embedHeight: 400,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Compound interest is interest on interest — the reason starting early matters. The <a href="/compound-interest-calculator">Compound Interest Calculator</a> projects final balance, total contributed, and interest earned with optional monthly deposits.',
    steps: [
      '<strong>Starting amount</strong> — initial principal.',
      '<strong>Annual rate</strong> — expected annual return (use conservative estimates).',
      '<strong>Years</strong> — investment horizon.',
      '<strong>Monthly contribution</strong> — optional recurring deposit.',
    ],
    sections: [
      { h2: 'Compounding frequency', body: '<p>This calculator compounds monthly (12 times per year), which matches most savings accounts and is a reasonable approximation for index funds.</p>' },
      { h2: 'Pair with CAGR', body: '<p>After investing, use the <a href="/cagr-calculator">CAGR Calculator</a> to measure actual annualized return between two balance snapshots.</p>' },
    ],
  },
  {
    slug: 'cagr-calculator',
    title: 'How to calculate CAGR (compound annual growth rate)',
    seoTitle: 'CAGR calculator — compound annual growth rate | maratool',
    description: 'Calculate compound annual growth rate between two values over any period. Free CAGR calculator online.',
    lead: 'Turn a beginning value, ending value, and time period into a smoothed annual growth percentage.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter beginning value, ending value, and years',
    embedHeight: 340,
    hub: '/finance',
    hubLabel: 'finance calculators',
    intro: 'Total return alone does not account for time. CAGR normalizes growth to an annual rate so you can compare a 3-year investment against a 10-year one. The <a href="/cagr-calculator">CAGR Calculator</a> applies the standard formula instantly.',
    steps: [
      '<strong>Beginning value</strong> — starting balance or price.',
      '<strong>Ending value</strong> — current or exit value.',
      '<strong>Years</strong> — holding period (decimals OK for partial years).',
    ],
    sections: [
      { h2: 'The formula', body: '<p>CAGR = (Ending ÷ Beginning)<sup>1/years</sup> − 1, expressed as a percentage. Example: $10,000 → $25,000 over 5 years = ~20.1% CAGR.</p>' },
      { h2: 'CAGR vs total return', body: '<p>Total return shows the full gain. CAGR shows the equivalent steady annual rate that would produce the same result. Use CAGR when comparing investments over different time horizons.</p>' },
    ],
  },
  {
    slug: 'profit-margin-calculator',
    title: 'How to calculate profit margin (gross and net)',
    seoTitle: 'Profit margin calculator — gross & net margin | maratool',
    description: 'Calculate gross profit, net profit, and margin percentage from revenue and costs. Free business calculator.',
    lead: 'Enter revenue, COGS, and expenses — see gross margin and net margin as percentages instantly.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter revenue, COGS, and operating expenses',
    embedHeight: 400,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Margin tells you how much of each dollar of revenue becomes profit. The <a href="/profit-margin-calculator">Profit Margin Calculator</a> separates gross margin (before operating expenses) from net margin (bottom line).',
    steps: [
      '<strong>Revenue</strong> — total sales.',
      '<strong>Cost of goods sold (COGS)</strong> — direct costs to produce what you sold.',
      '<strong>Operating expenses</strong> — rent, salaries, marketing, and other overhead.',
    ],
    sections: [
      { h2: 'Gross vs net margin', body: '<p><strong>Gross margin</strong> = (Revenue − COGS) / Revenue. It measures product-level profitability.<br><strong>Net margin</strong> = (Revenue − COGS − Expenses) / Revenue. It is the bottom-line percentage.</p>' },
      { h2: 'Benchmarks vary by industry', body: '<p>Software companies often target 70%+ gross margin. Retail may run 25–40% gross and 2–5% net. Compare against your sector, not a universal number.</p>' },
    ],
  },
  {
    slug: 'break-even-calculator',
    title: 'How to find your break-even point',
    seoTitle: 'Break-even calculator — units and revenue | maratool',
    description: 'Find break-even point in units and revenue. Enter fixed costs, price, and variable cost per unit.',
    lead: 'Know exactly how many units you need to sell before you stop losing money.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter fixed costs, price, and variable cost',
    embedHeight: 380,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Break-even analysis answers: "How many units at this price cover my fixed costs?" The <a href="/break-even-calculator">Break-even Calculator</a> returns units, revenue at break-even, and contribution margin.',
    steps: [
      '<strong>Fixed costs</strong> — rent, salaries, insurance — costs that do not change with volume.',
      '<strong>Price per unit</strong> — what you charge.',
      '<strong>Variable cost per unit</strong> — materials, shipping, commissions per sale.',
    ],
    sections: [
      { h2: 'The formula', body: '<p>Break-even units = Fixed Costs / (Price − Variable Cost). If variable cost exceeds price, you cannot break even — raise price or cut costs.</p>' },
      { h2: 'Contribution margin', body: '<p>Contribution margin = (Price − Variable Cost) / Price. It shows what percentage of each sale covers fixed costs after direct costs.</p>' },
    ],
  },
  {
    slug: 'vat-calculator',
    title: 'How to add or remove VAT and sales tax',
    seoTitle: 'VAT / sales tax calculator — add or remove tax | maratool',
    description: 'Add or remove VAT and sales tax from any amount. Preset rates for common regions. Free tax calculator.',
    lead: 'Switch between adding tax to a net price or extracting tax from a gross price — any rate.',
    og: 'marketing.svg',
    embedTitle: 'Try it — add or remove tax at any rate',
    embedHeight: 400,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Invoicing across borders means converting between net and gross prices constantly. The <a href="/vat-calculator">VAT / Sales Tax Calculator</a> handles both directions with a custom rate.',
    steps: [
      '<strong>Choose mode</strong> — add tax to a net amount, or remove tax from a gross total.',
      '<strong>Enter the tax rate</strong> — e.g. 20 for UK VAT, 8.25 for some US sales tax.',
      '<strong>Enter the amount</strong> — net or gross depending on mode.',
    ],
    sections: [
      { h2: 'Add vs remove', body: '<p><strong>Add:</strong> Gross = Net × (1 + rate/100). A £100 net price at 20% VAT = £120 gross.<br><strong>Remove:</strong> Net = Gross / (1 + rate/100). A £120 gross at 20% VAT = £100 net.</p>' },
      { h2: 'Not tax advice', body: '<p>Rates change by jurisdiction and product category. Always verify current rates with your tax authority.</p>' },
    ],
  },
  {
    slug: 'salary-converter',
    title: 'How to convert salary between annual, monthly, and hourly',
    seoTitle: 'Salary converter — annual, monthly, hourly | maratool',
    description: 'Convert salary between annual, monthly, bi-weekly, weekly, daily, and hourly rates. Free salary calculator.',
    lead: 'One annual number → every pay period equivalent, adjusted for hours and weeks worked.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter annual salary and work schedule',
    embedHeight: 420,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'Job offers come in different shapes — $120k/year, $58/hour, $5,000/month. The <a href="/salary-converter">Salary Converter</a> normalizes them so you can compare apples to apples.',
    steps: [
      '<strong>Annual salary</strong> — gross yearly pay.',
      '<strong>Hours per week</strong> — default 40 for full-time.',
      '<strong>Weeks per year</strong> — default 52; use 50 if accounting for unpaid vacation.',
    ],
    sections: [
      { h2: 'Hourly from annual', body: '<p>Hourly = Annual / (Hours per Week × Weeks per Year). At 40×52 = 2,080 hours, $75,000/year ≈ $36.06/hour before taxes.</p>' },
      { h2: 'Gross only', body: '<p>This is pre-tax, pre-benefits conversion. Actual take-home depends on deductions, location, and benefits.</p>' },
    ],
  },
  {
    slug: 'roi-calculator',
    title: 'How to calculate return on investment (ROI)',
    seoTitle: 'ROI calculator — return on investment percentage | maratool',
    description: 'Calculate ROI percentage from initial cost and final value. Free investment ROI calculator.',
    lead: 'Two numbers — what you put in and what you got out — plus profit and ROI percentage.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter initial cost and final value',
    embedHeight: 320,
    hub: '/business',
    hubLabel: 'business calculators',
    intro: 'ROI is the simplest measure of whether an investment paid off. The <a href="/roi-calculator">ROI Calculator</a> computes profit and return percentage from initial cost and final value.',
    steps: [
      '<strong>Initial cost</strong> — what you invested or spent.',
      '<strong>Final value</strong> — current or exit value.',
    ],
    sections: [
      { h2: 'The formula', body: '<p>ROI = (Final − Initial) / Initial × 100. Invest $10,000, exit at $15,000 → $5,000 profit, 50% ROI.</p>' },
      { h2: 'ROI vs campaign ROI', body: '<p>This is a general investment ROI tool. For marketing ad spend specifically, use the <a href="/campaign-roi-calculator">Campaign ROI Calculator</a> which also shows ROAS.</p>' },
    ],
  },
  {
    slug: 'amazon-fee-calculator',
    title: 'How to estimate Amazon seller fees and net profit',
    seoTitle: 'Amazon seller fee calculator — FBA & referral fees | maratool',
    description: 'Estimate Amazon referral fees, FBA fees, and net profit per sale. Free calculator for Amazon sellers.',
    lead: 'Enter sale price, category, and fulfillment method — see every fee and your margin.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter price, category, and FBA or FBM',
    embedHeight: 440,
    hub: '/e-commerce',
    hubLabel: 'e-commerce calculators',
    intro: 'Amazon takes a referral fee on every sale, plus FBA fulfillment if you use it. The <a href="/amazon-fee-calculator">Amazon Fee Calculator</a> estimates both so you can price with margin in mind.',
    steps: [
      '<strong>Sale price</strong> — what the customer pays.',
      '<strong>Category</strong> — referral fee varies (electronics 8%, clothing 17%, default 15%).',
      '<strong>Fulfillment</strong> — FBA includes estimated fulfillment fee; FBM excludes it.',
    ],
    sections: [
      { h2: 'Estimates, not exact quotes', body: '<p>FBA fees depend on size tier, weight, and season. This tool uses simplified tiers for quick planning. Check Seller Central for exact fees before listing.</p>' },
      { h2: 'Etsy sellers', body: '<p>Selling on Etsy instead? Use the <a href="/etsy-fee-calculator">Etsy Fee Calculator</a>.</p>' },
    ],
  },
  {
    slug: 'etsy-fee-calculator',
    title: 'How to calculate Etsy seller fees and net profit',
    seoTitle: 'Etsy fee calculator — listing, transaction & payment fees | maratool',
    description: 'Calculate Etsy listing, transaction, and payment processing fees. See net profit per sale.',
    lead: 'Etsy charges listing, transaction, and payment fees on every sale — see the full breakdown.',
    og: 'marketing.svg',
    embedTitle: 'Try it — enter sale price and shipping',
    embedHeight: 440,
    hub: '/e-commerce',
    hubLabel: 'e-commerce calculators',
    intro: 'A $35 Etsy sale does not net $35. Listing fee, 6.5% transaction fee, and payment processing all apply. The <a href="/etsy-fee-calculator">Etsy Fee Calculator</a> shows each line item and net profit.',
    steps: [
      '<strong>Sale price</strong> — item price before shipping.',
      '<strong>Shipping</strong> — amount charged to buyer (transaction fee applies to item + shipping).',
    ],
    sections: [
      { h2: 'Fee breakdown', body: '<p><strong>$0.20</strong> listing fee per listing (renewed every 4 months or on sale).<br><strong>6.5%</strong> transaction fee on item + shipping.<br><strong>~3% + $0.25</strong> payment processing.</p>' },
      { h2: 'Verify current rates', body: '<p>Etsy updates fees periodically. Check Etsy Seller Help for the latest before finalizing prices.</p>' },
    ],
  },
  {
    slug: 'sql-formatter',
    title: 'How to format and beautify SQL online',
    seoTitle: 'SQL formatter — beautify SQL queries online | maratool',
    description: 'Format and beautify SQL queries instantly. Paste messy SQL and get indented output. Free, runs in your browser.',
    lead: 'Paste one-line SQL — get readable, indented output with keywords on their own lines.',
    og: 'developer.svg',
    embedTitle: 'Try it — paste SQL and see formatted output',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'SQL copied from logs, ORMs, or chat is often one long line. The <a href="/sql-formatter">SQL Formatter</a> adds line breaks before major keywords and indents for readability.',
    steps: [
      '<strong>Paste SQL</strong> — SELECT, INSERT, UPDATE, or any DDL.',
      '<strong>Read formatted output</strong> — updates on every keystroke.',
      '<strong>Copy</strong> — one click to clipboard.',
    ],
    sections: [
      { h2: 'What it does not do', body: '<p>This is a formatter, not a validator. It does not check syntax against PostgreSQL, MySQL, or SQL Server dialects. Use it for readability before code review or documentation.</p>' },
      { h2: 'Privacy', body: '<p>Queries stay in your browser. Nothing is sent to a server — safe for production schemas and sensitive table names.</p>' },
    ],
  },
  {
    slug: 'curl-generator',
    title: 'How to generate cURL commands from HTTP requests',
    seoTitle: 'cURL command generator — build HTTP requests | maratool',
    description: 'Build cURL commands from URL, method, headers, and body. Copy-ready curl for any HTTP request.',
    lead: 'Fill in a form — get a copy-ready curl command with headers and body escaped correctly.',
    og: 'developer.svg',
    embedTitle: 'Try it — build a cURL command',
    embedHeight: 520,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'You have the API docs open and need a curl command for a ticket or terminal test. The <a href="/curl-generator">cURL Generator</a> builds the command from URL, method, headers, and body — no manual escaping.',
    steps: [
      '<strong>URL and method</strong> — GET, POST, PUT, PATCH, or DELETE.',
      '<strong>Headers</strong> — one per line, <code>Key: Value</code> format.',
      '<strong>Body</strong> — JSON or raw text for POST/PUT/PATCH.',
    ],
    sections: [
      { h2: 'Generator, not executor', body: '<p>This tool generates the command string only. It does not send the request (browser CORS would block most cross-origin calls anyway). Copy and run in your terminal.</p>' },
      { h2: 'Common use cases', body: '<p>Sharing reproducible API calls in tickets, testing webhooks locally, converting Postman requests to curl for CI scripts.</p>' },
    ],
  },
  {
    slug: 'password-strength-checker',
    title: 'How to check password strength online',
    seoTitle: 'Password strength checker — how strong is my password? | maratool',
    description: 'Check password strength with entropy scoring and crack-time estimates. Runs locally in your browser.',
    lead: 'Type a password — see strength score, estimated crack time, and specific improvement tips.',
    og: 'developer.svg',
    embedTitle: 'Try it — type a password to check strength',
    embedHeight: 320,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Weak passwords are still the #1 breach vector. The <a href="/password-strength-checker">Password Strength Checker</a> scores length, character diversity, and common-password patterns — without sending your password anywhere.',
    steps: [
      '<strong>Type or paste a password</strong> — checking happens locally.',
      '<strong>Read the score</strong> — Very weak through Very strong.',
      '<strong>Follow the tips</strong> — specific suggestions for what to improve.',
    ],
    sections: [
      { h2: 'Your password never leaves your device', body: '<p>Strength analysis runs entirely in JavaScript. No network request, no logging. Safe to test real passwords you are considering.</p>' },
      { h2: 'Use a password manager', body: '<p>For production passwords, use the <a href="/password-generator">Password Generator</a> with <code>crypto.getRandomValues()</code> and store in a password manager.</p>' },
    ],
  },
  {
    slug: 'hmac-generator',
    title: 'How to generate HMAC signatures online',
    seoTitle: 'HMAC generator — SHA-256 & SHA-512 online | maratool',
    description: 'Generate HMAC signatures with SHA-256, SHA-384, or SHA-512. Message and secret key — runs in your browser.',
    lead: 'Enter a message and secret key — get an HMAC hex digest using the Web Crypto API.',
    og: 'developer.svg',
    embedTitle: 'Try it — enter message, secret, and algorithm',
    embedHeight: 400,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Webhooks, API signatures, and JWT alternatives often use HMAC. The <a href="/hmac-generator">HMAC Generator</a> computes SHA-256, SHA-384, or SHA-512 HMAC in your browser.',
    steps: [
      '<strong>Message</strong> — the payload to sign.',
      '<strong>Secret key</strong> — shared secret between sender and verifier.',
      '<strong>Algorithm</strong> — SHA-256 is the default choice for most APIs.',
    ],
    sections: [
      { h2: 'When to use HMAC', body: '<p>HMAC verifies that a message was not tampered with and was sent by someone who knows the secret. Common in webhook verification (Stripe, GitHub, Slack) and API request signing.</p>' },
      { h2: 'Output format', body: '<p>Lowercase hexadecimal string — the standard format expected by most API documentation.</p>' },
    ],
  },
  {
    slug: 'context-window-calculator',
    title: 'How to check AI context window usage',
    seoTitle: 'AI context window calculator — token limit usage | maratool',
    description: 'See how much of a model context window your text uses. Compare GPT-4o, Claude, and Gemini limits.',
    lead: 'Paste a prompt — see token estimate, context limit, usage percentage, and remaining capacity.',
    og: 'developer.svg',
    embedTitle: 'Try it — pick a model and paste your text',
    embedHeight: 480,
    hub: '/developer',
    hubLabel: 'developer tools',
    intro: 'Every LLM has a context window limit. Exceed it and your request fails or gets truncated. The <a href="/context-window-calculator">AI Context Window Calculator</a> shows how much of GPT-4o, Claude, or Gemini capacity your text consumes.',
    steps: [
      '<strong>Select a model</strong> — context limits differ (8K to 1M tokens).',
      '<strong>Paste your text</strong> — prompt, document, or code.',
      '<strong>Check usage bar</strong> — stay under 80% for safety margin.',
    ],
    sections: [
      { h2: 'Token estimation', body: '<p>Uses ~4 characters per token for English — same heuristic as the <a href="/ai-token-calculator">AI Token Counter</a>. Close enough for planning; verify with the provider tokenizer for billing.</p>' },
      { h2: 'Cost planning', body: '<p>Once you know token count, plug into the <a href="/ai-cost-calculator">AI Cost Calculator</a> for per-request pricing.</p>' },
    ],
  },
  {
    slug: 'word-counter',
    title: 'How to count words and characters online',
    seoTitle: 'Word counter & character counter online | maratool',
    description: 'Count words, characters, sentences, and paragraphs in real time. Free word counter — paste or type any text.',
    lead: 'Real-time word count, character count, sentences, and paragraphs as you type.',
    og: 'text.svg',
    embedTitle: 'Try it — paste or type text to count',
    embedHeight: 420,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'Essays, meta descriptions, tweets, and SEO content all have length limits. The <a href="/word-counter">Word Counter</a> updates counts on every keystroke — words, characters (with and without spaces), sentences, and paragraphs.',
    steps: [
      '<strong>Paste or type</strong> — any text, any length.',
      '<strong>Read the stats</strong> — all counters update in real time.',
    ],
    sections: [
      { h2: 'Word counting rules', body: '<p>Words are split on whitespace. "don\'t" counts as one word. Empty input shows zero across all stats.</p>' },
      { h2: 'Related tools', body: '<p>For reading time estimates, use the <a href="/reading-time">Reading Time Calculator</a>. For line-level transforms, try <a href="/text-line-tools">Sort, Dedupe & Convert Text Lines</a>.</p>' },
    ],
  },
  {
    slug: 'text-line-tools',
    title: 'How to sort, dedupe, and convert text lines',
    seoTitle: 'Sort lines, remove duplicates & change case online | maratool',
    description: 'Sort lines alphabetically, remove duplicates, randomize, and convert case. All text line tools in one place.',
    lead: 'One textarea, seven transforms — sort, dedupe, randomize, uppercase, lowercase, title case.',
    og: 'text.svg',
    embedTitle: 'Try it — paste lines and apply a transform',
    embedHeight: 520,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'Cleaning a list of emails, sorting log lines, or removing duplicate SKUs — all are line-based text operations. The <a href="/text-line-tools">Text Line Tools</a> page bundles the most common transforms.',
    steps: [
      '<strong>Paste text</strong> — one item per line.',
      '<strong>Click a transform</strong> — sort, dedupe, randomize, or change case.',
      '<strong>Copy output</strong> — result appears in the output box.',
    ],
    sections: [
      { h2: 'Available transforms', body: '<ul><li><strong>Sort A→Z / Z→A</strong> — locale-aware alphabetical sort.</li><li><strong>Remove duplicates</strong> — keeps first occurrence, case-sensitive.</li><li><strong>Randomize</strong> — shuffle line order.</li><li><strong>Case</strong> — UPPERCASE, lowercase, Title Case.</li></ul>' },
      { h2: 'Privacy', body: '<p>All transforms run locally. Your list data never leaves the browser.</p>' },
    ],
  },
  {
    slug: 'json-diff',
    title: 'How to compare two JSON objects and find differences',
    seoTitle: 'JSON diff — compare two JSON objects online | maratool',
    description: 'Compare two JSON documents and highlight added, removed, and changed keys. Free JSON diff tool.',
    lead: 'Paste two JSON objects — see added, removed, and changed keys with a summary count.',
    og: 'text.svg',
    embedTitle: 'Try it — paste original and modified JSON',
    embedHeight: 560,
    hub: '/text',
    hubLabel: 'text tools',
    intro: 'API responses change between versions. Config files drift. The <a href="/json-diff">JSON Diff</a> tool flattens nested objects to dot-notation paths and highlights what changed — green for added, red for removed, amber for changed values.',
    steps: [
      '<strong>Paste original JSON</strong> — left box.',
      '<strong>Paste modified JSON</strong> — right box.',
      '<strong>Click Compare</strong> — see path-level differences.',
    ],
    sections: [
      { h2: 'JSON diff vs text diff', body: '<p>The <a href="/diff-checker">Diff Checker</a> compares raw text line-by-line. JSON Diff compares by key path — better for config and API payload changes where key order does not matter.</p>' },
      { h2: 'Invalid JSON', body: '<p>Malformed JSON shows a parse error instead of a diff. Format first with the <a href="/json-formatter">JSON Formatter</a> if needed.</p>' },
    ],
  },
  {
    slug: 'timezone-converter',
    title: 'How to convert time between time zones',
    seoTitle: 'Time zone converter — convert time between zones | maratool',
    description: 'Convert date and time between time zones instantly. All IANA zones supported. Free, runs in your browser.',
    lead: 'Pick a date/time and two IANA time zones — see the equivalent time in each, with DST handled automatically.',
    og: 'converter.svg',
    embedTitle: 'Try it — pick date, time, and two zones',
    embedHeight: 400,
    hub: '/converter',
    hubLabel: 'converter tools',
    intro: 'Scheduling across time zones is error-prone. The <a href="/timezone-converter">Time Zone Converter</a> uses the browser Intl API to convert any datetime between 400+ IANA zones — including daylight saving transitions.',
    steps: [
      '<strong>Pick date and time</strong> — defaults to now.',
      '<strong>Select source zone</strong> — defaults to your local zone.',
      '<strong>Select destination zone</strong> — UTC, US/Eastern, Europe/London, Asia/Tokyo, etc.',
    ],
    sections: [
      { h2: 'DST is automatic', body: '<p>The Intl API applies daylight saving rules for the selected date. No manual offset math required.</p>' },
      { h2: 'Related tools', body: '<p>For Unix timestamps, use the <a href="/unix-timestamp">Unix Timestamp Converter</a>. For cron schedules, try the <a href="/cron-expression">Cron Expression Builder</a>.</p>' },
    ],
  },
]

function esc(s) {
  return s.replace(/'/g, "\\'")
}

function render(post) {
  const stepsHtml = post.steps.map(s => `        <li>${s}</li>`).join('\n')
  const sectionsHtml = post.sections.map(s => `      <h2>${s.h2}</h2>\n      ${s.body}`).join('\n\n')

  return `---
import Base from '../../layouts/Base.astro'
import Layout from '../../components/Layout.astro'
import BlogPostShell from '../../components/BlogPostShell.astro'
import BlogToolEmbed from '../../components/BlogToolEmbed.astro'

const slug = '${post.slug}'
const seo = {
  title: '${esc(post.seoTitle)}',
  description: '${esc(post.description)}',
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
    description: '${esc(post.description)}',
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
      lead="${esc(post.lead)}"
      date="${DATE}"
      dateIso="${DATE_ISO}"
    >
      <p>${post.intro}</p>

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

console.log('Done:', posts.length, 'blog posts')
