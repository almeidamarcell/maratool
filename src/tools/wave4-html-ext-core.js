/** Wave 4 HTML/CSS/JS utilities */

export function sanitizeHtmlPreview(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

export function beautifyCss(css) {
  if (!css) return ''
  let out = css.replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n')
  out = out.replace(/,\s*/g, ',\n')
  return out.trim()
}

export function minifyJs(js) {
  if (!js) return ''
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,:<>+\-*/=])\s*/g, '$1')
    .trim()
}

export function validateHtmlStructure(html) {
  const errors = []
  const text = String(html || '')
  if (!text.trim()) return { valid: false, errors: ['Empty HTML'] }
  const openTags = text.match(/<([a-z][a-z0-9-]*)\b[^>]*(?<!\/)>/gi) || []
  const closeTags = text.match(/<\/([a-z][a-z0-9-]*)\s*>/gi) || []
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
  const stack = []
  for (const tag of openTags) {
    const name = tag.match(/<([a-z][a-z0-9-]*)/i)?.[1]?.toLowerCase()
    if (!name || voidTags.has(name)) continue
    stack.push(name)
  }
  for (const tag of closeTags) {
    const name = tag.match(/<\/([a-z][a-z0-9-]*)/i)?.[1]?.toLowerCase()
    const last = stack.pop()
    if (last !== name) errors.push(`Mismatched tag: expected </${last || '?'}>, found </${name}>`)
  }
  if (stack.length) errors.push(`Unclosed tags: ${stack.join(', ')}`)
  return { valid: errors.length === 0, errors }
}

export function generateCssGrid(columns = 3, rows = 2, gap = '1rem') {
  return `.grid {
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
  gap: ${gap};
}`
}

export function generateFlexbox(direction = 'row', justify = 'flex-start', align = 'stretch', gap = '0.5rem') {
  return `.flex {
  display: flex;
  flex-direction: ${direction};
  justify-content: ${justify};
  align-items: ${align};
  gap: ${gap};
}`
}

export function normalizeSvg(svg) {
  const text = String(svg || '').trim()
  if (!text.includes('<svg')) return { svg: '', error: 'No <svg> root element found' }
  return { svg: text, error: null }
}
