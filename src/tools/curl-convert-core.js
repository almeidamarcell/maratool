/** Parse a cURL command string into request parts */

export function parseCurl(curl) {
  let s = curl.trim()
  if (!s) return null
  if (s.toLowerCase().startsWith('curl ')) s = s.slice(5)
  const result = { method: 'GET', url: '', headers: {}, body: '' }

  const tokens = []
  let cur = ''
  let quote = null
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quote) {
      if (ch === quote && s[i - 1] !== '\\') { quote = null; cur += ch; continue }
      cur += ch
    } else if (ch === "'" || ch === '"') {
      quote = ch
      cur += ch
    } else if (ch === ' ' && cur) {
      tokens.push(cur)
      cur = ''
    } else if (ch !== ' ' || cur) {
      cur += ch
    }
  }
  if (cur) tokens.push(cur)

  function unquote(t) {
    if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
      return t.slice(1, -1)
    }
    return t
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === '-X' || t === '--request') {
      result.method = (tokens[++i] || 'GET').toUpperCase().replace(/['"]/g, '')
    } else if (t === '-H' || t === '--header') {
      const h = unquote(tokens[++i] || '')
      const idx = h.indexOf(':')
      if (idx > 0) result.headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim()
    } else if (t === '-d' || t === '--data' || t === '--data-raw') {
      result.body = unquote(tokens[++i] || '')
      if (result.method === 'GET') result.method = 'POST'
    } else if (!t.startsWith('-') && !result.url) {
      result.url = unquote(t)
    }
  }
  return result
}

export function curlToFetch(req) {
  if (!req || !req.url) return ''
  const lines = [`const response = await fetch('${req.url}', {`, `  method: '${req.method}',`]
  const headerKeys = Object.keys(req.headers)
  if (headerKeys.length) {
    lines.push('  headers: {')
    headerKeys.forEach(k => {
      lines.push(`    '${k}': '${req.headers[k].replace(/'/g, "\\'")}',`)
    })
    lines.push('  },')
  }
  if (req.body) {
    lines.push(`  body: ${JSON.stringify(req.body)},`)
  }
  lines.push('});', 'const data = await response.json();')
  return lines.join('\n')
}

export function curlToPython(req) {
  if (!req || !req.url) return ''
  const lines = ['import requests', '', `response = requests.${req.method.toLowerCase()}('${req.url}'`]
  const args = []
  if (Object.keys(req.headers).length) {
    const hdr = JSON.stringify(req.headers, null, 4).replace(/"/g, "'")
    args.push(`headers=${hdr.replace(/\n/g, '\n    ')}`)
  }
  if (req.body) {
    args.push(`data=${JSON.stringify(req.body)}`)
  }
  if (args.length) lines[lines.length - 1] += ', ' + args.join(', ')
  lines[lines.length - 1] += ')'
  lines.push('print(response.json())')
  return lines.join('\n')
}

export function toPostmanCollection(req, name = 'Generated Request') {
  const headerArr = Object.entries(req.headers || {}).map(([key, value]) => ({ key, value }))
  return {
    info: { name, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: [{
      name: req.url || 'Request',
      request: {
        method: req.method || 'GET',
        header: headerArr,
        body: req.body ? { mode: 'raw', raw: req.body } : undefined,
        url: req.url,
      },
    }],
  }
}
