/** Minify SQL — remove comments and collapse whitespace */

export function minifySql(sql) {
  if (!sql || !sql.trim()) return ''
  let s = sql
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ')
  s = s.replace(/--[^\n\r]*/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}
