var REQUIRED_FIELDS = {
  Article: ['headline', 'author', 'datePublished'],
  Product: ['name', 'offers'],
  FAQPage: ['mainEntity'],
  HowTo: ['name', 'step'],
  LocalBusiness: ['name', 'address'],
  Person: ['name'],
  Organization: ['name'],
  WebSite: ['name', 'url'],
  WebApplication: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
}

export function parseJsonLdInput(text) {
  if (!text || !text.trim()) return { error: 'JSON-LD is empty' }

  var trimmed = text.trim()
  try {
    var parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return { items: parsed }
    return { items: [parsed] }
  } catch (e) {
    // try extracting from script tag content
    var match = trimmed.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        var obj = JSON.parse(match[0])
        return { items: Array.isArray(obj) ? obj : [obj] }
      } catch (e2) {
        return { error: 'Invalid JSON: ' + e.message }
      }
    }
    return { error: 'Invalid JSON: ' + e.message }
  }
}

export function validateSchemaItem(item) {
  var issues = []

  if (!item || typeof item !== 'object') {
    return { issues: [{ level: 'error', message: 'Item is not a JSON object' }], valid: false, type: null }
  }

  if (!item['@context']) {
    issues.push({ level: 'error', message: 'Missing @context (expected https://schema.org)' })
  } else if (String(item['@context']).indexOf('schema.org') === -1) {
    issues.push({ level: 'warn', message: '@context does not reference schema.org' })
  } else {
    issues.push({ level: 'ok', message: '@context is set' })
  }

  var type = item['@type']
  if (!type) {
    issues.push({ level: 'error', message: 'Missing @type' })
    return { issues: issues, valid: false, type: null }
  }

  var types = Array.isArray(type) ? type : [type]
  issues.push({ level: 'ok', message: '@type: ' + types.join(', ') })

  types.forEach(function (t) {
    var required = REQUIRED_FIELDS[t]
    if (!required) {
      issues.push({ level: 'warn', message: 'Unknown type "' + t + '" — basic checks only' })
      return
    }
    required.forEach(function (field) {
      if (item[field] === undefined || item[field] === null || item[field] === '') {
        issues.push({ level: 'error', message: t + ' is missing required field: ' + field })
      } else {
        issues.push({ level: 'ok', message: t + '.' + field + ' present' })
      }
    })
  })

  var errors = issues.filter(function (i) { return i.level === 'error' }).length
  return { issues: issues, valid: errors === 0, type: types[0] }
}

export function validateJsonLd(text) {
  var parsed = parseJsonLdInput(text)
  if (parsed.error) return { error: parsed.error, results: [] }

  var results = parsed.items.map(function (item, idx) {
    var result = validateSchemaItem(item)
    result.index = idx + 1
    return result
  })

  var allValid = results.every(function (r) { return r.valid })
  return { results: results, valid: allValid }
}
