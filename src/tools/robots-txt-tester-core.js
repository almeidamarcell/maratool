export function parseRobotsTxt(text) {
  if (!text || !text.trim()) return { error: 'robots.txt is empty', rules: [] }

  var lines = text.replace(/\r\n/g, '\n').split('\n')
  var rules = []
  var current = null
  var sitemaps = []

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].split('#')[0].trim()
    if (!line) continue

    var colon = line.indexOf(':')
    if (colon === -1) continue
    var key = line.slice(0, colon).trim().toLowerCase()
    var value = line.slice(colon + 1).trim()

    if (key === 'user-agent') {
      current = { userAgent: value, directives: [] }
      rules.push(current)
    } else if (key === 'allow' || key === 'disallow') {
      if (!current) {
        current = { userAgent: '*', directives: [] }
        rules.push(current)
      }
      current.directives.push({ type: key === 'allow' ? 'Allow' : 'Disallow', path: value || '/' })
    } else if (key === 'sitemap') {
      sitemaps.push(value)
    }
  }

  return { rules: rules, sitemaps: sitemaps }
}

function pathMatches(rulePath, urlPath) {
  if (rulePath === '') return false
  if (rulePath === '/') return true
  if (rulePath === urlPath) return true
  if (rulePath.endsWith('*')) {
    return urlPath.startsWith(rulePath.slice(0, -1))
  }
  return urlPath.startsWith(rulePath)
}

function specificity(path) {
  return path === '/' ? 1 : path.length
}

export function testRobotsPath(rules, userAgent, urlPath) {
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath.replace(/^\/*/, '')

  var applicable = rules.filter(function (r) {
    var ua = r.userAgent.toLowerCase()
    return ua === '*' || userAgent.toLowerCase().indexOf(ua) !== -1 || ua.indexOf(userAgent.toLowerCase()) !== -1
  })

  if (!applicable.length) return { allowed: true, reason: 'No matching User-agent rules — allowed by default' }

  var bestAllow = null
  var bestDisallow = null

  applicable.forEach(function (rule) {
    rule.directives.forEach(function (dir) {
      if (!pathMatches(dir.path, urlPath)) return
      var spec = specificity(dir.path)
      if (dir.type === 'Allow') {
        if (!bestAllow || spec > bestAllow.spec) bestAllow = { spec: spec, path: dir.path }
      } else {
        if (!bestDisallow || spec > bestDisallow.spec) bestDisallow = { spec: spec, path: dir.path }
      }
    })
  })

  if (bestDisallow && (!bestAllow || bestDisallow.spec > bestAllow.spec)) {
    return { allowed: false, reason: 'Disallow: ' + bestDisallow.path, matched: bestDisallow.path }
  }
  if (bestAllow) {
    return { allowed: true, reason: 'Allow: ' + bestAllow.path, matched: bestAllow.path }
  }
  return { allowed: true, reason: 'No matching rule — allowed by default' }
}
