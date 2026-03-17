export function normalizeUrl(rawUrl) {
  var trimmed = rawUrl.trim()
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    return 'https://' + trimmed
  }
  return trimmed
}

export function validateUrl(url) {
  if (!url) return { valid: false, error: 'URL is required' }
  try {
    var parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Only http and https URLs are allowed' }
    }
    return { valid: true }
  } catch (e) {
    return { valid: false, error: 'Invalid URL' }
  }
}

export function buildUtmUrl(baseUrl, params) {
  var source = params.source || ''
  var medium = params.medium || ''
  var campaign = params.campaign || ''

  if (!source || !medium || !campaign) return ''

  // Split hash fragment out before appending query params
  var hashIdx = baseUrl.indexOf('#')
  var fragment = ''
  var urlWithoutHash = baseUrl
  if (hashIdx !== -1) {
    fragment = baseUrl.slice(hashIdx)
    urlWithoutHash = baseUrl.slice(0, hashIdx)
  }

  var sep = urlWithoutHash.indexOf('?') !== -1 ? '&' : '?'
  var parts = []

  parts.push('utm_source=' + encodeURIComponent(source))
  parts.push('utm_medium=' + encodeURIComponent(medium))
  parts.push('utm_campaign=' + encodeURIComponent(campaign))

  if (params.term) parts.push('utm_term=' + encodeURIComponent(params.term))
  if (params.content) parts.push('utm_content=' + encodeURIComponent(params.content))

  return urlWithoutHash + sep + parts.join('&') + fragment
}
