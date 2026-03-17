export function countTitle(str) {
  var count = str.length
  var status = count < 50 ? 'short' : count > 60 ? 'long' : 'ok'
  return { count: count, status: status }
}

export function countDescription(str) {
  var count = str.length
  var status = count < 140 ? 'short' : count > 160 ? 'long' : 'ok'
  return { count: count, status: status }
}

export function buildBasicTags(fields) {
  var tags = []
  if (fields.title) tags.push('<title>' + esc(fields.title) + '</title>')
  if (fields.description) tags.push('<meta name="description" content="' + esc(fields.description) + '" />')
  if (fields.canonical) tags.push('<link rel="canonical" href="' + esc(fields.canonical) + '" />')
  if (fields.author) tags.push('<meta name="author" content="' + esc(fields.author) + '" />')
  if (fields.robots) tags.push('<meta name="robots" content="' + esc(fields.robots) + '" />')
  return tags
}

export function buildOgTags(fields) {
  var tags = []
  if (fields.title) tags.push('<meta property="og:title" content="' + esc(fields.title) + '" />')
  if (fields.description) tags.push('<meta property="og:description" content="' + esc(fields.description) + '" />')
  if (fields.url) tags.push('<meta property="og:url" content="' + esc(fields.url) + '" />')
  if (fields.type) tags.push('<meta property="og:type" content="' + esc(fields.type) + '" />')
  if (fields.siteName) tags.push('<meta property="og:site_name" content="' + esc(fields.siteName) + '" />')
  if (fields.imageUrl) tags.push('<meta property="og:image" content="' + esc(fields.imageUrl) + '" />')
  return tags
}

export function buildTwitterTags(fields) {
  var tags = []
  if (fields.card) tags.push('<meta name="twitter:card" content="' + esc(fields.card) + '" />')
  if (fields.title) tags.push('<meta name="twitter:title" content="' + esc(fields.title) + '" />')
  if (fields.description) tags.push('<meta name="twitter:description" content="' + esc(fields.description) + '" />')
  if (fields.imageUrl) tags.push('<meta name="twitter:image" content="' + esc(fields.imageUrl) + '" />')
  if (fields.site) tags.push('<meta name="twitter:site" content="' + esc(fields.site) + '" />')
  return tags
}

export function combineAllTags(basic, og, twitter) {
  var parts = []
  if (basic && basic.length) parts.push('<!-- Basic SEO -->\n' + basic.join('\n'))
  if (og && og.length) parts.push('<!-- Open Graph -->\n' + og.join('\n'))
  if (twitter && twitter.length) parts.push('<!-- Twitter Card -->\n' + twitter.join('\n'))
  return parts.join('\n\n')
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
