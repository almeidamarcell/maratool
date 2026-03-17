export function validatePath(path) {
  if (!path) return { valid: false, error: 'Path is required' }
  if (!path.startsWith('/')) return { valid: false, error: 'Path must start with /' }
  return { valid: true }
}

export function buildRule(userAgent, directives) {
  var lines = ['User-agent: ' + userAgent]
  for (var i = 0; i < directives.length; i++) {
    lines.push(directives[i].type + ': ' + directives[i].path)
  }
  return lines.join('\n')
}

export function buildRobotsTxt(rules, sitemapUrl, crawlDelay) {
  var blocks = []
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i]
    var lines = ['User-agent: ' + rule.userAgent]
    var dirs = rule.directives || []
    for (var j = 0; j < dirs.length; j++) {
      lines.push(dirs[j].type + ': ' + dirs[j].path)
    }
    if (crawlDelay) lines.push('Crawl-delay: ' + crawlDelay)
    blocks.push(lines.join('\n'))
  }
  var result = blocks.join('\n\n')
  if (sitemapUrl) result += '\n\nSitemap: ' + sitemapUrl
  return result
}
