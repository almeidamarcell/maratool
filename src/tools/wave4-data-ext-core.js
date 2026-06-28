/** Wave 4 data validation and transformation utilities */

export function validateXml(xml, DOMParserClass) {
  if (!xml || !xml.trim()) return { valid: false, errors: ['Empty XML'] }
  const parser = new DOMParserClass()
  const doc = parser.parseFromString(xml, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) return { valid: false, errors: [err.textContent.trim()] }
  return { valid: true, errors: [] }
}

export function validateYaml(yaml, jsYaml) {
  try {
    jsYaml.load(yaml)
    return { valid: true, errors: [] }
  } catch (e) {
    return { valid: false, errors: [e.message] }
  }
}

export function parseToml(toml) {
  const out = {}
  let section = out
  const stack = [out]
  for (const raw of String(toml || '').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const sec = line.match(/^\[([^\]]+)\]$/)
    if (sec) {
      section = {}
      out[sec[1]] = section
      continue
    }
    const kv = line.match(/^([^=]+)=(.*)$/)
    if (!kv) return { data: null, error: `Invalid line: ${line}` }
    let val = kv[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    else if (val === 'true') val = true
    else if (val === 'false') val = false
    else if (!isNaN(Number(val))) val = Number(val)
    section[kv[1].trim()] = val
  }
  return { data: out, error: null }
}

export function tomlToJson(toml) {
  const r = parseToml(toml)
  if (r.error) return { json: '', error: r.error }
  return { json: JSON.stringify(r.data, null, 2), error: null }
}

export function formatXml(xml, DOMParserClass) {
  const v = validateXml(xml, DOMParserClass)
  if (!v.valid) return { xml: '', error: v.errors[0] }
  return { xml: xml.replace(/>\s+</g, '>\n<').trim(), error: null }
}

export function flattenJson(value, prefix = '', out = {}) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${k}` : k
      flattenJson(v, key, out)
    }
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => flattenJson(v, `${prefix}[${i}]`, out))
    return out
  }
  out[prefix || 'value'] = value
  return out
}

export function flattenJsonString(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr)
    return { result: flattenJson(parsed), error: null }
  } catch (e) {
    return { result: null, error: e.message }
  }
}

export function jsonPathGet(data, path) {
  if (!path || path === '$') return data
  const parts = String(path).replace(/^\$\.?/, '').split(/\.|\[|\]/).filter(Boolean)
  let cur = data
  for (const p of parts) {
    if (cur == null) return undefined
    cur = cur[/^\d+$/.test(p) ? Number(p) : p]
  }
  return cur
}

export function testJsonPath(jsonStr, path) {
  try {
    const data = JSON.parse(jsonStr)
    const value = jsonPathGet(data, path)
    return { value, error: null }
  } catch (e) {
    return { value: undefined, error: e.message }
  }
}
