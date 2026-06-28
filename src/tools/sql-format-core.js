/** Basic SQL formatter — keyword-aware indentation */

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'AS', 'DISTINCT',
  'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'ASC', 'DESC',
])

const BREAK_BEFORE = new Set(['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'UNION', 'SET', 'VALUES'])

export function formatSql(sql) {
  if (!sql || !sql.trim()) return ''
  let s = sql.replace(/\s+/g, ' ').trim()
  // Add newlines before major keywords
  for (const kw of BREAK_BEFORE) {
    const re = new RegExp('\\b' + kw + '\\b', 'gi')
    s = s.replace(re, '\n' + kw.toUpperCase())
  }
  const lines = s.split('\n').map(l => l.trim()).filter(Boolean)
  let indent = 0
  const out = []
  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper.startsWith('FROM') || upper.startsWith('WHERE') || upper.startsWith('GROUP') || upper.startsWith('ORDER') || upper.startsWith('HAVING')) {
      indent = 1
    }
    const pad = '  '.repeat(indent)
    out.push(pad + line)
    if (upper.startsWith('SELECT')) indent = 1
  }
  return out.join('\n')
}
