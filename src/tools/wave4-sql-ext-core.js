import { parseCsv, detectDelimiter } from './csv-parser.js'

function esc(val) {
  if (val === null || val === undefined) return 'NULL'
  const s = String(val)
  return `'${s.replace(/'/g, "''")}'`
}

export function csvToSql(csvText, tableName = 'imported_data', delimiter) {
  const d = delimiter || detectDelimiter(csvText)
  const parsed = parseCsv(csvText, d)
  if (!parsed.headers.length) return { sql: '', error: 'No headers found' }
  const cols = parsed.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(', ')
  const inserts = parsed.rows.map(row => {
    const vals = row.map(esc).join(', ')
    return `INSERT INTO ${tableName} (${cols}) VALUES (${vals});`
  })
  return { sql: inserts.join('\n'), error: null }
}

export function sqlToCsv(sqlText) {
  const text = String(sqlText || '')
  const valuesRe = /VALUES\s*\(([^)]+)\)/gi
  const rows = []
  let m
  while ((m = valuesRe.exec(text))) {
    const parts = m[1].split(',').map(p => p.trim().replace(/^'|'$/g, '').replace(/''/g, "'"))
    rows.push(parts)
  }
  if (!rows.length) return { csv: '', error: 'No VALUES rows found' }
  const header = rows[0].map((_, i) => `col${i + 1}`)
  const lines = [header.join(','), ...rows.map(r => r.join(','))]
  return { csv: lines.join('\n'), error: null }
}

export function buildSelectQuery(table, columns = ['*'], where = '') {
  const t = String(table || 'users').trim()
  const cols = columns.length ? columns.join(', ') : '*'
  const base = `SELECT ${cols}\nFROM ${t}`
  return where ? `${base}\nWHERE ${where.trim()};` : `${base};`
}

export function erDiagramFromTables(tables) {
  const lines = ['erDiagram']
  for (const t of tables || []) {
    lines.push(`    ${t.name} {`)
    for (const col of t.columns || []) {
      lines.push(`        ${col.type || 'string'} ${col.name}`)
    }
    lines.push('    }')
  }
  return lines.join('\n')
}

export function mongoToSql(docJson, tableName = 'documents') {
  try {
    const doc = JSON.parse(docJson)
    const flat = flattenObject(doc)
    const cols = Object.keys(flat)
    const vals = cols.map(k => esc(flat[k]))
    const colList = cols.map(c => `"${c}"`).join(', ')
    return {
      sql: `INSERT INTO ${tableName} (${colList}) VALUES (${vals.join(', ')});`,
      error: null,
    }
  } catch (e) {
    return { sql: '', error: e.message }
  }
}

function flattenObject(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}_${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flattenObject(v, key, out)
    else out[key] = Array.isArray(v) ? JSON.stringify(v) : v
  }
  return out
}
