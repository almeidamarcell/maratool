/** HTML minify and simple beautify */

export function minifyHtml(html) {
  if (!html) return ''
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim()
}

export function beautifyHtml(html) {
  if (!html || !html.trim()) return ''
  const cleaned = html.replace(/>\s+</g, '><').trim()
  const tokens = cleaned.split(/(<[^>]+>)/).filter(Boolean)
  let indent = 0
  const out = []
  const voidTags = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i

  for (const token of tokens) {
    if (!token.startsWith('<')) {
      const text = token.trim()
      if (text) out.push('  '.repeat(indent) + text)
      continue
    }
    const isClose = /^<\//.test(token)
    const isSelfClose = /\/>$/.test(token) || /^<!/.test(token)
    const tagMatch = token.match(/^<\/?([a-zA-Z0-9-]+)/)
    const tag = tagMatch ? tagMatch[1] : ''

    if (isClose) indent = Math.max(0, indent - 1)
    out.push('  '.repeat(indent) + token)
    if (!isClose && !isSelfClose && tag && !voidTags.test(tag)) indent++
  }

  return out.join('\n')
}
