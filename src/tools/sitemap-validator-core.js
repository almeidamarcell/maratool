export function parseSitemapXml(xml) {
  if (!xml || !xml.trim()) return { error: 'Sitemap XML is empty' }

  var doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) return { error: 'Invalid XML — could not parse sitemap' }

  var root = doc.documentElement
  if (!root) return { error: 'Empty XML document' }

  var tag = root.tagName.toLowerCase()
  if (tag === 'urlset') {
    var urls = []
    doc.querySelectorAll('url').forEach(function (node) {
      var loc = node.querySelector('loc')
      urls.push({
        loc: loc ? loc.textContent.trim() : '',
        lastmod: (node.querySelector('lastmod') || {}).textContent || '',
        changefreq: (node.querySelector('changefreq') || {}).textContent || '',
        priority: (node.querySelector('priority') || {}).textContent || '',
      })
    })
    return { type: 'urlset', urls: urls }
  }

  if (tag === 'sitemapindex') {
    var sitemaps = []
    doc.querySelectorAll('sitemap').forEach(function (node) {
      var loc = node.querySelector('loc')
      sitemaps.push({ loc: loc ? loc.textContent.trim() : '' })
    })
    return { type: 'sitemapindex', sitemaps: sitemaps }
  }

  return { error: 'Root element must be <urlset> or <sitemapindex>' }
}

function isValidUrl(str) {
  try {
    var u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch (e) {
    return false
  }
}

export function validateSitemap(parsed) {
  if (parsed.error) return { error: parsed.error, issues: [] }

  var issues = []

  if (parsed.type === 'urlset') {
    if (!parsed.urls.length) issues.push({ level: 'error', message: 'No <url> entries found' })

    var seen = {}
    parsed.urls.forEach(function (entry, idx) {
      var n = idx + 1
      if (!entry.loc) {
        issues.push({ level: 'error', message: 'URL #' + n + ' is missing <loc>' })
      } else if (!isValidUrl(entry.loc)) {
        issues.push({ level: 'error', message: 'URL #' + n + ' has invalid loc: ' + entry.loc })
      } else if (seen[entry.loc]) {
        issues.push({ level: 'warn', message: 'Duplicate URL: ' + entry.loc })
      } else {
        seen[entry.loc] = true
      }
    })

    if (parsed.urls.length > 50000) {
      issues.push({ level: 'warn', message: 'More than 50,000 URLs — sitemap should be split per spec' })
    } else if (parsed.urls.length) {
      issues.push({ level: 'ok', message: parsed.urls.length + ' URL(s) found' })
    }
  }

  if (parsed.type === 'sitemapindex') {
    if (!parsed.sitemaps.length) issues.push({ level: 'error', message: 'No <sitemap> entries in index' })
    parsed.sitemaps.forEach(function (entry, idx) {
      if (!entry.loc) issues.push({ level: 'error', message: 'Sitemap #' + (idx + 1) + ' missing <loc>' })
      else if (!isValidUrl(entry.loc)) issues.push({ level: 'error', message: 'Invalid sitemap loc: ' + entry.loc })
    })
    if (parsed.sitemaps.length) issues.push({ level: 'ok', message: parsed.sitemaps.length + ' child sitemap(s) listed' })
  }

  var errors = issues.filter(function (i) { return i.level === 'error' }).length
  var valid = errors === 0

  return {
    valid: valid,
    issues: issues,
    stats: {
      type: parsed.type,
      count: parsed.type === 'urlset' ? parsed.urls.length : parsed.sitemaps.length,
    },
  }
}
