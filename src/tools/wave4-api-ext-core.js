/** Wave 4 API utilities */

export function buildHttpRequest({ url = '', method = 'GET', headers = {}, body = '' }) {
  const lines = [`${method.toUpperCase()} ${url} HTTP/1.1`]
  const allHeaders = { Host: tryHost(url), ...headers }
  for (const [k, v] of Object.entries(allHeaders)) {
    if (v) lines.push(`${k}: ${v}`)
  }
  if (body) {
    lines.push('')
    lines.push(body)
  }
  return lines.join('\n')
}

function tryHost(url) {
  try { return new URL(url).host } catch { return '' }
}

export function buildCurlFromRequest({ url, method = 'GET', headers = {}, body = '' }) {
  const parts = [`curl -X ${method.toUpperCase()} '${url}'`]
  for (const [k, v] of Object.entries(headers || {})) {
    parts.push(`-H '${k}: ${v}'`)
  }
  if (body) parts.push(`-d '${String(body).replace(/'/g, "'\\''")}'`)
  return parts.join(' \\\n  ')
}

export function generateMockResponse(schema = {}) {
  function sample(prop) {
    if (!prop || typeof prop !== 'object') return 'value'
    if (prop.example !== undefined) return prop.example
    if (prop.enum && prop.enum.length) return prop.enum[0]
    const t = Array.isArray(prop.type) ? prop.type[0] : prop.type
    if (t === 'string') return prop.format === 'email' ? 'user@example.com' : 'string'
    if (t === 'integer') return 1
    if (t === 'number') return 1.5
    if (t === 'boolean') return true
    if (t === 'array') return [sample(prop.items)]
    if (t === 'object') {
      const o = {}
      for (const [k, v] of Object.entries(prop.properties || {})) o[k] = sample(v)
      return o
    }
    return null
  }
  return JSON.stringify(sample(schema), null, 2)
}

export function inspectWebhookPayload(jsonStr) {
  try {
    const data = JSON.parse(jsonStr)
    const keys = typeof data === 'object' && data ? Object.keys(data) : []
    return {
      valid: true,
      type: Array.isArray(data) ? 'array' : typeof data,
      keyCount: keys.length,
      keys,
      pretty: JSON.stringify(data, null, 2),
      error: null,
    }
  } catch (e) {
    return { valid: false, type: null, keyCount: 0, keys: [], pretty: '', error: e.message }
  }
}
