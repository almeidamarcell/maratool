/** Generate SQL INSERT statements from JSON */

function escapeId(name) {
  return String(name).replace(/"/g, '""')
}

function formatValue(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number' && Number.isFinite(val)) return String(val)
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  return "'" + String(val).replace(/'/g, "''") + "'"
}

export function jsonToInsert(table, input) {
  let rows = input
  if (typeof input === 'string') {
    try {
      rows = JSON.parse(input)
    } catch {
      return { error: 'Invalid JSON' }
    }
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'Expected a non-empty JSON array of objects' }
  }
  const tableName = String(table || 'my_table').trim() || 'my_table'
  const keys = Object.keys(rows[0])
  if (!keys.length) return { error: 'Rows must contain at least one column' }
  const cols = keys.map(k => '"' + escapeId(k) + '"').join(', ')
  const values = rows.map(row =>
    '(' + keys.map(k => formatValue(row[k])).join(', ') + ')'
  ).join(',\n')
  return `INSERT INTO "${escapeId(tableName)}" (${cols}) VALUES\n${values};`
}
