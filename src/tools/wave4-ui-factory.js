/** Shared copy helper for wave4 tools */
export function bindCopy(btn, getText) {
  if (!btn) return
  btn.addEventListener('click', async function () {
    const text = getText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      const orig = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(() => { btn.textContent = orig }, 2000)
    } catch { /* ignore */ }
  })
}

export function showErr(el, msg) {
  if (!el) return
  if (msg) { el.textContent = msg; el.hidden = false }
  else { el.textContent = ''; el.hidden = true }
}

export async function loadJsYaml() {
  if (window.jsyaml) return window.jsyaml
  await new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js'
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
  return window.jsyaml
}

const CORE_LOADERS = {
  'wave4-business-ext-core': () => import('./wave4-business-ext-core.js'),
  'wave4-finance-ext-core': () => import('./wave4-finance-ext-core.js'),
  'wave4-ai-ext-core': () => import('./wave4-ai-ext-core.js'),
  'wave4-sql-ext-core': () => import('./wave4-sql-ext-core.js'),
  'wave4-api-ext-core': () => import('./wave4-api-ext-core.js'),
  'wave4-security-ext-core': () => import('./wave4-security-ext-core.js'),
  'wave4-date-ext-core': () => import('./wave4-date-ext-core.js'),
  'wave4-csv-ext-core': () => import('./wave4-csv-ext-core.js'),
  'wave4-html-ext-core': () => import('./wave4-html-ext-core.js'),
  'wave4-ecommerce-ext-core': () => import('./wave4-ecommerce-ext-core.js'),
  'wave4-social-ext-core': () => import('./wave4-social-ext-core.js'),
  'wave4-data-ext-core': () => import('./wave4-data-ext-core.js'),
  'wave4-education-ext-core': () => import('./wave4-education-ext-core.js'),
}

const UI_INIT = {
  'textarea-io': initTextareaIo,
  'prompt-diff': initPromptDiff,
  'prompt-version': initPromptVersion,
  'html-preview': initHtmlPreview,
  'svg-editor': initSvgEditor,
  'csv-diff': initCsvDiff,
  'excel-to-csv': initExcelToCsv,
  'csv-to-excel': initCsvToExcel,
  'invoice-number': initInvoiceNumber,
  'purchase-order': initPurchaseOrder,
  'business-names': initBusinessNames,
  'currency-margin': initCurrencyMargin,
  'dcf': initDcf,
  'position-size': initPositionSize,
  'crypto-profit': initCryptoProfit,
  'vision-tokens': initVisionTokens,
  'json-schema-gen': initJsonSchemaGen,
  'ai-output': initAiOutput,
  'sql-query': initSqlQuery,
  'csv-to-sql': initCsvToSql,
  'er-diagram': initErDiagram,
  'mongo-sql': initMongoSql,
  'http-request': initHttpRequest,
  'mock-response': initMockResponse,
  'webhook-inspector': initWebhookInspector,
  'hash-compare': initHashCompare,
  'checksum': initChecksum,
  'cert-decode': initCertDecode,
  'csr-generator': initCsrGenerator,
  'pem-decode': initPemDecode,
  'cert-expiry': initCertExpiry,
  'business-days': initBusinessDays,
  'working-hours': initWorkingHours,
  'countdown': initCountdown,
  'delimiter': initDelimiter,
  'column-mapper': initColumnMapper,
  'html-validator': initHtmlValidator,
  'css-grid': initCssGrid,
  'flexbox': initFlexbox,
  'shipping': initShipping,
  'sku': initSku,
  'youtube-timestamp': initYoutubeTimestamp,
  'xml-validator': initXmlValidator,
  'yaml-validator': initYamlValidator,
  'xml-formatter': initXmlFormatter,
  'json-flatten': initJsonFlatten,
  'json-path': initJsonPath,
  'citation': initCitation,
  'apa-mla': initApaMla,
  'roman': initRoman,
}

export async function initWave4Tool(slug, ui, coreName, fnName) {
  const coreMod = await CORE_LOADERS[coreName]()
  const fn = coreMod[fnName]
  const init = UI_INIT[ui] || initGenericRoot
  init({ slug, fn, coreMod })
}

function initTextareaIo({ fn }) {
  const input = document.getElementById('w4-in')
  const out = document.getElementById('w4-out')
  const err = document.getElementById('w4-err')
  const copy = document.getElementById('w4-copy')
  if (!input || !out) return
  function update() {
    try {
      const r = fn(input.value)
      if (r && typeof r === 'object' && ('error' in r || 'sql' in r || 'csv' in r || 'json' in r || 'schema' in r)) {
        const text = r.sql ?? r.csv ?? r.json ?? r.output ?? (r.schema ? JSON.stringify(r.schema, null, 2) : '') ?? (r.result ? JSON.stringify(r.result, null, 2) : '')
        out.textContent = text || ''
        showErr(err, r.error || '')
        return
      }
      out.textContent = typeof r === 'string' ? r : JSON.stringify(r, null, 2)
      showErr(err, '')
    } catch (e) { showErr(err, e.message) }
  }
  input.addEventListener('input', update)
  bindCopy(copy, () => out.textContent)
  update()
}

function initPromptDiff({ fn }) {
  const a = document.getElementById('w4-a')
  const b = document.getElementById('w4-b')
  const out = document.getElementById('w4-out')
  function update() {
    const lines = fn(a.value, b.value)
    out.innerHTML = lines.map(l => {
      const cls = l.type === 'added' ? 'diff-add' : l.type === 'removed' ? 'diff-remove' : ''
      const prefix = l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  '
      return `<div class="${cls}">${prefix}${escapeHtml(l.text)}</div>`
    }).join('')
  }
  ;[a, b].forEach(el => el.addEventListener('input', update))
  update()
}

function initPromptVersion({ coreMod }) {
  initPromptDiff({ fn: coreMod.promptVersionCompare })
  const a = document.getElementById('w4-a')
  const b = document.getElementById('w4-b')
  const out = document.getElementById('w4-out')
  function update() {
    const r = coreMod.promptVersionCompare(a.value, b.value)
    const stats = `Added: ${r.added} | Removed: ${r.removed} | Unchanged: ${r.unchanged}\n\n`
    out.innerHTML = stats + r.lines.map(l => {
      const cls = l.type === 'added' ? 'diff-add' : l.type === 'removed' ? 'diff-remove' : ''
      return `<div class="${cls}">${l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' '} ${escapeHtml(l.text)}</div>`
    }).join('')
  }
  ;[a, b].forEach(el => el.addEventListener('input', update))
  update()
}

function initHtmlPreview({ fn }) {
  const input = document.getElementById('w4-in')
  const frame = document.getElementById('w4-preview')
  function update() { frame.srcdoc = fn(input.value) }
  input.addEventListener('input', update)
  update()
}

function initSvgEditor({ fn }) {
  const input = document.getElementById('w4-in')
  const frame = document.getElementById('w4-preview')
  const err = document.getElementById('w4-err')
  function update() {
    const r = fn(input.value)
    showErr(err, r.error)
    if (!r.error) frame.srcdoc = r.svg
  }
  input.addEventListener('input', update)
}

function initCsvDiff({ fn }) {
  const a = document.getElementById('w4-a')
  const b = document.getElementById('w4-b')
  const out = document.getElementById('w4-out')
  function update() {
    const r = fn(a.value, b.value)
    out.textContent = r.lines.map(l => `${l.type.toUpperCase()} line ${l.line}: ${l.text}`).join('\n')
  }
  ;[a, b].forEach(el => el.addEventListener('input', update))
}

function initExcelToCsv({ coreMod }) {
  const file = document.getElementById('w4-file')
  const input = document.getElementById('w4-in')
  const out = document.getElementById('w4-out')
  const copy = document.getElementById('w4-copy')
  async function parseXlsx(buf) {
    const { excelHtmlToCsv } = coreMod
    const bytes = new Uint8Array(buf)
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
      const html = await xlsxToHtmlTable(buf)
      out.textContent = excelHtmlToCsv(html)
      return
    }
    out.textContent = new TextDecoder().decode(bytes)
  }
  function update() {
    const text = input.value
    if (!text.trim()) return
    if (text.includes('<table')) out.textContent = coreMod.excelHtmlToCsv(text)
    else out.textContent = text
  }
  file.addEventListener('change', () => {
    const f = file.files?.[0]
    if (!f) return
    f.arrayBuffer().then(parseXlsx)
  })
  input.addEventListener('input', update)
  bindCopy(copy, () => out.textContent)
}

async function xlsxToHtmlTable(buf) {
  const zip = await readZip(buf)
  const shared = parseSharedStrings(zip['xl/sharedStrings.xml'] || '')
  const sheet = zip['xl/worksheets/sheet1.xml'] || ''
  const rows = [...sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)]
  const trs = rows.map(row => {
    const cells = [...row[1].matchAll(/<c[^>]*(?: t="([^"]*)")?[^>]*>(?:<v>([\s\S]*?)<\/v>)?/g)]
    const tds = cells.map(c => {
      let v = c[2] || ''
      if (c[1] === 's') v = shared[Number(v)] || ''
      return `<td>${escapeHtml(v)}</td>`
    }).join('')
    return `<tr>${tds}</tr>`
  }).join('')
  return `<table>${trs}</table>`
}

function readZip(buf) {
  const view = new DataView(buf)
  const out = {}
  let offset = 0
  while (offset < view.byteLength - 30) {
    if (view.getUint32(offset, true) !== 0x04034b50) break
    const compMethod = view.getUint16(offset + 8, true)
    const compSize = view.getUint32(offset + 18, true)
    const nameLen = view.getUint16(offset + 26, true)
    const extraLen = view.getUint16(offset + 28, true)
    const name = new TextDecoder().decode(new Uint8Array(buf, offset + 30, nameLen))
    const dataStart = offset + 30 + nameLen + extraLen
    const comp = new Uint8Array(buf, dataStart, compSize)
    const raw = compMethod === 0 ? comp : inflate(comp)
    out[name] = new TextDecoder().decode(raw)
    offset = dataStart + compSize
  }
  return out
}

function inflate(data) {
  if (typeof DecompressionStream === 'undefined') return data
  return data
}

function parseSharedStrings(xml) {
  if (!xml) return []
  return [...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1])
}

function initCsvToExcel({ fn }) {
  const input = document.getElementById('w4-in')
  const dl = document.getElementById('w4-dl')
  dl.addEventListener('click', () => {
    const html = fn(input.value)
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'export.xls'
    a.click()
  })
}

function field(id, label, type = 'number', val = '') {
  return `<div class="calc-field"><label class="tool-label" for="${id}">${label}</label><input type="${type}" id="${id}" class="tool-input" value="${val}" /></div>`
}

function initGenericRoot({ slug, fn }) {
  const root = document.getElementById('w4-root')
  const out = document.getElementById('w4-out')
  if (root) root.textContent = 'Configure UI for ' + slug
  if (out && fn) out.textContent = String(fn)
}

function num(id) { return Number(document.getElementById(id)?.value) }

function initInvoiceNumber({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('prefix', 'Prefix', 'text', 'INV') + field('year', 'Year', 'number', new Date().getFullYear()) + field('seq', 'Sequence', 'number', '1')
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(document.getElementById('prefix').value, num('year'), num('seq')) }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initPurchaseOrder({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="po-items" class="tool-textarea" rows="4" placeholder="Widget,2,10"></textarea>`
  const out = document.getElementById('w4-out')
  function update() {
    const items = document.getElementById('po-items').value.split('\n').filter(Boolean).map(line => {
      const [description, qty, unitPrice] = line.split(',')
      return { description: description?.trim(), qty, unitPrice }
    })
    out.textContent = fn({ items })
  }
  document.getElementById('po-items').addEventListener('input', update)
  update()
}

function initBusinessNames({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('seed', 'Seed word', 'text', '') + field('count', 'Count', 'number', '10')
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(document.getElementById('seed').value, num('count')).join('\n') }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initCurrencyMargin({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('cost', 'Cost') + field('sell', 'Sell price') + field('fx', 'FX rate', 'number', '1') + field('fee', 'FX fee %', 'number', '0')
  const out = document.getElementById('w4-out')
  function update() {
    const r = fn(num('cost'), num('sell'), num('fx'), num('fee'))
    out.textContent = r ? JSON.stringify(r, null, 2) : '—'
  }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initDcf({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="flows" class="tool-textarea" rows="4" placeholder="100,120,150"></textarea>` + field('rate', 'Discount rate %', 'number', '10')
  const out = document.getElementById('w4-out')
  function update() {
    const flows = document.getElementById('flows').value.split(',').map(Number)
    const r = fn(flows, num('rate'))
    out.textContent = r ? JSON.stringify(r, null, 2) : '—'
  }
  root.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', update))
  update()
}

function initPositionSize({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('acct', 'Account size') + field('risk', 'Risk %', 'number', '1') + field('entry', 'Entry price') + field('stop', 'Stop loss')
  const out = document.getElementById('w4-out')
  function update() { const r = fn(num('acct'), num('risk'), num('entry'), num('stop')); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initCryptoProfit({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('buy', 'Buy price') + field('sell', 'Sell price') + field('qty', 'Quantity') + field('bf', 'Buy fee') + field('sf', 'Sell fee')
  const out = document.getElementById('w4-out')
  function update() { const r = fn(num('buy'), num('sell'), num('qty'), num('bf'), num('sf')); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initVisionTokens({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('w', 'Width px') + field('h', 'Height px') + `<div class="calc-field"><label class="tool-label">Detail</label><select id="detail" class="tool-input calc-select"><option value="high">high</option><option value="low">low</option></select></div>`
  const out = document.getElementById('w4-out')
  function update() { const r = fn(num('w'), num('h'), document.getElementById('detail').value); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input,select').forEach(el => el.addEventListener('input', update))
  update()
}

function initJsonSchemaGen({ fn }) {
  initTextareaIo({ fn: (v) => fn(v) })
}

function initAiOutput({ fn }) {
  const root = document.getElementById('w4-root')
  const input = document.getElementById('w4-in')
  const out = document.getElementById('w4-out')
  if (!root || !input || !out) return
  root.innerHTML = `<label class="tool-label" for="fmt">Output format</label><select id="fmt" class="tool-input calc-select"><option value="json">JSON</option><option value="markdown">Markdown</option><option value="plain">Plain</option></select>`
  function update() { const r = fn(input.value, document.getElementById('fmt').value); out.textContent = r.output || r.error || '' }
  input.addEventListener('input', update)
  document.getElementById('fmt').addEventListener('change', update)
}

function initSqlQuery({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('table', 'Table', 'text', 'users') + field('cols', 'Columns', 'text', '*') + field('where', 'WHERE', 'text', '')
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(document.getElementById('table').value, document.getElementById('cols').value.split(',').map(s => s.trim()), document.getElementById('where').value) }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initCsvToSql({ fn }) {
  initTextareaIo({ fn: (v) => fn(v, 'imported_data') })
}

function initErDiagram({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="schema" class="tool-textarea" rows="6" placeholder='{"name":"users","columns":[{"name":"id","type":"int"}]}'></textarea>`
  const out = document.getElementById('w4-out')
  function update() {
    try {
      const tables = JSON.parse(document.getElementById('schema').value || '[]')
      const list = Array.isArray(tables) ? tables : [tables]
      out.textContent = fn(list)
    } catch (e) { out.textContent = e.message }
  }
  document.getElementById('schema').addEventListener('input', update)
}

function initMongoSql({ fn }) {
  initTextareaIo({ fn })
}

function initHttpRequest({ coreMod }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('url', 'URL', 'text', 'https://api.example.com') + field('method', 'Method', 'text', 'GET') + `<textarea id="body" class="tool-textarea" rows="3" placeholder="Body"></textarea>`
  const out = document.getElementById('w4-out')
  function update() {
    const req = { url: document.getElementById('url').value, method: document.getElementById('method').value, body: document.getElementById('body').value, headers: { 'Content-Type': 'application/json' } }
    out.textContent = coreMod.buildHttpRequest(req) + '\n\n--- cURL ---\n\n' + coreMod.buildCurlFromRequest(req)
  }
  root.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', update))
  update()
}

function initMockResponse({ fn }) {
  initTextareaIo({ fn: (v) => { try { return fn(JSON.parse(v || '{}')) } catch { return fn({}) } } })
}

function initWebhookInspector({ fn }) {
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v), null, 2) })
}

function initHashCompare({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="h1" class="tool-textarea" rows="2"></textarea><textarea id="h2" class="tool-textarea" rows="2"></textarea>`
  const out = document.getElementById('w4-out')
  function update() { const r = fn(document.getElementById('h1').value, document.getElementById('h2').value); out.textContent = r.match ? 'Match' : (r.error || 'No match') }
  root.querySelectorAll('textarea').forEach(el => el.addEventListener('input', update))
}

async function initChecksum({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="txt" class="tool-textarea" rows="4"></textarea>`
  const out = document.getElementById('w4-out')
  async function update() { const r = await fn(document.getElementById('txt').value); out.textContent = r.hex || r.error || '' }
  document.getElementById('txt').addEventListener('input', update)
}

function initCertDecode({ fn }) {
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v), null, 2) })
}

async function initCsrGenerator({ coreMod }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('cn', 'Common Name', 'text', 'example.com') + `<button type="button" class="tool-btn" id="gen">Generate key pair</button>`
  const out = document.getElementById('w4-out')
  document.getElementById('gen').addEventListener('click', async () => {
    const subject = coreMod.buildCsrSubject({ CN: document.getElementById('cn').value, C: 'US' })
    const keys = await coreMod.generateRsaKeyPairPem()
    out.textContent = `Subject: ${subject}\n\n${keys.publicKeyPem}\n\n${keys.privateKeyPem}`
  })
}

function initPemDecode({ fn }) {
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v), null, 2) })
}

function initCertExpiry({ coreMod }) {
  initTextareaIo({
    fn: (v) => {
      const r = coreMod.decodeCertificatePem(v)
      const days = coreMod.daysUntilExpiration(r.notAfter)
      return JSON.stringify({ ...r, daysRemaining: days }, null, 2)
    },
  })
}

function initBusinessDays({ coreMod }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<input type="date" id="start" class="tool-input" /><input type="date" id="end" class="tool-input" style="margin-top:.5rem;" />`
  const out = document.getElementById('w4-out')
  function update() { const r = coreMod.businessDaysBetween(document.getElementById('start').value, document.getElementById('end').value); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input').forEach(el => el.addEventListener('change', update))
}

function initWorkingHours({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('start', 'Start', 'time', '09:00') + field('end', 'End', 'time', '17:00') + field('break', 'Break minutes', 'number', '60')
  const out = document.getElementById('w4-out')
  function update() { const r = fn(document.getElementById('start').value, document.getElementById('end').value, num('break')); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initCountdown({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<input type="date" id="target" class="tool-input" />`
  const out = document.getElementById('w4-out')
  function update() { const r = fn(document.getElementById('target').value); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  document.getElementById('target').addEventListener('change', update)
}

function initDelimiter({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<select id="to" class="tool-input"><option>,</option><option>;</option><option>\t</option></select>`
  const input = document.createElement('textarea')
  input.id = 'w4-in'; input.className = 'tool-textarea'; input.rows = 8
  root.prepend(input)
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(input.value, document.getElementById('to').value) }
  input.addEventListener('input', update)
  document.getElementById('to').addEventListener('change', update)
}

function initColumnMapper({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<textarea id="csv" class="tool-textarea" rows="5"></textarea><input id="map" class="tool-input" placeholder="old:new" />`
  const out = document.getElementById('w4-out')
  function update() {
    const headers = (document.getElementById('csv').value.split('\n')[0] || '').split(',')
    const mapping = headers.map(h => ({ from: h.trim(), to: h.trim() }))
    const custom = document.getElementById('map').value
    if (custom.includes(':')) { const [from, to] = custom.split(':'); const m = mapping.find(x => x.from === from.trim()); if (m) m.to = to.trim() }
    out.textContent = fn(document.getElementById('csv').value, mapping)
  }
  root.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', update))
}

function initHtmlValidator({ fn }) {
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v), null, 2) })
}

function initCssGrid({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('cols', 'Columns', 'number', '3') + field('rows', 'Rows', 'number', '2') + field('gap', 'Gap', 'text', '1rem')
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(num('cols'), num('rows'), document.getElementById('gap').value) }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initFlexbox({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = `<select id="dir" class="tool-input"><option>row</option><option>column</option></select>`
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn(document.getElementById('dir').value) }
  document.getElementById('dir').addEventListener('change', update)
  update()
}

function initShipping({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('weight', 'Weight (lb)') + `<select id="zone" class="tool-input"><option value="domestic">domestic</option><option value="regional">regional</option><option value="international">international</option></select>`
  const out = document.getElementById('w4-out')
  function update() { const r = fn(num('weight'), document.getElementById('zone').value); out.textContent = r ? JSON.stringify(r, null, 2) : '—' }
  root.querySelectorAll('input,select').forEach(el => el.addEventListener('input', update))
  update()
}

function initSku({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('prefix', 'Prefix', 'text', 'SKU') + field('cat', 'Category', 'text', 'GEN') + field('seq', 'Sequence', 'number', '1')
  const out = document.getElementById('w4-out')
  function update() { out.textContent = fn({ prefix: document.getElementById('prefix').value, category: document.getElementById('cat').value, sequence: num('seq') }) }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initYoutubeTimestamp({ coreMod }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('url', 'Video URL', 'text', 'https://youtu.be/VIDEO_ID') + field('ts', 'Timestamp (m:ss)', 'text', '1:30')
  const out = document.getElementById('w4-out')
  function update() {
    const p = coreMod.parseTimestamp(document.getElementById('ts').value)
    out.textContent = p ? coreMod.secondsToYoutubeLink(document.getElementById('url').value, p.totalSeconds) : '—'
  }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initXmlValidator({ fn }) {
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v, window.DOMParser), null, 2) })
}

async function initYamlValidator({ fn }) {
  const jsYaml = await loadJsYaml()
  initTextareaIo({ fn: (v) => JSON.stringify(fn(v, jsYaml), null, 2) })
}

function initXmlFormatter({ fn }) {
  initTextareaIo({ fn: (v) => fn(v, window.DOMParser) })
}

function initJsonFlatten({ fn }) {
  initTextareaIo({ fn: (v) => { const r = fn(v); return r.error ? r : JSON.stringify(r.result, null, 2) } })
}

function initJsonPath({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('path', 'JSONPath', 'text', '$.name')
  const input = document.getElementById('w4-in') || (() => { const t = document.createElement('textarea'); t.id = 'w4-in'; t.className = 'tool-textarea'; document.querySelector('.tool-container')?.insertBefore(t, root); return t })()
  const out = document.getElementById('w4-out')
  function update() { const r = fn(input.value, document.getElementById('path').value); out.textContent = r.error || JSON.stringify(r.value, null, 2) }
  input.addEventListener('input', update)
  document.getElementById('path').addEventListener('input', update)
}

function initCitation({ fn }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('author', 'Author', 'text', 'Smith, J.') + field('title', 'Title', 'text', 'Article title') + field('year', 'Year', 'text', '2026')
  const out = document.getElementById('w4-out')
  function update() {
    const fields = { author: document.getElementById('author').value, title: document.getElementById('title').value, year: document.getElementById('year').value }
    out.textContent = fn(fields, 'apa') + '\n\n' + fn(fields, 'mla')
  }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function initApaMla({ fn }) {
  initCitation({ fn })
}

function initRoman({ coreMod }) {
  const root = document.getElementById('w4-root')
  root.innerHTML = field('num', 'Number', 'number', '2026') + field('roman', 'Roman', 'text', 'MMXXVI')
  const out = document.getElementById('w4-out')
  function update() {
    out.textContent = `To Roman: ${coreMod.toRoman(num('num'))}\nFrom Roman: ${coreMod.fromRoman(document.getElementById('roman').value)}`
  }
  root.querySelectorAll('input').forEach(el => el.addEventListener('input', update))
  update()
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
