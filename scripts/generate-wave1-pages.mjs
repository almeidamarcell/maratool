#!/usr/bin/env node
/**
 * Generates Wave 1 tool .astro pages from config.
 * Run: node scripts/generate-wave1-pages.mjs
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
    slug: 'mortgage-calculator', jsFile: 'mortgage-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'loan', subcategoryLabel: 'Loan',
    title: 'Mortgage Calculator — Monthly Payment & Amortization | maratool',
    h1: 'Mortgage Calculator — Monthly Payment & Amortization',
    breadcrumbName: 'Mortgage Calculator',
    description: 'Calculate monthly mortgage payments, total interest, and amortization schedule. Free browser-based home loan calculator.',
    shellDesc: 'Enter loan amount, interest rate, and term to see monthly payment, total interest, and amortization schedule.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter your loan amount in dollars.', 'Set the annual interest rate and loan term in years.', 'See monthly payment, total interest, and first-year amortization schedule.'],
    faq: [
      { q: 'How is monthly mortgage payment calculated?', a: 'Payment = P × [r(1+r)^n] / [(1+r)^n − 1], where P is principal, r is monthly rate, and n is number of months.' },
      { q: 'Does this include taxes and insurance?', a: 'No. This calculator shows principal and interest only. Add property tax and insurance separately for total housing cost.' },
      { q: 'Can I see the full amortization schedule?', a: 'The table shows the first 12 months. Total interest and payment reflect the full loan term.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'loan-calculator', name: 'Loan Calculator' }, { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:420px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="mc-amount">Loan amount ($)</label><input type="number" id="mc-amount" class="tool-input" placeholder="300000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="mc-rate">Interest rate (%)</label><input type="number" id="mc-rate" class="tool-input" placeholder="6.5" step="any" min="0" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="mc-years">Loan term (years)</label><input type="number" id="mc-years" class="tool-input" placeholder="30" min="1" max="50" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="mc-payment">—</span><span class="tool-stat-label">Monthly payment</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="mc-interest">—</span><span class="tool-stat-label">Total interest</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="mc-total">—</span><span class="tool-stat-label">Total payment</span></div>
        </div>
        <div id="mc-schedule" style="margin-top:1.5rem;overflow-x:auto;"></div>
      </div>`,
    styles: calcStyles + `\n<style is:global>\n  .amort-table { width:100%; border-collapse:collapse; font-size:13px; font-family:var(--font-mono); }\n  .amort-table th, .amort-table td { padding:6px 10px; border-bottom:1px solid var(--border); text-align:right; }\n  .amort-table th:first-child, .amort-table td:first-child { text-align:left; }\n</style>`,
  },
  {
    slug: 'loan-calculator', jsFile: 'loan-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'loan', subcategoryLabel: 'Loan',
    title: 'Loan Calculator — Monthly Payment & Interest | maratool',
    h1: 'Loan Calculator — Monthly Payment & Interest',
    breadcrumbName: 'Loan Calculator',
    description: 'Calculate monthly loan payments and total interest for personal, auto, or business loans. Free, instant, runs in your browser.',
    shellDesc: 'Enter loan amount, annual interest rate, and term in months to see payment and total interest.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter the loan principal amount.', 'Set the annual interest rate and term in months.', 'See monthly payment and total interest instantly.'],
    faq: [
      { q: 'What types of loans does this work for?', a: 'Any fixed-rate installment loan — personal, auto, student, or business loans with equal monthly payments.' },
      { q: 'How do I convert years to months?', a: 'Multiply years by 12. A 5-year loan = 60 months, a 3-year loan = 36 months.' },
      { q: 'What if my interest rate is 0%?', a: 'The calculator divides principal by months for zero-interest loans.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'mortgage-calculator', name: 'Mortgage Calculator' }, { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="lc-amount">Loan amount ($)</label><input type="number" id="lc-amount" class="tool-input" placeholder="20000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="lc-rate">Interest rate (%)</label><input type="number" id="lc-rate" class="tool-input" placeholder="7.5" step="any" min="0" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="lc-months">Term (months)</label><input type="number" id="lc-months" class="tool-input" placeholder="60" min="1" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="lc-payment">—</span><span class="tool-stat-label">Monthly payment</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="lc-interest">—</span><span class="tool-stat-label">Total interest</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="lc-total">—</span><span class="tool-stat-label">Total payment</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'compound-interest-calculator', jsFile: 'compound-interest-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'interest', subcategoryLabel: 'Interest',
    title: 'Compound Interest Calculator — Savings Growth | maratool',
    h1: 'Compound Interest Calculator',
    breadcrumbName: 'Compound Interest Calculator',
    description: 'Calculate compound interest with monthly contributions. See how your savings grow over time. Free, runs in your browser.',
    shellDesc: 'Enter starting balance, annual rate, years, and optional monthly contributions to see final balance and total interest earned.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter your starting principal and annual interest rate.', 'Set the investment period in years and optional monthly contribution.', 'See final balance, total contributed, and interest earned.'],
    faq: [
      { q: 'What is compound interest?', a: 'Interest calculated on both the initial principal and accumulated interest from previous periods.' },
      { q: 'How often is interest compounded?', a: 'This calculator compounds monthly (12 times per year), which is standard for savings accounts.' },
      { q: 'Does this account for taxes?', a: 'No. Results show pre-tax growth. Tax treatment depends on account type.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'cagr-calculator', name: 'CAGR Calculator' }, { slug: 'mortgage-calculator', name: 'Mortgage Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="ci-principal">Starting amount ($)</label><input type="number" id="ci-principal" class="tool-input" placeholder="10000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="ci-rate">Annual rate (%)</label><input type="number" id="ci-rate" class="tool-input" placeholder="5" step="any" min="0" /></div>
        </div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="ci-years">Years</label><input type="number" id="ci-years" class="tool-input" placeholder="10" min="1" /></div>
          <div class="calc-field"><label class="tool-label" for="ci-monthly">Monthly contribution ($)</label><input type="number" id="ci-monthly" class="tool-input" placeholder="200" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="ci-final">—</span><span class="tool-stat-label">Final balance</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="ci-contributed">—</span><span class="tool-stat-label">Total contributed</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="ci-interest">—</span><span class="tool-stat-label">Interest earned</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'cagr-calculator', jsFile: 'cagr-calculator.js',
    categorySlug: 'finance', categoryLabel: 'Finance', subcategorySlug: 'investment', subcategoryLabel: 'Investment',
    title: 'CAGR Calculator — Compound Annual Growth Rate | maratool',
    h1: 'CAGR Calculator — Compound Annual Growth Rate',
    breadcrumbName: 'CAGR Calculator',
    description: 'Calculate compound annual growth rate between two values over any time period. Free CAGR calculator, instant results.',
    shellDesc: 'Enter beginning value, ending value, and number of years to calculate CAGR percentage.',
    appCategory: 'FinanceApplication',
    howTo: ['Enter the beginning investment value.', 'Enter the ending value and number of years.', 'See CAGR percentage and total return.'],
    faq: [
      { q: 'What is CAGR?', a: 'Compound Annual Growth Rate — the smoothed annual return that takes an investment from its beginning to ending value over a period.' },
      { q: 'What is the CAGR formula?', a: 'CAGR = (Ending Value / Beginning Value)^(1/years) − 1, expressed as a percentage.' },
      { q: 'When should I use CAGR vs total return?', a: 'CAGR normalizes growth to an annual rate for comparing investments over different time periods.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'roi-calculator', name: 'ROI Calculator' }, { slug: 'compound-interest-calculator', name: 'Compound Interest Calculator' }, { slug: 'campaign-roi-calculator', name: 'Campaign ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:260px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="cagr-begin">Beginning value ($)</label><input type="number" id="cagr-begin" class="tool-input" placeholder="10000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="cagr-end">Ending value ($)</label><input type="number" id="cagr-end" class="tool-input" placeholder="25000" min="0" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="cagr-years">Years</label><input type="number" id="cagr-years" class="tool-input" placeholder="5" min="0.1" step="any" style="max-width:200px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="cagr-result">—</span><span class="tool-stat-label">CAGR</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="cagr-total-return">—</span><span class="tool-stat-label">Total return</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'profit-margin-calculator', jsFile: 'profit-margin-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Profit Margin Calculator — Gross & Net Margin | maratool',
    h1: 'Profit Margin Calculator',
    breadcrumbName: 'Profit Margin Calculator',
    description: 'Calculate gross profit, net profit, and margin percentage from revenue and costs. Free business calculator, instant results.',
    shellDesc: 'Enter revenue, cost of goods sold, and operating expenses to see gross and net profit margins.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter total revenue.', 'Enter cost of goods sold (COGS) and operating expenses.', 'See gross profit, net profit, and margin percentages.'],
    faq: [
      { q: 'What is gross margin?', a: 'Gross margin = (Revenue − COGS) / Revenue × 100. It measures profitability before operating expenses.' },
      { q: 'What is net margin?', a: 'Net margin = (Revenue − COGS − Expenses) / Revenue × 100. It is the bottom-line profit percentage.' },
      { q: 'What is a good profit margin?', a: 'Varies by industry. Software often targets 20%+ net margin; retail may be 2–5%.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'break-even-calculator', name: 'Break-even Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }, { slug: 'vat-calculator', name: 'VAT Calculator' }],
    body: `      <div class="tool-container" style="min-height:300px;">
        <div class="calc-field"><label class="tool-label" for="pm-revenue">Revenue ($)</label><input type="number" id="pm-revenue" class="tool-input" placeholder="100000" min="0" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="pm-cogs">Cost of goods sold ($)</label><input type="number" id="pm-cogs" class="tool-input" placeholder="40000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="pm-expenses">Operating expenses ($)</label><input type="number" id="pm-expenses" class="tool-input" placeholder="30000" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="pm-gross-profit">—</span><span class="tool-stat-label">Gross profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="pm-net-profit">—</span><span class="tool-stat-label">Net profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="pm-gross-margin">—</span><span class="tool-stat-label">Gross margin</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="pm-net-margin">—</span><span class="tool-stat-label">Net margin</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'break-even-calculator', jsFile: 'break-even-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'Break-even Calculator — Find Break-even Point | maratool',
    h1: 'Break-even Calculator',
    breadcrumbName: 'Break-even Calculator',
    description: 'Find your break-even point in units and revenue. Enter fixed costs, price, and variable cost per unit. Free, instant.',
    shellDesc: 'Enter fixed costs, price per unit, and variable cost per unit to find break-even units and revenue.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter total fixed costs (rent, salaries, etc.).', 'Enter price per unit and variable cost per unit.', 'See break-even units, revenue, and contribution margin.'],
    faq: [
      { q: 'What is the break-even formula?', a: 'Break-even units = Fixed Costs / (Price − Variable Cost per Unit).' },
      { q: 'What is contribution margin?', a: 'The percentage of each sale that contributes to covering fixed costs: (Price − Variable Cost) / Price × 100.' },
      { q: 'What if variable cost exceeds price?', a: 'You cannot break even — each unit sold loses money. Reduce variable costs or increase price.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'roi-calculator', name: 'ROI Calculator' }, { slug: 'campaign-roi-calculator', name: 'Campaign ROI Calculator' }],
    body: `      <div class="tool-container" style="min-height:280px;">
        <div class="calc-field"><label class="tool-label" for="be-fixed">Fixed costs ($)</label><input type="number" id="be-fixed" class="tool-input" placeholder="50000" min="0" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="be-price">Price per unit ($)</label><input type="number" id="be-price" class="tool-input" placeholder="25" min="0" step="any" /></div>
          <div class="calc-field"><label class="tool-label" for="be-variable">Variable cost per unit ($)</label><input type="number" id="be-variable" class="tool-input" placeholder="10" min="0" step="any" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="be-units">—</span><span class="tool-stat-label">Break-even units</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="be-revenue">—</span><span class="tool-stat-label">Break-even revenue</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="be-margin">—</span><span class="tool-stat-label">Contribution margin</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'vat-calculator', jsFile: 'vat-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'tax', subcategoryLabel: 'Tax',
    title: 'VAT / Sales Tax Calculator — Add or Remove Tax | maratool',
    h1: 'VAT / Sales Tax Calculator',
    breadcrumbName: 'VAT Calculator',
    description: 'Add or remove VAT and sales tax from any amount. Preset rates for US, UK, EU. Free tax calculator, runs in your browser.',
    shellDesc: 'Add or remove VAT/sales tax from any amount. Choose add or remove mode and set the tax rate.',
    appCategory: 'BusinessApplication',
    howTo: ['Choose whether to add tax to a net amount or remove tax from a gross amount.', 'Enter the amount and tax rate percentage.', 'See net, tax, and gross amounts instantly.'],
    faq: [
      { q: 'How do I add VAT to a price?', a: 'Gross = Net × (1 + rate/100). A $100 net price at 20% VAT = $120 gross.' },
      { q: 'How do I remove VAT from a price?', a: 'Net = Gross / (1 + rate/100). A $120 gross price at 20% VAT = $100 net.' },
      { q: 'What is the standard UK VAT rate?', a: '20% standard rate. Reduced rate is 5% for some goods. Always verify current rates.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'salary-converter', name: 'Salary Converter' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:280px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="vat-mode">Mode</label><select id="vat-mode" class="tool-input calc-select"><option value="add">Add tax to net amount</option><option value="remove">Remove tax from gross</option></select></div>
          <div class="calc-field"><label class="tool-label" for="vat-rate">Tax rate (%)</label><input type="number" id="vat-rate" class="tool-input" placeholder="20" min="0" step="any" /></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="vat-amount">Amount ($)</label><input type="number" id="vat-amount" class="tool-input" placeholder="100" min="0" step="any" style="max-width:240px;" /></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="vat-net">—</span><span class="tool-stat-label">Net amount</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="vat-tax">—</span><span class="tool-stat-label">Tax amount</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="vat-gross">—</span><span class="tool-stat-label">Gross amount</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'salary-converter', jsFile: 'salary-converter.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'pay', subcategoryLabel: 'Pay',
    title: 'Salary Converter — Annual, Monthly, Hourly | maratool',
    h1: 'Salary Converter — Annual, Monthly, Hourly',
    breadcrumbName: 'Salary Converter',
    description: 'Convert salary between annual, monthly, bi-weekly, weekly, daily, and hourly rates. Free salary calculator online.',
    shellDesc: 'Enter annual salary and work schedule to see equivalent monthly, weekly, daily, and hourly rates.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your annual salary.', 'Adjust hours per week and weeks per year if non-standard.', 'See all pay period equivalents instantly.'],
    faq: [
      { q: 'How do I convert annual salary to hourly?', a: 'Hourly = Annual Salary / (Hours per Week × Weeks per Year). Default: 40 hours × 52 weeks = 2,080 hours.' },
      { q: 'What weeks per year should I use?', a: '52 for full-time. Use 50 if you account for 2 weeks unpaid vacation.' },
      { q: 'Does this include taxes or benefits?', a: 'No. This is gross pay conversion only, before deductions.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'vat-calculator', name: 'VAT Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'percentage-calculator', name: 'Percentage Calculator' }],
    body: `      <div class="tool-container" style="min-height:320px;">
        <div class="calc-field"><label class="tool-label" for="sc-annual">Annual salary ($)</label><input type="number" id="sc-annual" class="tool-input" placeholder="75000" min="0" style="max-width:240px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="sc-hours">Hours per week</label><input type="number" id="sc-hours" class="tool-input" value="40" min="1" /></div>
          <div class="calc-field"><label class="tool-label" for="sc-weeks">Weeks per year</label><input type="number" id="sc-weeks" class="tool-input" value="52" min="1" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="sc-monthly">—</span><span class="tool-stat-label">Monthly</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sc-biweekly">—</span><span class="tool-stat-label">Bi-weekly</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sc-weekly">—</span><span class="tool-stat-label">Weekly</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sc-daily">—</span><span class="tool-stat-label">Daily</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="sc-hourly">—</span><span class="tool-stat-label">Hourly</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'roi-calculator', jsFile: 'roi-calculator.js',
    categorySlug: 'business', categoryLabel: 'Business', subcategorySlug: 'calculator', subcategoryLabel: 'Calculator',
    title: 'ROI Calculator — Return on Investment | maratool',
    h1: 'ROI Calculator — Return on Investment',
    breadcrumbName: 'ROI Calculator',
    description: 'Calculate return on investment percentage from initial cost and final value. Free ROI calculator, instant results in your browser.',
    shellDesc: 'Enter initial investment and final value to calculate profit and ROI percentage.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your initial investment or cost.', 'Enter the final or current value.', 'See profit and ROI percentage instantly.'],
    faq: [
      { q: 'What is the ROI formula?', a: 'ROI = (Final Value − Initial Cost) / Initial Cost × 100.' },
      { q: 'How is this different from campaign ROI?', a: 'This is a general investment ROI calculator. The campaign ROI tool is specific to marketing ad spend.' },
      { q: 'Can ROI be negative?', a: 'Yes. A negative ROI means you lost money on the investment.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'cagr-calculator', name: 'CAGR Calculator' }, { slug: 'campaign-roi-calculator', name: 'Campaign ROI Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }],
    body: `      <div class="tool-container" style="min-height:240px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="roi-initial">Initial cost ($)</label><input type="number" id="roi-initial" class="tool-input" placeholder="10000" min="0" /></div>
          <div class="calc-field"><label class="tool-label" for="roi-final">Final value ($)</label><input type="number" id="roi-final" class="tool-input" placeholder="15000" min="0" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="roi-profit">—</span><span class="tool-stat-label">Profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="roi-pct">—</span><span class="tool-stat-label">ROI</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'amazon-fee-calculator', jsFile: 'amazon-fee-calculator.js',
    categorySlug: 'e-commerce', categoryLabel: 'E-commerce', subcategorySlug: 'fees', subcategoryLabel: 'Fees',
    title: 'Amazon Seller Fee Calculator — FBA & Referral Fees | maratool',
    h1: 'Amazon Seller Fee Calculator',
    breadcrumbName: 'Amazon Fee Calculator',
    description: 'Estimate Amazon referral fees, FBA fees, and net profit per sale. Free Amazon seller fee calculator, runs in your browser.',
    shellDesc: 'Enter sale price, product category, and fulfillment method to estimate Amazon fees and net profit.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your product sale price.', 'Select product category and fulfillment method (FBA or FBM).', 'See referral fee, FBA fee, total fees, and net profit.'],
    faq: [
      { q: 'What are Amazon referral fees?', a: 'A percentage of the sale price charged per category — typically 8–17% depending on product type.' },
      { q: 'What is FBA?', a: 'Fulfillment by Amazon — Amazon stores, packs, and ships your products. FBA fees cover storage and fulfillment.' },
      { q: 'Are these fees exact?', a: 'These are estimates based on published rate tables. Actual fees may vary by size tier and season.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'etsy-fee-calculator', name: 'Etsy Fee Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'barcode-generator', name: 'Barcode Generator' }],
    body: `      <div class="tool-container" style="min-height:340px;">
        <div class="calc-field"><label class="tool-label" for="amz-price">Sale price ($)</label><input type="number" id="amz-price" class="tool-input" placeholder="29.99" min="0" step="any" style="max-width:200px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="amz-category">Category</label><select id="amz-category" class="tool-input calc-select"><option value="default">General (15%)</option><option value="electronics">Electronics (8%)</option><option value="clothing">Clothing (17%)</option><option value="books">Books (15%)</option><option value="beauty">Beauty (15%)</option></select></div>
          <div class="calc-field"><label class="tool-label" for="amz-fulfillment">Fulfillment</label><select id="amz-fulfillment" class="tool-input calc-select"><option value="fba">FBA</option><option value="fbm">FBM (no FBA fee)</option></select></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="amz-referral">—</span><span class="tool-stat-label">Referral fee</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="amz-fba">—</span><span class="tool-stat-label">FBA fee</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="amz-total">—</span><span class="tool-stat-label">Total fees</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="amz-net">—</span><span class="tool-stat-label">Net profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="amz-margin">—</span><span class="tool-stat-label">Margin</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'etsy-fee-calculator', jsFile: 'etsy-fee-calculator.js',
    categorySlug: 'e-commerce', categoryLabel: 'E-commerce', subcategorySlug: 'fees', subcategoryLabel: 'Fees',
    title: 'Etsy Fee Calculator — Seller Fees & Net Profit | maratool',
    h1: 'Etsy Fee Calculator',
    breadcrumbName: 'Etsy Fee Calculator',
    description: 'Calculate Etsy listing, transaction, and payment processing fees. See net profit per sale. Free Etsy seller fee calculator.',
    shellDesc: 'Enter sale price and shipping to calculate Etsy listing, transaction, payment fees, and net profit.',
    appCategory: 'BusinessApplication',
    howTo: ['Enter your item sale price.', 'Enter shipping amount charged to buyer (if any).', 'See all Etsy fees and net profit per sale.'],
    faq: [
      { q: 'What fees does Etsy charge?', a: '$0.20 listing fee, 6.5% transaction fee on item + shipping, and ~3% + $0.25 payment processing.' },
      { q: 'Is the listing fee per sale or per listing?', a: 'Per listing, charged when you publish. Renewed every 4 months or on sale.' },
      { q: 'Are these fees current?', a: 'Based on published Etsy fee structure. Always verify on Etsy seller help for latest rates.' },
      { q: 'Is my data sent to a server?', a: 'No. All calculations happen in your browser.' },
    ],
    relatedTools: [{ slug: 'amazon-fee-calculator', name: 'Amazon Fee Calculator' }, { slug: 'profit-margin-calculator', name: 'Profit Margin Calculator' }, { slug: 'barcode-generator', name: 'Barcode Generator' }],
    body: `      <div class="tool-container" style="min-height:340px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="etsy-price">Sale price ($)</label><input type="number" id="etsy-price" class="tool-input" placeholder="35" min="0" step="any" /></div>
          <div class="calc-field"><label class="tool-label" for="etsy-shipping">Shipping ($)</label><input type="number" id="etsy-shipping" class="tool-input" placeholder="5" min="0" step="any" /></div>
        </div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-listing">—</span><span class="tool-stat-label">Listing fee</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-transaction">—</span><span class="tool-stat-label">Transaction fee</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-payment">—</span><span class="tool-stat-label">Payment processing</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-total">—</span><span class="tool-stat-label">Total fees</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-net">—</span><span class="tool-stat-label">Net profit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="etsy-margin">—</span><span class="tool-stat-label">Margin</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
]

// Developer + Text + Converter tools appended in second batch
const devTools = [
  {
    slug: 'sql-formatter', jsFile: 'sql-formatter.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'sql', subcategoryLabel: 'SQL',
    title: 'SQL Formatter — Beautify SQL Online | maratool',
    h1: 'SQL Formatter — Beautify SQL Online',
    breadcrumbName: 'SQL Formatter',
    description: 'Format and beautify SQL queries instantly. Paste messy SQL and get indented, readable output. Free, runs in your browser.',
    shellDesc: 'Paste SQL and get formatted output with proper indentation and line breaks.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste your SQL query in the input box.', 'Formatted output updates automatically.', 'Click Copy to copy the formatted SQL.'],
    faq: [
      { q: 'Does this validate SQL syntax?', a: 'It formats SQL for readability but does not validate against a specific database dialect.' },
      { q: 'Which SQL dialects are supported?', a: 'Standard SQL keywords (SELECT, FROM, WHERE, JOIN, etc.) are recognized for formatting.' },
      { q: 'Is my SQL sent to a server?', a: 'No. Formatting happens entirely in your browser.' },
      { q: 'Can I format stored procedures?', a: 'Yes. Paste any SQL text — the formatter adds line breaks before major keywords.' },
    ],
    relatedTools: [{ slug: 'json-formatter', name: 'JSON Formatter' }, { slug: 'curl-generator', name: 'cURL Generator' }, { slug: 'regex-tester', name: 'Regex Tester' }],
    body: `      <div class="tool-container" style="min-height:400px;">
        <label class="tool-label" for="sql-input">SQL input</label>
        <textarea id="sql-input" class="tool-textarea" rows="8" placeholder="SELECT id, name FROM users WHERE active = 1 ORDER BY name"></textarea>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">Formatted output</label>
          <button type="button" id="sql-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="sql-output" class="tool-output" style="min-height:120px;white-space:pre-wrap;"></pre>
      </div>`,
  },
  {
    slug: 'curl-generator', jsFile: 'curl-generator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'api', subcategoryLabel: 'API',
    title: 'cURL Command Generator — Build HTTP Requests | maratool',
    h1: 'cURL Command Generator',
    breadcrumbName: 'cURL Generator',
    description: 'Build cURL commands from URL, method, headers, and body. Copy-ready curl for any HTTP request. Free, runs in your browser.',
    shellDesc: 'Fill in URL, HTTP method, headers, and body to generate a copy-ready cURL command.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter the request URL and select HTTP method.', 'Add headers (one per line, Key: Value format) and optional body.', 'Copy the generated cURL command.'],
    faq: [
      { q: 'Does this send the request?', a: 'No. This only generates the cURL command string. Run it in your terminal to execute.' },
      { q: 'How do I add headers?', a: 'One header per line in Key: Value format, e.g. Content-Type: application/json' },
      { q: 'Can I generate POST requests?', a: 'Yes. Select POST/PUT/PATCH and enter a request body.' },
      { q: 'Is my data sent to a server?', a: 'No. Command generation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'jwt-decoder', name: 'JWT Decoder' }, { slug: 'sql-formatter', name: 'SQL Formatter' }, { slug: 'api-key-generator', name: 'API Key Generator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="curl-url">URL</label><input type="url" id="curl-url" class="tool-input" placeholder="https://api.example.com/users" /></div>
          <div class="calc-field"><label class="tool-label" for="curl-method">Method</label><select id="curl-method" class="tool-input calc-select"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
        </div>
        <div class="calc-field"><label class="tool-label" for="curl-headers">Headers (one per line)</label><textarea id="curl-headers" class="tool-textarea" rows="3" placeholder="Content-Type: application/json&#10;Authorization: Bearer token"></textarea></div>
        <div class="calc-field"><label class="tool-label" for="curl-body">Body</label><textarea id="curl-body" class="tool-textarea" rows="4" placeholder='{"key": "value"}'></textarea></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <label class="tool-label" style="margin:0;">Generated cURL</label>
          <button type="button" id="curl-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="curl-output" class="tool-output" style="min-height:80px;white-space:pre-wrap;font-family:var(--font-mono);font-size:13px;"></pre>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'password-strength-checker', jsFile: 'password-strength-checker.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'Password Strength Checker — How Strong Is My Password? | maratool',
    h1: 'Password Strength Checker',
    breadcrumbName: 'Password Strength Checker',
    description: 'Check password strength with entropy scoring and crack-time estimates. See what makes a password weak or strong. Free, runs locally.',
    shellDesc: 'Type a password to see strength score, estimated crack time, and improvement tips.',
    appCategory: 'DeveloperApplication',
    howTo: ['Type or paste a password in the input field.', 'See strength score and estimated crack time update instantly.', 'Follow the tips to improve weak passwords.'],
    faq: [
      { q: 'Is my password sent to a server?', a: 'No. Strength checking runs entirely in your browser. Your password never leaves your device.' },
      { q: 'What makes a password strong?', a: 'Length (12+ chars), mixed case, numbers, special characters, and avoiding common passwords.' },
      { q: 'How is crack time estimated?', a: 'Based on password entropy — character set size and length — not actual breach data.' },
      { q: 'Should I use this instead of a password manager?', a: 'Use a password manager to generate and store passwords. Use this tool to evaluate passwords you create manually.' },
    ],
    relatedTools: [{ slug: 'password-generator', name: 'Password Generator' }, { slug: 'bcrypt-generator', name: 'Bcrypt Generator' }, { slug: 'hash-generator', name: 'Hash Generator' }],
    body: `      <div class="tool-container" style="min-height:280px;">
        <div class="calc-field"><label class="tool-label" for="pw-input">Password</label><input type="text" id="pw-input" class="tool-input" placeholder="Enter password to check" autocomplete="off" /></div>
        <div style="height:6px;background:var(--bg-soft);border-radius:3px;margin:1rem 0;overflow:hidden;"><div id="pw-bar" style="height:100%;width:0;transition:width 0.2s,background 0.2s;border-radius:3px;"></div></div>
        <p id="pw-label" style="font-weight:600;margin:0 0 0.25rem;">—</p>
        <p id="pw-crack" style="font-size:13px;color:var(--text-2);margin:0 0 1rem;">—</p>
        <ul id="pw-tips" style="font-size:13px;color:var(--text-2);padding-left:1.25rem;margin:0;"></ul>
      </div>`,
  },
  {
    slug: 'hmac-generator', jsFile: 'hmac-generator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'security', subcategoryLabel: 'Security',
    title: 'HMAC Generator — SHA-256 & SHA-512 Online | maratool',
    h1: 'HMAC Generator — SHA-256 & SHA-512',
    breadcrumbName: 'HMAC Generator',
    description: 'Generate HMAC signatures with SHA-256, SHA-384, or SHA-512. Enter message and secret key — runs in your browser.',
    shellDesc: 'Enter a message and secret key to generate an HMAC signature using Web Crypto API.',
    appCategory: 'DeveloperApplication',
    howTo: ['Enter the message to sign.', 'Enter your secret key and select hash algorithm.', 'Copy the generated HMAC hex digest.'],
    faq: [
      { q: 'What is HMAC?', a: 'Hash-based Message Authentication Code — a signature that verifies both data integrity and authenticity using a shared secret key.' },
      { q: 'Which algorithm should I use?', a: 'SHA-256 is the most common. Use SHA-512 for higher security margins in new systems.' },
      { q: 'Is my secret key sent to a server?', a: 'No. HMAC is computed entirely in your browser using the Web Crypto API.' },
      { q: 'What encoding is the output?', a: 'Lowercase hexadecimal string, which is standard for HMAC digests.' },
    ],
    relatedTools: [{ slug: 'hash-generator', name: 'Hash Generator' }, { slug: 'bcrypt-generator', name: 'Bcrypt Generator' }, { slug: 'api-key-generator', name: 'API Key Generator' }],
    body: `      <div class="tool-container" style="min-height:320px;">
        <div class="calc-field"><label class="tool-label" for="hmac-message">Message</label><textarea id="hmac-message" class="tool-textarea" rows="3" placeholder="Message to sign"></textarea></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="hmac-secret">Secret key</label><input type="text" id="hmac-secret" class="tool-input" placeholder="your-secret-key" autocomplete="off" /></div>
          <div class="calc-field"><label class="tool-label" for="hmac-algo">Algorithm</label><select id="hmac-algo" class="tool-input calc-select"><option value="SHA-256">SHA-256</option><option value="SHA-384">SHA-384</option><option value="SHA-512">SHA-512</option></select></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:1rem 0 0.5rem;">
          <label class="tool-label" style="margin:0;">HMAC output</label>
          <button type="button" id="hmac-copy" class="copy-btn">Copy</button>
        </div>
        <pre id="hmac-output" class="tool-output" style="min-height:48px;word-break:break-all;font-family:var(--font-mono);font-size:13px;">—</pre>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'context-window-calculator', jsFile: 'context-window-calculator.js',
    categorySlug: 'developer', categoryLabel: 'Developer', subcategorySlug: 'ai', subcategoryLabel: 'AI',
    title: 'AI Context Window Calculator — Token Limit Usage | maratool',
    h1: 'AI Context Window Calculator',
    breadcrumbName: 'Context Window Calculator',
    description: 'See how much of a model context window your text uses. Compare GPT-4o, Claude, and Gemini token limits. Free, instant.',
    shellDesc: 'Paste text and select a model to see token count, context window usage, and remaining capacity.',
    appCategory: 'DeveloperApplication',
    howTo: ['Select the AI model to check against.', 'Paste your prompt or text.', 'See token count, usage percentage, and remaining context.'],
    faq: [
      { q: 'How are tokens estimated?', a: 'Approximately 4 characters per token for English text — same heuristic as our AI token counter.' },
      { q: 'What happens if I exceed the context window?', a: 'The API will reject the request or truncate input. Stay under 80% for safety margin.' },
      { q: 'Are context limits accurate?', a: 'Limits reflect published model specs. Providers may update limits — verify on official docs.' },
      { q: 'Is my text sent to a server?', a: 'No. Token estimation happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'ai-token-calculator', name: 'AI Token Counter' }, { slug: 'ai-cost-calculator', name: 'AI Cost Calculator' }, { slug: 'reading-time', name: 'Reading Time Calculator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <div class="calc-field"><label class="tool-label" for="cw-model">Model</label><select id="cw-model" class="tool-input calc-select"></select></div>
        <div class="calc-field"><label class="tool-label" for="cw-text">Text</label><textarea id="cw-text" class="tool-textarea" rows="8" placeholder="Paste your prompt or document here..."></textarea></div>
        <div style="height:8px;background:var(--bg-soft);border-radius:4px;margin:1rem 0;overflow:hidden;"><div id="cw-bar" style="height:100%;width:0;transition:width 0.2s;background:var(--accent);border-radius:4px;"></div></div>
        <div class="tool-stats">
          <div class="tool-stat"><span class="tool-stat-value" id="cw-tokens">0</span><span class="tool-stat-label">Tokens used</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="cw-limit">—</span><span class="tool-stat-label">Context limit</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="cw-pct">0%</span><span class="tool-stat-label">Usage</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="cw-remain">—</span><span class="tool-stat-label">Remaining</span></div>
        </div>
      </div>`,
    styles: calcStyles,
  },
  {
    slug: 'word-counter', jsFile: 'word-counter.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'analyze', subcategoryLabel: 'Analyze',
    title: 'Word Counter & Character Counter Online | maratool',
    h1: 'Word Counter & Character Counter',
    breadcrumbName: 'Word Counter',
    description: 'Count words, characters, sentences, and paragraphs in real time. Paste or type any text. Free word counter online.',
    shellDesc: 'Paste or type text to see word count, character count, sentences, and paragraphs update in real time.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste or type your text in the input area.', 'Counts update automatically as you type.', 'Use counts for essays, tweets, meta descriptions, or SEO content.'],
    faq: [
      { q: 'How are words counted?', a: 'Words are separated by whitespace. "Hello world" = 2 words. Hyphenated words count as one.' },
      { q: 'What is the difference between characters and characters without spaces?', a: 'Characters includes spaces and punctuation. Without spaces excludes all whitespace.' },
      { q: 'How are sentences counted?', a: 'Split on sentence-ending punctuation (. ! ?). Imperfect for abbreviations but useful for estimates.' },
      { q: 'Is my text sent to a server?', a: 'No. Counting happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'reading-time', name: 'Reading Time Calculator' }, { slug: 'diff-checker', name: 'Diff Checker' }, { slug: 'lorem-ipsum', name: 'Lorem Ipsum Generator' }],
    body: `      <div class="tool-container" style="min-height:360px;">
        <textarea id="wc-input" class="tool-textarea" rows="10" placeholder="Paste or type your text here..."></textarea>
        <div class="tool-stats" style="margin-top:1rem;">
          <div class="tool-stat"><span class="tool-stat-value" id="wc-words">0</span><span class="tool-stat-label">Words</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wc-chars">0</span><span class="tool-stat-label">Characters</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wc-chars-ns">0</span><span class="tool-stat-label">Chars (no spaces)</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wc-sentences">0</span><span class="tool-stat-label">Sentences</span></div>
          <div class="tool-stat"><span class="tool-stat-value" id="wc-paragraphs">0</span><span class="tool-stat-label">Paragraphs</span></div>
        </div>
      </div>`,
  },
  {
    slug: 'text-line-tools', jsFile: 'text-line-tools.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'transform', subcategoryLabel: 'Transform',
    title: 'Sort, Dedupe & Convert Text Lines Online | maratool',
    h1: 'Sort, Dedupe & Convert Text Lines',
    breadcrumbName: 'Text Line Tools',
    description: 'Sort lines alphabetically, remove duplicates, randomize order, and convert case. All text line transforms in one place.',
    shellDesc: 'Paste text lines and apply sort, deduplicate, randomize, or case conversion transforms.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Paste your text (one item per line) in the input box.', 'Click a transform button — sort, dedupe, randomize, or change case.', 'Copy the result from the output box.'],
    faq: [
      { q: 'Does sort preserve blank lines?', a: 'Yes. Blank lines are included in sorting (empty strings sort first).' },
      { q: 'How does deduplicate work?', a: 'Removes exact duplicate lines, keeping the first occurrence. Case-sensitive.' },
      { q: 'What does title case do?', a: 'Capitalizes the first letter of each word on every line.' },
      { q: 'Is my text sent to a server?', a: 'No. All transforms happen in your browser.' },
    ],
    relatedTools: [{ slug: 'word-counter', name: 'Word Counter' }, { slug: 'diff-checker', name: 'Diff Checker' }, { slug: 'reading-time', name: 'Reading Time Calculator' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <label class="tool-label" for="tlt-input">Input</label>
        <textarea id="tlt-input" class="tool-textarea" rows="8" placeholder="One line per item..."></textarea>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin:1rem 0;">
          <button type="button" class="tool-button" data-action="sort-asc">Sort A→Z</button>
          <button type="button" class="tool-button" data-action="sort-desc">Sort Z→A</button>
          <button type="button" class="tool-button" data-action="dedup">Remove duplicates</button>
          <button type="button" class="tool-button" data-action="random">Randomize</button>
          <button type="button" class="tool-button" data-action="upper">UPPERCASE</button>
          <button type="button" class="tool-button" data-action="lower">lowercase</button>
          <button type="button" class="tool-button" data-action="title">Title Case</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
          <label class="tool-label" style="margin:0;">Output</label>
          <button type="button" id="tlt-copy" class="copy-btn">Copy</button>
        </div>
        <textarea id="tlt-output" class="tool-textarea" rows="8" readonly></textarea>
      </div>`,
  },
  {
    slug: 'json-diff', jsFile: 'json-diff.js',
    categorySlug: 'text', categoryLabel: 'Text', subcategorySlug: 'analyze', subcategoryLabel: 'Analyze',
    title: 'JSON Diff — Compare Two JSON Objects Online | maratool',
    h1: 'JSON Diff — Compare Two JSON Objects',
    breadcrumbName: 'JSON Diff',
    description: 'Compare two JSON documents and highlight added, removed, and changed keys. Free JSON diff tool, runs in your browser.',
    shellDesc: 'Paste two JSON objects and click Compare to see added, removed, and changed keys highlighted.',
    appCategory: 'DeveloperApplication',
    howTo: ['Paste the original JSON in the left box.', 'Paste the modified JSON in the right box.', 'Click Compare to see differences highlighted.'],
    faq: [
      { q: 'How does JSON diff work?', a: 'Flattens nested objects to dot-notation paths and compares values. Arrays are compared as JSON strings.' },
      { q: 'Does it validate JSON?', a: 'Yes. Invalid JSON shows an error message instead of a diff.' },
      { q: 'Is this the same as text diff?', a: 'No. This is semantic JSON diff by key path, not line-by-line text diff. Use diff-checker for raw text.' },
      { q: 'Is my JSON sent to a server?', a: 'No. Comparison happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'diff-checker', name: 'Diff Checker' }, { slug: 'json-formatter', name: 'JSON Formatter' }, { slug: 'yaml-to-json', name: 'YAML to JSON' }],
    body: `      <div class="tool-container" style="min-height:480px;">
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="jd-left">Original JSON</label><textarea id="jd-left" class="tool-textarea" rows="10" placeholder='{"name": "Alice", "age": 30}'></textarea></div>
          <div class="calc-field"><label class="tool-label" for="jd-right">Modified JSON</label><textarea id="jd-right" class="tool-textarea" rows="10" placeholder='{"name": "Alice", "age": 31}'></textarea></div>
        </div>
        <button type="button" id="jd-compare" class="tool-button" style="margin-bottom:1rem;">Compare</button>
        <div id="jd-output" class="tool-output" style="min-height:120px;font-family:var(--font-mono);font-size:13px;"></div>
      </div>`,
    styles: calcStyles + `\n<style is:global>\n  .jd-line { padding:4px 8px; border-radius:4px; margin-bottom:2px; }\n  .jd-added { background:#f0fff4; color:#276749; }\n  .jd-removed { background:#fff5f5; color:#c53030; }\n  .jd-changed { background:#fffbeb; color:#b45309; }\n  .jd-equal { color:var(--text-3); }\n  .jd-stats { font-size:13px; color:var(--text-2); margin-bottom:0.75rem; }\n  .jd-error { color:#c53030; }\n</style>`,
  },
  {
    slug: 'timezone-converter', jsFile: 'timezone-converter.js',
    categorySlug: 'converter', categoryLabel: 'Converter', subcategorySlug: 'unit', subcategoryLabel: 'Unit',
    title: 'Time Zone Converter — Convert Time Between Zones | maratool',
    h1: 'Time Zone Converter',
    breadcrumbName: 'Time Zone Converter',
    description: 'Convert date and time between time zones instantly. Compare any two IANA time zones. Free, runs in your browser.',
    shellDesc: 'Pick a date/time and two time zones to see the equivalent time in each zone.',
    appCategory: 'UtilitiesApplication',
    howTo: ['Select the date and time to convert.', 'Choose source and destination time zones.', 'See the converted time in both zones instantly.'],
    faq: [
      { q: 'Which time zones are supported?', a: 'All IANA time zones supported by your browser via the Intl API — 400+ zones worldwide.' },
      { q: 'Does this handle daylight saving time?', a: 'Yes. The browser Intl API automatically applies DST rules for the selected date.' },
      { q: 'What is the default time zone?', a: 'Your browser detected local time zone is pre-selected as the source.' },
      { q: 'Is my data sent to a server?', a: 'No. Conversion happens entirely in your browser.' },
    ],
    relatedTools: [{ slug: 'unix-timestamp', name: 'Unix Timestamp Converter' }, { slug: 'cron-expression', name: 'Cron Expression Builder' }, { slug: 'unit-converter', name: 'Unit Converter' }],
    body: `      <div class="tool-container" style="min-height:320px;">
        <div class="calc-field"><label class="tool-label" for="tz-datetime">Date & time</label><input type="datetime-local" id="tz-datetime" class="tool-input" style="max-width:280px;" /></div>
        <div class="calc-row">
          <div class="calc-field"><label class="tool-label" for="tz-from">From time zone</label><select id="tz-from" class="tool-input calc-select"></select></div>
          <div class="calc-field"><label class="tool-label" for="tz-to">To time zone</label><select id="tz-to" class="tool-input calc-select"></select></div>
        </div>
        <div id="tz-result" style="margin-top:1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;"></div>
      </div>`,
    styles: calcStyles + `\n<style is:global>\n  .tz-row { font-size:14px; line-height:1.5; }\n  .tz-arrow { font-size:1.5rem; color:var(--text-3); }\n</style>`,
  },
]

for (const cfg of [...tools, ...devTools]) {
  const file = path.join(ROOT, `${cfg.slug}.astro`)
  fs.writeFileSync(file, page(cfg))
  console.log('Wrote', file)
}

console.log('Done:', tools.length + devTools.length, 'pages')
