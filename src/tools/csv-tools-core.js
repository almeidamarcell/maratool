import { parseCsv, detectDelimiter } from './csv-parser.js'

function escapeField(val, delimiter) {
  const s = val === null || val === undefined ? '' : String(val)
  if (s.indexOf(delimiter) !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function rowsToCsv(headers, rows, delimiter = ',') {
  const headerLine = headers.map(h => escapeField(h, delimiter)).join(delimiter)
  const body = rows.map(row => row.map(c => escapeField(c, delimiter)).join(delimiter))
  return [headerLine, ...body].join('\n')
}

export function cleanCsv(text, delimiter) {
  const d = delimiter || detectDelimiter(text)
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const trimmed = lines.map(l => l.trim()).filter(l => l.length > 0)
  const parsed = parseCsv(trimmed.join('\n'), d)
  return rowsToCsv(parsed.headers, parsed.rows, d)
}

export function dedupCsv(text, columnIndex, delimiter) {
  const d = delimiter || detectDelimiter(text)
  const parsed = parseCsv(text, d)
  const seen = new Set()
  const rows = []
  for (const row of parsed.rows) {
    const key = columnIndex === 'all'
      ? row.join('\0')
      : (columnIndex >= 0 && columnIndex < row.length ? row[columnIndex] : row.join('\0'))
    if (seen.has(key)) continue
    seen.add(key)
    rows.push(row)
  }
  return rowsToCsv(parsed.headers, rows, d)
}

export function splitCsv(text, chunkSize, delimiter) {
  const d = delimiter || detectDelimiter(text)
  const parsed = parseCsv(text, d)
  const chunks = []
  for (let i = 0; i < parsed.rows.length; i += chunkSize) {
    chunks.push(rowsToCsv(parsed.headers, parsed.rows.slice(i, i + chunkSize), d))
  }
  return chunks
}

export function mergeCsv(texts, delimiter) {
  let headers = null
  const allRows = []
  for (const text of texts) {
    if (!text.trim()) continue
    const d = delimiter || detectDelimiter(text)
    const parsed = parseCsv(text, d)
    if (!headers) headers = parsed.headers
    allRows.push(...parsed.rows)
  }
  if (!headers) return ''
  return rowsToCsv(headers, allRows, delimiter || ',')
}
