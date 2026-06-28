/** Generate CREATE TABLE from JSON schema or sample row */

function escapeId(name) {
  return String(name).replace(/"/g, '""')
}

function inferSqlType(val) {
  if (val === null || val === undefined) return 'TEXT'
  if (typeof val === 'boolean') return 'BOOLEAN'
  if (typeof val === 'number') return Number.isInteger(val) ? 'INTEGER' : 'REAL'
  if (typeof val === 'object') return 'JSON'
  const s = String(val)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return 'TIMESTAMP'
  return 'TEXT'
}

export function jsonToCreateTable(table, input) {
  let schema = input
  if (typeof input === 'string') {
    try {
      schema = JSON.parse(input)
    } catch {
      return { error: 'Invalid JSON' }
    }
  }

  const tableName = String(table || 'my_table').trim() || 'my_table'
  let columns = []

  if (Array.isArray(schema)) {
    if (!schema.length || typeof schema[0] !== 'object') {
      return { error: 'Expected JSON array of objects or column type map' }
    }
    const sample = schema[0]
    columns = Object.keys(sample).map(name => ({
      name,
      type: inferSqlType(sample[name]),
    }))
  } else if (schema && typeof schema === 'object') {
    columns = Object.entries(schema).map(([name, type]) => ({
      name,
      type: String(type || 'TEXT').toUpperCase(),
    }))
  } else {
    return { error: 'Expected JSON object or array' }
  }

  if (!columns.length) return { error: 'No columns found' }

  const defs = columns.map(c => `  "${escapeId(c.name)}" ${c.type}`).join(',\n')
  return `CREATE TABLE "${escapeId(tableName)}" (\n${defs}\n);`
}
