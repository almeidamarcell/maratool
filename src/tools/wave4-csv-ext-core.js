import { parseCsv, detectDelimiter } from './csv-parser.js'
import { rowsToCsv } from './csv-tools-core.js'

export function convertDelimiter(text, toDelimiter = ',', fromDelimiter) {
  const from = fromDelimiter || detectDelimiter(text)
  const parsed = parseCsv(text, from)
  return rowsToCsv(parsed.headers, parsed.rows, toDelimiter)
}

export function transposeCsv(text, delimiter) {
  const d = delimiter || detectDelimiter(text)
  const parsed = parseCsv(text, d)
  const width = Math.max(parsed.headers.length, ...parsed.rows.map(r => r.length))
  const matrix = [parsed.headers, ...parsed.rows]
  while (matrix[0].length < width) matrix[0].push('')
  matrix.forEach(r => { while (r.length < width) r.push('') })
  const transposed = []
  for (let c = 0; c < width; c++) {
    transposed.push(matrix.map(row => row[c] ?? ''))
  }
  const headers = transposed[0]
  const rows = transposed.slice(1)
  return rowsToCsv(headers, rows, d)
}

export function mapCsvColumns(text, mapping, delimiter) {
  const d = delimiter || detectDelimiter(text)
  const parsed = parseCsv(text, d)
  const headers = mapping.map(m => m.to || m.from)
  const rows = parsed.rows.map(row => {
    return mapping.map(m => {
      const idx = parsed.headers.indexOf(m.from)
      return idx >= 0 ? row[idx] : ''
    })
  })
  return rowsToCsv(headers, rows, d)
}

export function diffCsv(a, b, delimiter) {
  const d = delimiter || detectDelimiter(a || b)
  const left = parseCsv(a || '', d)
  const right = parseCsv(b || '', d)
  const max = Math.max(left.rows.length, right.rows.length)
  const lines = []
  for (let i = 0; i < max; i++) {
    const l = (left.rows[i] || []).join(d)
    const r = (right.rows[i] || []).join(d)
    if (l === r) lines.push({ type: 'same', line: i + 1, text: l })
    else {
      if (left.rows[i]) lines.push({ type: 'removed', line: i + 1, text: l })
      if (right.rows[i]) lines.push({ type: 'added', line: i + 1, text: r })
    }
  }
  return { lines, added: lines.filter(x => x.type === 'added').length, removed: lines.filter(x => x.type === 'removed').length }
}

export function csvToExcelHtml(csvText, delimiter) {
  const d = delimiter || detectDelimiter(csvText)
  const parsed = parseCsv(csvText, d)
  const rows = [parsed.headers, ...parsed.rows]
  const trs = rows.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')
  return `<html><head><meta charset="utf-8"></head><body><table>${trs}</table></body></html>`
}

export function excelHtmlToCsv(html) {
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
  const rows = []
  let rm
  while ((rm = rowRe.exec(html))) {
    const cells = []
    let cm
    while ((cm = cellRe.exec(rm[1]))) cells.push(stripTags(cm[1]).trim())
    if (cells.length) rows.push(cells)
  }
  if (!rows.length) return ''
  const [headers, ...body] = rows
  return rowsToCsv(headers, body, ',')
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '')
}
