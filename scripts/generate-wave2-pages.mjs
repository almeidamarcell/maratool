#!/usr/bin/env node
/**
 * Generates Wave 2 tool .astro pages from config.
 * Run: node scripts/generate-wave2-pages.mjs
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
  {
    slug: 'fire-calculator', jsFile: 'fire-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'retirement', subcategoryLabel: 'Retirement',
    title: 'FIRE Calculator — Years to Financial Independence | maratool',
    h1: 'FIRE Calculator — Financial Independence Retire Early',
    breadcrumbName: 'FIRE Calculator',
    description: 'Calculate years to financial independence using the 4% rule. Enter savings, expenses, income, and expected return. Free, runs in your browser.',
    shellDesc: 'Enter current savings, annual expenses, income, and investment return to see your FI number, years to FIRE, and savings rate.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter your current savings and annual living expenses.', 'Add annual income and expected investment return rate.', 'See your FI number, years to financial independence, and savings rate.'],
    faq: [
      { q: 'What is the 4% rule?', a: 'A guideline that you can withdraw 4% of your portfolio annually in retirement. Your FI number is 25× annual expenses.' },
      { q: 'How is years to FIRE calculated?', a: 'The calculator projects portfolio growth from savings and investment returns until it reaches 25× your annual expenses.' },
      { q: 'What savings rate should I target?', a: 'Higher savings rates dramatically shorten time to FI. Even 20–30% is a strong start for most earners.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'dca-calculator', name: 'Dollar Cost Averaging Calculator' }, { slug: 'inflation-calculator', name: 'Inflation Calculator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="fire-savings">Current savings ($)</label><input type="number" id="fire-savings" class="tool-input" placeholder="100000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="fire-expenses">Annual expenses ($)</label><input type="number" id="fire-expenses" class="tool-input" placeholder="40000" min="0" /></div>
        </div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="fire-income">Annual income ($)</label><input type="number" id="fire-income" class="tool-input" placeholder="80000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="fire-return">Expected return (%)</label><input type="number" id="fire-return" class="tool-input" placeholder="7" step="any" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="fire-fi">—</span><span class="tool-stat-label">FI number</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="fire-years">—</span><span class="tool-stat-label">Years to FIRE</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="fire-save-rate">—</span><span class="tool-stat-label">Savings rate</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'inflation-calculator', jsFile: 'inflation-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'interest', subcategoryLabel: 'Interest',
    title: 'Inflation Calculator — Purchasing Power Over Time | maratool',
    h1: 'Inflation Calculator — Purchasing Power Over Time',
    breadcrumbName: 'Inflation Calculator',
    description: 'See how inflation erodes purchasing power using historical US CPI data. Enter an amount and year range. Free, instant, runs in your browser.',
    shellDesc: 'Enter a dollar amount and year range to see inflation-adjusted value and total inflation percentage.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter the original dollar amount.', 'Select the starting year and ending year.', 'See the inflation-adjusted value and total inflation percentage.'],
    faq: [
      { q: 'What CPI data does this use?', a: 'Historical US Consumer Price Index data to adjust purchasing power between years.' },
      { q: 'Can I calculate future inflation?', a: 'This tool uses historical CPI. For projections, enter a custom ending year within the available range.' },
      { q: 'What does inflation-adjusted mean?', a: 'The equivalent dollar amount in the ending year that has the same purchasing power as the original amount.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'fire-calculator', name: 'FIRE Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-field"><label class="tool-label" for="inf-amount">Amount ($)</label><input type="number" id="inf-amount" class="tool-input" placeholder="1000" min="0" style="max-width:240px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="inf-from">From year</label><input type="number" id="inf-from" class="tool-input" placeholder="2000" min="1913" max="2025" /></div>
          <div class="calc-field"><label class="tool-label" for="inf-to">To year</label><input type="number" id="inf-to" class="tool-input" placeholder="2025" min="1913" max="2025" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="inf-adjusted">—</span><span class="tool-stat-label">Adjusted value</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="inf-pct">—</span><span class="tool-stat-label">Total inflation</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'stock-average-calculator', jsFile: 'stock-average-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'investment', subcategoryLabel: 'Investment',
    title: 'Stock Average Price Calculator — Cost Basis | maratool',
    h1: 'Stock Average Price Calculator — Cost Basis',
    breadcrumbName: 'Stock Average Calculator',
    description: 'Calculate weighted average share price across multiple purchases. Enter shares and price per lot. Free cost basis calculator, runs in your browser.',
    shellDesc: 'Add purchase lots with shares and price per share to see weighted average cost, total shares, and total cost.',
    appCategory: 'FinanceApplication',
    howTo: ['Add each purchase lot with number of shares and price per share.', 'Click Add lot for additional purchases.', 'See weighted average price, total shares, and total cost.'],
    faq: [
      { q: 'How is average share price calculated?', a: 'Weighted average: total cost divided by total shares across all lots.' },
      { q: 'Can I add unlimited lots?', a: 'Yes. Add as many purchase lots as needed for your cost basis calculation.' },
      { q: 'Does this account for fees?', a: 'Include commissions in the price per share if you want them reflected in your average cost.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'dca-calculator', name: 'Dollar Cost Averaging Calculator' }, { slug: 'cagr-calculator', name: 'CAGR Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div id="sa-lots"></div>
        <button type="button" id="sa-add" class="tool-button" style="margin-bottom:1rem;">Add lot</button>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="sa-avg">—</span><span class="tool-stat-label">Average price</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sa-shares">—</span><span class="tool-stat-label">Total shares</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sa-cost">—</span><span class="tool-stat-label">Total cost</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'dca-calculator', jsFile: 'dca-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'investment', subcategoryLabel: 'Investment',
    title: 'Dollar Cost Averaging Calculator — DCA Model | maratool',
    h1: 'Dollar Cost Averaging Calculator',
    breadcrumbName: 'DCA Calculator',
    description: 'Model dollar-cost averaging with recurring investments. See average cost per share and total invested. Free DCA calculator, runs in your browser.',
    shellDesc: 'Enter monthly investment, number of months, and share price to see average cost, total invested, and shares acquired.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter your monthly investment amount.', 'Set the number of months and current share price.', 'See average cost per share, total invested, and shares acquired.'],
    faq: [
      { q: 'What is dollar-cost averaging?', a: 'Investing a fixed amount at regular intervals regardless of share price, reducing timing risk.' },
      { q: 'Does this model price changes?', a: 'This simplified calculator uses a constant share price. For variable prices, use the stock average calculator with multiple lots.' },
      { q: 'How is average cost calculated?', a: 'Total invested divided by total shares purchased across all monthly contributions.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'stock-average-calculator', name: 'Stock Average Price Calculator' }, { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'cagr-calculator', name: 'CAGR Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="dca-monthly">Monthly investment ($)</label><input type="number" id="dca-monthly" class="tool-input" placeholder="500" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="dca-months">Number of months</label><input type="number" id="dca-months" class="tool-input" placeholder="12" min="1" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="dca-price">Share price ($)</label><input type="number" id="dca-price" class="tool-input" placeholder="150" min="0" step="any" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="dca-avg">—</span><span class="tool-stat-label">Average cost</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="dca-invested">—</span><span class="tool-stat-label">Total invested</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="dca-shares">—</span><span class="tool-stat-label">Shares acquired</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'commission-calculator', jsFile: 'commission-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Commission Calculator — Sales Commission | maratool',
    h1: 'Commission Calculator — Sales Commission',
    breadcrumbName: 'Commission Calculator',
    description: 'Calculate sales commission from deal value and commission rate. See commission amount and net proceeds instantly. Free, runs in your browser.',
    shellDesc: 'Enter deal amount and commission rate to see commission earned and net amount after commission.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter the deal or sale amount.', 'Set the commission rate as a percentage.', 'See commission amount and net proceeds instantly.'],
    faq: [
      { q: 'How is commission calculated?', a: 'Commission = Deal Amount × (Rate / 100). Net = Deal Amount − Commission.' },
      { q: 'Does this support tiered rates?', a: 'This calculator uses a flat rate. For tiered commissions, calculate each tier separately.' },
      { q: 'Is commission deducted from the sale or added on top?', a: 'This tool calculates commission as a percentage of the deal value, with net being what remains after commission.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'pricing-calculator', name: 'Pricing Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:260px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="com-amount">Deal amount ($)</label><input type="number" id="com-amount" class="tool-input" placeholder="10000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="com-rate">Commission rate (%)</label><input type="number" id="com-rate" class="tool-input" placeholder="10" step="any" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="com-commission">—</span><span class="tool-stat-label">Commission</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="com-net">—</span><span class="tool-stat-label">Net amount</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'contractor-rate-calculator', jsFile: 'contractor-rate-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'pay', subcategoryLabel: 'Pay',
    title: 'Contractor Rate Calculator — Hourly to Salary | maratool',
    h1: 'Contractor Rate Calculator — Hourly to Salary',
    breadcrumbName: 'Contractor Rate Calculator',
    description: 'Convert desired annual salary to an hourly contractor rate. Factor in billable hours, expenses, and tax buffer. Free, runs in your browser.',
    shellDesc: 'Enter target salary, billable hours, expenses, and tax rate to see required hourly and daily contractor rates.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your target annual salary equivalent.', 'Set billable hours per year, business expenses, and tax buffer.', 'See required hourly and daily contractor rates.'],
    faq: [
      { q: 'How many billable hours per year?', a: 'Full-time contractors typically bill 1,000–1,500 hours after accounting for admin, sales, and vacation.' },
      { q: 'Why add a tax buffer?', a: 'Contractors pay self-employment tax and must cover their own benefits. A 25–35% buffer is common.' },
      { q: 'How is hourly rate calculated?', a: 'Required revenue = (Salary + Expenses) / (1 − Tax Rate). Hourly = Revenue / Billable Hours.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'salary-converter', name: 'Salary Converter' }, { slug: 'pricing-calculator', name: 'Pricing Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }],
    body: `      <div class="tool-container" style="min-height:340px;">
        <div class="calc-field"><label class="tool-label" for="cr-salary">Target salary ($)</label><input type="number" id="cr-salary" class="tool-input" placeholder="100000" min="0" style="max-width:240px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="cr-hours">Billable hours/year</label><input type="number" id="cr-hours" class="tool-input" placeholder="1200" min="1" /></div>
          <div class="calc-field"><label class="tool-label" for="cr-expense">Annual expenses ($)</label><input type="number" id="cr-expense" class="tool-input" placeholder="5000" min="0" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="cr-tax">Tax buffer (%)</label><input type="number" id="cr-tax" class="tool-input" placeholder="30" step="any" min="0" max="99" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="cr-hourly">—</span><span class="tool-stat-label">Hourly rate</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="cr-daily">—</span><span class="tool-stat-label">Daily rate (8h)</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'pricing-calculator', jsFile: 'pricing-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Pricing Calculator — Markup & Margin | maratool',
    h1: 'Pricing Calculator — Markup & Margin',
    breadcrumbName: 'Pricing Calculator',
    description: 'Calculate selling price from cost and markup or margin. See profit per unit instantly. Free pricing calculator, runs in your browser.',
    shellDesc: 'Enter cost, choose markup or margin mode, and set percentage to see selling price, profit, and margin.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your product or service cost.', 'Choose markup or margin mode and set the percentage.', 'See selling price, profit per unit, and margin percentage.'],
    faq: [
      { q: 'What is the difference between markup and margin?', a: 'Markup is profit as a percentage of cost. Margin is profit as a percentage of selling price.' },
      { q: 'How do I calculate selling price from markup?', a: 'Selling Price = Cost × (1 + Markup/100). A 50% markup on $100 cost = $150 price.' },
      { q: 'How do I calculate selling price from margin?', a: 'Selling Price = Cost / (1 − Margin/100). A 30% margin on $100 cost = $142.86 price.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'commission-calculator', name: 'Commission Calculator' }, { slug: 'break-even-calculator', name: 'Break-even Calculator' }],
    body: `      <div class="tool-container" style="min-height:320px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="pr-cost">Cost ($)</label><input type="number" id="pr-cost" class="tool-input" placeholder="50" min="0" step="any" /></div>
          <div class="calc-field"><label class="tool-label" for="pr-mode">Mode</label><select id="pr-mode" class="tool-input calc-select"><option value="markup">Markup on cost</option><option value="margin">Margin on price</option></select></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="pr-pct">Percentage (%)</label><input type="number" id="pr-pct" class="tool-input" placeholder="40" step="any" min="0" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="pr-price">—</span><span class="tool-stat-label">Selling price</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="pr-profit">—</span><span class="tool-stat-label">Profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="pr-margin">—</span><span class="tool-stat-label">Margin</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'invoice-due-date-calculator', jsFile: 'invoice-due-date-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'invoicing', subcategoryLabel: 'Invoicing',
    title: 'Invoice Due Date Calculator — Net 30 & Payment Terms | maratool',
    h1: 'Invoice Due Date Calculator',
    breadcrumbName: 'Invoice Due Date Calculator',
    description: 'Calculate invoice due dates from issue date and payment terms. Net 30, Net 60, or custom days. Free, instant, runs in your browser.',
    shellDesc: 'Enter invoice issue date and payment terms in days to see the due date instantly.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter the invoice issue date.', 'Set payment terms in days (e.g. 30 for Net 30).', 'See the calculated due date instantly.'],
    faq: [
      { q: 'What does Net 30 mean?', a: 'Payment is due 30 days after the invoice issue date. Net 60 = 60 days, and so on.' },
      { q: 'Are weekends and holidays excluded?', a: 'This calculator adds calendar days. Some businesses use business days only — adjust manually if needed.' },
      { q: 'Can I use custom payment terms?', a: 'Yes. Enter any number of days for custom terms like Net 15 or Net 45.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'commission-calculator', name: 'Commission Calculator' }, { slug: 'pricing-calculator', name: 'Pricing Calculator' }, { slug: 'vat-calculator', name: 'VAT Calculator' }],
    body: `      <div class="tool-container" style="min-height:240px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="inv-issue">Issue date</label><input type="date" id="inv-issue" class="tool-input" style="max-width:220px;" /></div>
          <div class="calc-field"><label class="tool-label" for="inv-terms">Payment terms (days)</label><input type="number" id="inv-terms" class="tool-input" placeholder="30" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="inv-due">—</span><span class="tool-stat-label">Due date</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'csv-cleaner', jsFile: 'csv-cleaner.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'csv', subcategoryLabel: 'CSV',
    title: 'CSV Cleaner — Trim & Fix CSV Files Online | maratool',
    h1: 'CSV Cleaner — Trim & Fix CSV Files',
    breadcrumbName: 'CSV Cleaner',
    description: 'Clean CSV files online. Trim whitespace, remove empty rows, and fix line endings. Free CSV cleanup tool, runs in your browser.',
    shellDesc: 'Paste CSV data to trim whitespace, remove empty rows, and fix line endings. Copy the cleaned output.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your CSV data in the input box.', 'Cleaned output updates automatically.', 'Click Copy to copy the cleaned CSV.'],
    faq: [
      { q: 'What does the CSV cleaner fix?', a: 'Trims leading/trailing whitespace from cells, removes empty rows, and normalizes line endings.' },
      { q: 'Does it change the delimiter?', a: 'No. The delimiter structure is preserved. Only whitespace and empty rows are cleaned.' },
      { q: 'Can I clean large CSV files?', a: 'Yes, within browser memory limits. Very large files may be slow but stay local.' },
      { q: 'Is my CSV sent to a server?', a: 'No. Cleaning happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'csv-remove-duplicates', name: 'Remove Duplicate Rows from CSV' }, { slug: 'csv-to-json', name: 'Convert CSV to JSON' }, { slug: 'csv-merge', name: 'Merge CSV Files Online' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="cc-input">CSV input</label>
        <textarea id="cc-input" class="tool-textarea" rows="10" placeholder="name,email&#10; Alice , alice@example.com &#10;&#10;Bob,bob@example.com"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Cleaned output</label>
          <button type="button" id="cc-copy" class="copy-btn">Copy</button>
        </div>
        <textarea id="cc-output" class="tool-textarea" rows="10" readonly></textarea>
      </div>`,
  },
  {
    slug: 'csv-remove-duplicates', jsFile: 'csv-remove-duplicates.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'csv', subcategoryLabel: 'CSV',
    title: 'Remove Duplicate Rows from CSV Online | maratool',
    h1: 'Remove Duplicate Rows from CSV',
    breadcrumbName: 'CSV Remove Duplicates',
    description: 'Remove duplicate rows from CSV files. Dedupe by entire row or a specific column. Free, instant, browser-based CSV deduplication.',
    shellDesc: 'Paste CSV data and deduplicate by entire row or a specific column. Copy the deduplicated output.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your CSV data in the input box.', 'Choose to dedupe by all columns or a specific column.', 'Copy the deduplicated output.'],
    faq: [
      { q: 'How does deduplication work?', a: 'Keeps the first occurrence of each unique row or column value and removes subsequent duplicates.' },
      { q: 'Can I dedupe by a single column?', a: 'Yes. Select a column index to deduplicate based on that column only.' },
      { q: 'Is the header row preserved?', a: 'Yes. The first row is treated as a header and is never removed.' },
      { q: 'Is my CSV sent to a server?', a: 'No. Deduplication happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'csv-cleaner', name: 'CSV Cleaner' }, { slug: 'csv-merge', name: 'Merge CSV Files Online' }, { slug: 'csv-to-json', name: 'Convert CSV to JSON' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <div class="calc-field"><label class="tool-label" for="cd-column">Dedupe by</label><select id="cd-column" class="tool-input calc-select" style="max-width:240px;"><option value="all">All columns</option><option value="0">Column 0</option><option value="1">Column 1</option></select></div>
        <label class="tool-label" for="cd-input">CSV input</label>
        <textarea id="cd-input" class="tool-textarea" rows="10" placeholder="id,name&#10;1,Alice&#10;1,Alice&#10;2,Bob"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Deduplicated output</label>
          <button type="button" id="cd-copy" class="copy-btn">Copy</button>
        </div>
        <textarea id="cd-output" class="tool-textarea" rows="10" readonly></textarea>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'csv-split', jsFile: 'csv-split.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'csv', subcategoryLabel: 'CSV',
    title: 'Split CSV File Online — Divide by Row Count | maratool',
    h1: 'Split CSV File Online',
    breadcrumbName: 'CSV Split',
    description: 'Split a CSV file into multiple files by row count. Download-ready chunks for large datasets. Free, runs in your browser.',
    shellDesc: 'Paste CSV data, set rows per chunk, and split into downloadable parts.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your CSV data in the input box.', 'Set the number of rows per chunk.', 'Click Split to see downloadable CSV chunks.'],
    faq: [
      { q: 'Does splitting preserve the header?', a: 'Yes. The header row is included in each split chunk.' },
      { q: 'What row count should I use?', a: 'Common choices: 1,000 or 10,000 rows per file, depending on your import tool limits.' },
      { q: 'Can I download each chunk?', a: 'Yes. Each split chunk can be copied or downloaded separately.' },
      { q: 'Is my CSV sent to a server?', a: 'No. Splitting happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'csv-merge', name: 'Merge CSV Files Online' }, { slug: 'csv-cleaner', name: 'CSV Cleaner' }, { slug: 'csv-to-json', name: 'Convert CSV to JSON' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="cs-input">CSV input</label>
        <textarea id="cs-input" class="tool-textarea" rows="10" placeholder="id,name&#10;1,Alice&#10;2,Bob&#10;3,Carol"></textarea>
        <div class="calc-row" style="align-items:end;">
          <div class="calc-field"><label class="tool-label" for="cs-size">Rows per chunk</label><input type="number" id="cs-size" class="tool-input" placeholder="1000" min="1" style="max-width:200px;" /></div>
          <div class="calc-field"><button type="button" id="cs-split" class="tool-button">Split</button></div>
        </div>
        <div id="cs-output" style="margin-top:1rem;"></div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'csv-merge', jsFile: 'csv-merge.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'csv', subcategoryLabel: 'CSV',
    title: 'Merge CSV Files Online — Combine CSV Data | maratool',
    h1: 'Merge CSV Files Online',
    breadcrumbName: 'CSV Merge',
    description: 'Merge multiple CSV files into one. Combines headers automatically. Paste or type CSV content. Free, runs in your browser.',
    shellDesc: 'Paste two CSV files and merge them into one combined output with automatic header handling.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste the first CSV in the top box.', 'Paste the second CSV in the bottom box.', 'Click Merge and copy the combined output.'],
    faq: [
      { q: 'How are headers handled?', a: 'The header from the first file is kept. Duplicate headers from the second file are skipped.' },
      { q: 'Do columns need to match?', a: 'Best results when both files have the same column structure. Mismatched columns may produce uneven rows.' },
      { q: 'Can I merge more than two files?', a: 'Merge two at a time, then merge the result with a third file.' },
      { q: 'Is my CSV sent to a server?', a: 'No. Merging happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'csv-split', name: 'Split CSV File Online' }, { slug: 'csv-cleaner', name: 'CSV Cleaner' }, { slug: 'csv-to-json', name: 'Convert CSV to JSON' }],
    body: `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="cm-a">CSV file A</label><textarea id="cm-a" class="tool-textarea" rows="8" placeholder="id,name&#10;1,Alice"></textarea></div>
          <div class="calc-field"><label class="tool-label" for="cm-b">CSV file B</label><textarea id="cm-b" class="tool-textarea" rows="8" placeholder="id,name&#10;2,Bob"></textarea></div>
        </div>
        <button type="button" id="cm-merge" class="tool-button" style="margin-bottom:1rem;">Merge</button>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <label class="tool-label" style="margin:0;">Merged output</label>
          <button type="button" id="cm-copy" class="copy-btn">Copy</button>
        </div>
        <textarea id="cm-output" class="tool-textarea" rows="8" readonly></textarea>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'curl-to-fetch', jsFile: 'curl-to-fetch.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'api', subcategoryLabel: 'API',
    title: 'Convert cURL to JavaScript Fetch — Online | maratool',
    h1: 'Convert cURL to JavaScript Fetch',
    breadcrumbName: 'cURL to Fetch',
    description: 'Convert cURL commands to JavaScript fetch() code. Paste curl and get copy-ready fetch syntax. Free, runs in your browser.',
    shellDesc: 'Paste a cURL command and get equivalent JavaScript fetch() code with headers and body.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste your cURL command in the input box.', 'JavaScript fetch code appears automatically.', 'Click Copy to copy the generated code.'],
    faq: [
      { q: 'What cURL flags are supported?', a: 'Common flags: -X method, -H headers, -d/--data body, --json, and URL. Complex flags may need manual adjustment.' },
      { q: 'Does this send the request?', a: 'No. This only converts the cURL command to fetch() syntax. Run the code in your app to execute.' },
      { q: 'Is async/await included?', a: 'Output uses fetch() with .then() by default. Easy to wrap in async/await in your code.' },
      { q: 'Is my data sent to a server?', a: 'No. Conversion happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'curl-to-python', name: 'Convert cURL to Python Requests' }, { slug: 'curl-generator', name: 'cURL Command Generator' }, { slug: 'postman-collection-generator', name: 'Postman Collection Generator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="ctf-input">cURL command</label>
        <textarea id="ctf-input" class="tool-textarea" rows="6" placeholder="curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{&quot;name&quot;:&quot;Alice&quot;}'"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">JavaScript fetch()</label>
          <button type="button" id="ctf-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="ctf-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;font-family:var(--font-mono);font-size:13px;"></pre>
      </div>`,
  },
  {
    slug: 'curl-to-python', jsFile: 'curl-to-python.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'api', subcategoryLabel: 'API',
    title: 'Convert cURL to Python Requests — Online | maratool',
    h1: 'Convert cURL to Python Requests',
    breadcrumbName: 'cURL to Python',
    description: 'Convert cURL commands to Python requests code. Paste curl and get copy-ready Python. Free, runs in your browser.',
    shellDesc: 'Paste a cURL command and get equivalent Python requests code with headers and body.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste your cURL command in the input box.', 'Python requests code appears automatically.', 'Click Copy to copy the generated code.'],
    faq: [
      { q: 'What Python library is used?', a: 'The requests library — the standard for HTTP in Python. Install with pip install requests.' },
      { q: 'What cURL flags are supported?', a: 'Common flags: -X method, -H headers, -d/--data body, --json, and URL.' },
      { q: 'Does this send the request?', a: 'No. This only converts the command. Run the Python code to execute the request.' },
      { q: 'Is my data sent to a server?', a: 'No. Conversion happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'curl-to-fetch', name: 'Convert cURL to JavaScript Fetch' }, { slug: 'curl-generator', name: 'cURL Command Generator' }, { slug: 'postman-collection-generator', name: 'Postman Collection Generator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="ctp-input">cURL command</label>
        <textarea id="ctp-input" class="tool-textarea" rows="6" placeholder="curl -X GET https://api.example.com/users -H 'Authorization: Bearer token'"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Python requests</label>
          <button type="button" id="ctp-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="ctp-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;font-family:var(--font-mono);font-size:13px;"></pre>
      </div>`,
  },
  {
    slug: 'postman-collection-generator', jsFile: 'postman-collection-generator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'api', subcategoryLabel: 'API',
    title: 'Postman Collection Generator — Create JSON Online | maratool',
    h1: 'Postman Collection Generator',
    breadcrumbName: 'Postman Collection Generator',
    description: 'Generate Postman Collection v2.1 JSON from URL, method, headers, and body. Import directly into Postman. Free, runs in your browser.',
    shellDesc: 'Fill in URL, method, headers, and body to generate Postman Collection v2.1 JSON ready to import.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter the request URL, HTTP method, and collection name.', 'Add headers and optional request body.', 'Copy the generated Postman Collection JSON.'],
    faq: [
      { q: 'What Postman format is generated?', a: 'Postman Collection v2.1 JSON, compatible with Postman and compatible API clients.' },
      { q: 'How do I import into Postman?', a: 'Copy the JSON, save as a .json file, then Import → Upload Files in Postman.' },
      { q: 'Can I add multiple requests?', a: 'This generator creates a single-request collection. Duplicate and edit for additional requests.' },
      { q: 'Is my data sent to a server?', a: 'No. Generation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'curl-generator', name: 'cURL Command Generator' }, { slug: 'curl-to-fetch', name: 'Convert cURL to JavaScript Fetch' }, { slug: 'json-formatter', name: 'JSON Formatter' }],
    body: `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="pm-url">URL</label><input type="url" id="pm-url" class="tool-input" placeholder="https://api.example.com/users" /></div>
          <div class="calc-field"><label class="tool-label" for="pm-method">Method</label><select id="pm-method" class="tool-input calc-select"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="pm-name">Collection name</label><input type="text" id="pm-name" class="tool-input" placeholder="My API Collection" /></div>
        <div class="calc-field"><label class="tool-label" for="pm-headers">Headers (one per line)</label><textarea id="pm-headers" class="tool-textarea" rows="3" placeholder="Content-Type: application/json"></textarea></div>
        <div class="calc-field"><label class="tool-label" for="pm-body">Body</label><textarea id="pm-body" class="tool-textarea" rows="4" placeholder='{"key": "value"}'></textarea></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <label class="tool-label" style="margin:0;">Postman Collection JSON</label>
          <button type="button" id="pm-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="pm-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;font-family:var(--font-mono);font-size:13px;"></pre>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'json-schema-validator', jsFile: 'json-schema-validator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'api', subcategoryLabel: 'API',
    title: 'JSON Schema Validator Online — Validate JSON | maratool',
    h1: 'JSON Schema Validator Online',
    breadcrumbName: 'JSON Schema Validator',
    description: 'Validate JSON data against a JSON Schema. Paste instance and schema to see errors instantly. Free, runs in your browser.',
    shellDesc: 'Paste JSON instance and JSON Schema, then click Validate to see validation results and errors.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste your JSON data instance in the left box.', 'Paste the JSON Schema in the right box.', 'Click Validate to see validation results and any errors.'],
    faq: [
      { q: 'Which JSON Schema draft is supported?', a: 'Draft-07 and Draft 2020-12 schemas are supported for common validation keywords.' },
      { q: 'Does it validate nested objects?', a: 'Yes. Full object and array validation including nested properties and required fields.' },
      { q: 'What if my JSON is invalid?', a: 'Syntax errors are reported before schema validation runs.' },
      { q: 'Is my JSON sent to a server?', a: 'No. Validation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'json-formatter', name: 'JSON Formatter' }, { slug: 'schema-validator', name: 'Schema Markup Validator' }, { slug: 'json-diff', name: 'JSON Diff' }],
    body: `      <div class="tool-container" style="min-height:520px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="jsv-instance">JSON instance</label><textarea id="jsv-instance" class="tool-textarea" rows="10" placeholder='{"name": "Alice", "age": 30}'></textarea></div>
          <div class="calc-field"><label class="tool-label" for="jsv-schema">JSON Schema</label><textarea id="jsv-schema" class="tool-textarea" rows="10" placeholder='{"type": "object", "properties": {"name": {"type": "string"}, "age": {"type": "number"}}, "required": ["name"]}'></textarea></div>
        </div>
        <button type="button" id="jsv-validate" class="tool-button" style="margin-bottom:1rem;">Validate</button>
        <div id="jsv-output" class="tool-output" style="min-height:80px;font-family:var(--font-mono);font-size:13px;"></div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'age-calculator', jsFile: 'age-calculator.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'date', subcategoryLabel: 'Date',
    title: 'Age Calculator — Exact Age from Birth Date | maratool',
    h1: 'Age Calculator — Exact Age from Birth Date',
    breadcrumbName: 'Age Calculator',
    description: 'Calculate exact age in years, months, and days from a birth date. Updates to today or any target date. Free, runs in your browser.',
    shellDesc: 'Enter birth date and optional target date to see exact age in years, months, days, and total days.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Enter the birth date.', 'Optionally set a target date (defaults to today).', 'See exact age in years, months, days, and total days.'],
    faq: [
      { q: 'How is age calculated?', a: 'Age is computed as the difference between birth date and target date in years, months, and days.' },
      { q: 'Does it handle leap years?', a: 'Yes. Date arithmetic accounts for varying month lengths and leap years.' },
      { q: 'Can I calculate age on a past date?', a: 'Yes. Set any target date to see age as of that date.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'unix-timestamp', name: 'Unix Timestamp Converter' }, { slug: 'week-number-calculator', name: 'ISO Week Number Calculator' }, { slug: 'iso8601-formatter', name: 'ISO 8601 Date Formatter' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="age-birth">Birth date</label><input type="date" id="age-birth" class="tool-input" style="max-width:220px;" /></div>
          <div class="calc-field"><label class="tool-label" for="age-target">Target date</label><input type="date" id="age-target" class="tool-input" style="max-width:220px;" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="age-years">—</span><span class="tool-stat-label">Years</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="age-months">—</span><span class="tool-stat-label">Months</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="age-days">—</span><span class="tool-stat-label">Days</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="age-total">—</span><span class="tool-stat-label">Total days</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'iso8601-formatter', jsFile: 'iso8601-formatter.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'date', subcategoryLabel: 'Date',
    title: 'ISO 8601 Date Formatter — Parse & Format Dates | maratool',
    h1: 'ISO 8601 Date Formatter',
    breadcrumbName: 'ISO 8601 Formatter',
    description: 'Parse and format ISO 8601 dates. Convert between ISO strings, local datetime, and Unix timestamps. Free, runs in your browser.',
    shellDesc: 'Enter an ISO 8601 date string or click Now to see formatted ISO, local datetime, and Unix timestamp.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Enter an ISO 8601 date string or click Now for current time.', 'See formatted ISO output, local datetime, and Unix timestamp.', 'Use outputs for APIs, logs, and database timestamps.'],
    faq: [
      { q: 'What ISO 8601 formats are supported?', a: 'Full datetime with timezone offset, UTC Z suffix, and date-only formats like 2025-06-28.' },
      { q: 'What does the Now button do?', a: 'Inserts the current date/time and shows all format conversions instantly.' },
      { q: 'How is local time determined?', a: 'Uses your browser timezone via the Intl API.' },
      { q: 'Is my data sent to a server?', a: 'No. Formatting happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'unix-timestamp', name: 'Unix Timestamp Converter' }, { slug: 'week-number-calculator', name: 'ISO Week Number Calculator' }, { slug: 'age-calculator', name: 'Age Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-field" style="display:flex;gap:0.5rem;align-items:end;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;"><label class="tool-label" for="iso-input">ISO 8601 input</label><input type="text" id="iso-input" class="tool-input" placeholder="2025-06-28T12:00:00Z" /></div>
          <button type="button" id="iso-now" class="tool-button">Now</button>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="iso-out">—</span><span class="tool-stat-label">ISO 8601</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="iso-local">—</span><span class="tool-stat-label">Local datetime</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="iso-unix">—</span><span class="tool-stat-label">Unix timestamp</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'week-number-calculator', jsFile: 'week-number-calculator.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'date', subcategoryLabel: 'Date',
    title: 'ISO Week Number Calculator — Week of Year | maratool',
    h1: 'ISO Week Number Calculator',
    breadcrumbName: 'Week Number Calculator',
    description: 'Find the ISO week number for any date. See week start, week end, and year-week label. Free, runs in your browser.',
    shellDesc: 'Pick a date to see ISO week number, year-week label, and the week start and end dates.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Select or enter a date.', 'See the ISO week number and year-week label.', 'View week start (Monday) and week end (Sunday) dates.'],
    faq: [
      { q: 'What is ISO week numbering?', a: 'Weeks start on Monday. Week 1 is the first week with at least 4 days in the new year.' },
      { q: 'Why can week 1 be in the previous year?', a: 'ISO weeks near January may belong to the previous or next ISO year depending on the day of week.' },
      { q: 'How is week start/end calculated?', a: 'Week starts Monday 00:00 and ends Sunday 23:59 of that ISO week.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'iso8601-formatter', name: 'ISO 8601 Date Formatter' }, { slug: 'unix-timestamp', name: 'Unix Timestamp Converter' }, { slug: 'age-calculator', name: 'Age Calculator' }],
    body: `      <div class="tool-container" style="min-height:280px;">
        <div class="calc-field"><label class="tool-label" for="wn-date">Date</label><input type="date" id="wn-date" class="tool-input" style="max-width:220px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="wn-week">—</span><span class="tool-stat-label">Week number</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wn-label">—</span><span class="tool-stat-label">Year-week</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wn-start">—</span><span class="tool-stat-label">Week start</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wn-end">—</span><span class="tool-stat-label">Week end</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'shopify-discount-calculator', jsFile: 'shopify-discount-calculator.js',
    categorySlug: 'e-commerce', categoryLabel: 'E-commerce', subcategorySlug: 'pricing', subcategoryLabel: 'Pricing',
    title: 'Shopify Discount Calculator — Stacked Discounts | maratool',
    h1: 'Shopify Discount Calculator — Stacked Discounts',
    breadcrumbName: 'Shopify Discount Calculator',
    description: 'Calculate final price after stacked Shopify discounts. Enter original price and multiple discount percentages. Free, runs in your browser.',
    shellDesc: 'Enter original price and two discount percentages to see final price and total savings.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter the original product price.', 'Add first and second discount percentages.', 'See final price and total amount saved.'],
    faq: [
      { q: 'How does Shopify stack discounts?', a: 'Shopify applies discounts sequentially — each percentage is applied to the remaining price after the previous discount.' },
      { q: 'Is 20% + 10% the same as 30%?', a: 'No. Sequential stacking: $100 − 20% = $80, then − 10% = $72, not $70.' },
      { q: 'Can I use one discount?', a: 'Leave the second discount at 0% to calculate a single discount.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'pricing-calculator', name: 'Pricing Calculator' }, { slug: 'amazon-fee-calculator', name: 'Amazon Seller Fee Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-field"><label class="tool-label" for="sd-original">Original price ($)</label><input type="number" id="sd-original" class="tool-input" placeholder="100" min="0" step="any" style="max-width:200px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="sd-d1">Discount 1 (%)</label><input type="number" id="sd-d1" class="tool-input" placeholder="20" min="0" max="100" step="any" /></div>
          <div class="calc-field"><label class="tool-label" for="sd-d2">Discount 2 (%)</label><input type="number" id="sd-d2" class="tool-input" placeholder="10" min="0" max="100" step="any" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="sd-final">—</span><span class="tool-stat-label">Final price</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sd-saved">—</span><span class="tool-stat-label">Total saved</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'gtin-validator', jsFile: 'gtin-validator.js',
    categorySlug: 'e-commerce', categoryLabel: 'E-commerce', subcategorySlug: 'pricing', subcategoryLabel: 'Pricing',
    title: 'GTIN Validator — EAN-13 & UPC Check Digit | maratool',
    h1: 'GTIN Validator — EAN-13 & UPC Check Digit',
    breadcrumbName: 'GTIN Validator',
    description: 'Validate GTIN, EAN-13, and UPC barcodes. Verify check digits and format. Free GTIN validator, runs in your browser.',
    shellDesc: 'Enter a GTIN, EAN-13, or UPC barcode to validate check digit, detect type, and see validation message.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter a GTIN, EAN-13, or UPC barcode number.', 'See validation status, barcode type, and check digit result.', 'Fix any check digit errors before printing labels.'],
    faq: [
      { q: 'What GTIN formats are supported?', a: 'GTIN-8, GTIN-12 (UPC-A), GTIN-13 (EAN-13), and GTIN-14 with check digit validation.' },
      { q: 'How is the check digit calculated?', a: 'Modulo-10 algorithm: alternating weights of 3 and 1 on digits, sum mod 10, complement to 10.' },
      { q: 'Can I validate barcodes without check digits?', a: 'Enter the full code including check digit. The validator confirms the last digit is correct.' },
      { q: 'Is my data sent to a server?', a: 'No. Validation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'barcode-generator', name: 'Barcode Generator' }, { slug: 'amazon-fee-calculator', name: 'Amazon Seller Fee Calculator' }, { slug: 'shopify-discount-calculator', name: 'Shopify Discount Calculator' }],
    body: `      <div class="tool-container" style="min-height:260px;">
        <div class="calc-field"><label class="tool-label" for="gtin-input">GTIN / barcode</label><input type="text" id="gtin-input" class="tool-input" placeholder="5901234123457" inputmode="numeric" style="max-width:280px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="gtin-valid">—</span><span class="tool-stat-label">Valid</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="gtin-type">—</span><span class="tool-stat-label">Type</span></div>
        </div>
        <p id="gtin-msg" style="font-size:13px;color:var(--text-2);margin:1rem 0 0;">—</p>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'prompt-variable-tester', jsFile: 'prompt-variable-tester.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'Prompt Variable Tester — Template Preview | maratool',
    h1: 'Prompt Variable Tester — Template Preview',
    breadcrumbName: 'Prompt Variable Tester',
    description: 'Test prompt templates with variables. Enter {{placeholders}} and preview the filled prompt instantly. Free, runs in your browser.',
    shellDesc: 'Write a prompt template with {{variables}} and provide values to preview the filled prompt.',
    appCategory: 'DeveloperApplication',
    howTo: ['Write your prompt template with {{variable}} placeholders.', 'Enter variable values as key=value pairs, one per line.', 'See the filled prompt in the output preview.'],
    faq: [
      { q: 'What placeholder syntax is supported?', a: 'Double curly braces: {{variable_name}}. Names can include letters, numbers, and underscores.' },
      { q: 'How do I provide variable values?', a: 'One per line in key=value format, e.g. name=Alice on its own line.' },
      { q: 'What if a variable is missing?', a: 'Missing variables are left as {{placeholder}} in the output so you can spot gaps.' },
      { q: 'Is my prompt sent to a server?', a: 'No. Template rendering happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'ai-token-calculator', name: 'AI Token Counter' }, { slug: 'context-window-calculator', name: 'AI Context Window Calculator' }, { slug: 'ai-cost-calculator', name: 'AI Cost Calculator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <div class="calc-field"><label class="tool-label" for="pv-template">Prompt template</label><textarea id="pv-template" class="tool-textarea" rows="6" placeholder="Hello {{name}}, summarize {{topic}} in {{count}} sentences."></textarea></div>
        <div class="calc-field"><label class="tool-label" for="pv-vars">Variables (key=value, one per line)</label><textarea id="pv-vars" class="tool-textarea" rows="4" placeholder="name=Alice&#10;topic=API design&#10;count=3"></textarea></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <label class="tool-label" style="margin:0;">Filled prompt</label>
          <button type="button" id="pv-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="pv-output" class="tool-output" style="min-height:80px;white-space:pre-wrap;font-family:var(--font-mono);font-size:13px;"></pre>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'embedding-cost-calculator', jsFile: 'embedding-cost-calculator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'AI Embedding Cost Calculator — API Pricing | maratool',
    h1: 'AI Embedding Cost Calculator',
    breadcrumbName: 'Embedding Cost Calculator',
    description: 'Estimate embedding API costs for OpenAI, Cohere, and Voyage. Enter token count and see per-request pricing. Free, runs in your browser.',
    shellDesc: 'Select an embedding model, enter token count, and see estimated cost per request.',
    appCategory: 'DeveloperApplication',
    howTo: ['Select an embedding model from the dropdown.', 'Enter the number of tokens to embed.', 'See estimated cost per request instantly.'],
    faq: [
      { q: 'Which embedding models are supported?', a: 'OpenAI text-embedding models, Cohere embed, and Voyage embedding models with published pricing.' },
      { q: 'How are tokens estimated?', a: 'Enter your actual token count from your tokenizer, or use the AI token counter for text estimation.' },
      { q: 'Are prices up to date?', a: 'Based on published API pricing. Verify current rates on provider websites before budgeting.' },
      { q: 'Is my data sent to a server?', a: 'No. Cost calculation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'ai-cost-calculator', name: 'AI Cost Calculator' }, { slug: 'ai-token-calculator', name: 'AI Token Counter' }, { slug: 'context-window-calculator', name: 'AI Context Window Calculator' }],
    body: `      <div class="tool-container" style="min-height:280px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="emb-model">Model</label><select id="emb-model" class="tool-input calc-select"></select></div>
          <div class="calc-field"><label class="tool-label" for="emb-tokens">Tokens</label><input type="number" id="emb-tokens" class="tool-input" placeholder="1000" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="emb-cost">—</span><span class="tool-stat-label">Estimated cost</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
]

for (const cfg of tools) {
  const file = path.join(ROOT, `${cfg.slug}.astro`)
  fs.writeFileSync(file, page(cfg))
  console.log('Wrote', file)
}

console.log('Done:', tools.length, 'pages')
