/** Wave 4 AI utilities */

export function estimateVisionTokens(width, height, detail = 'high') {
  const w = Math.max(0, Math.floor(Number(width)))
  const h = Math.max(0, Math.floor(Number(height)))
  if (!w || !h) return null
  if (detail === 'low') return { tokens: 85, detail }
  const tiles = Math.ceil(w / 512) * Math.ceil(h / 512)
  return { tokens: 85 + tiles * 170, tiles, detail: 'high' }
}

export function cleanupMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
}

export function promptDiff(a, b) {
  const left = String(a || '').split('\n')
  const right = String(b || '').split('\n')
  const max = Math.max(left.length, right.length)
  const lines = []
  for (let i = 0; i < max; i++) {
    const l = left[i]
    const r = right[i]
    if (l === r) lines.push({ type: 'same', text: l || '' })
    else {
      if (l !== undefined) lines.push({ type: 'removed', text: l })
      if (r !== undefined) lines.push({ type: 'added', text: r })
    }
  }
  return lines
}

export function promptVersionCompare(v1, v2) {
  const diff = promptDiff(v1, v2)
  return {
    added: diff.filter(d => d.type === 'added').length,
    removed: diff.filter(d => d.type === 'removed').length,
    unchanged: diff.filter(d => d.type === 'same').length,
    lines: diff,
  }
}

export function formatAiOutput(text, format = 'json') {
  const raw = String(text || '').trim()
  if (!raw) return { output: '', error: 'Empty input' }
  if (format === 'json') {
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const candidate = fence ? fence[1].trim() : raw
    try {
      return { output: JSON.stringify(JSON.parse(candidate), null, 2), error: null }
    } catch (e) {
      return { output: '', error: e.message }
    }
  }
  if (format === 'markdown') {
    return { output: cleanupMarkdown(raw), error: null }
  }
  return { output: raw.replace(/\s+/g, ' ').trim(), error: null }
}

export function inferJsonSchema(value) {
  function schemaFor(v) {
    if (v === null) return { type: 'null' }
    if (Array.isArray(v)) {
      return { type: 'array', items: v.length ? schemaFor(v[0]) : {} }
    }
    const t = typeof v
    if (t === 'object') {
      const properties = {}
      for (const [k, val] of Object.entries(v)) properties[k] = schemaFor(val)
      return { type: 'object', properties, required: Object.keys(properties) }
    }
    if (t === 'number') return Number.isInteger(v) ? { type: 'integer' } : { type: 'number' }
    if (t === 'boolean') return { type: 'boolean' }
    return { type: 'string' }
  }
  return { $schema: 'http://json-schema.org/draft-07/schema#', ...schemaFor(value) }
}

export function generateJsonSchemaFromJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr)
    return { schema: inferJsonSchema(parsed), error: null }
  } catch (e) {
    return { schema: null, error: e.message }
  }
}
