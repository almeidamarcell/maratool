import { parseMetaFromHtml } from './html-meta-parser-core.js'

export function resolveOgPreview(fields) {
  var title = fields.ogTitle || fields.title || 'Page title'
  var description = fields.ogDescription || fields.description || 'No description provided.'
  var image = fields.ogImage || ''
  var url = fields.ogUrl || fields.canonical || 'example.com'
  var siteName = fields.ogSiteName || 'Website'
  var card = fields.twitterCard || 'summary_large_image'

  try {
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '')
    var host = new URL(url).hostname
  } catch (e) {
    var host = url.replace(/^https?:\/\//, '').split('/')[0] || 'example.com'
  }

  return {
    title: title,
    description: description,
    image: image,
    url: url,
    hostname: host,
    siteName: siteName,
    twitterCard: card,
    hasImage: Boolean(image),
  }
}

export function ogPreviewFromHtml(html) {
  var meta = parseMetaFromHtml(html)
  if (meta.error) return { error: meta.error }
  return resolveOgPreview({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    ogTitle: meta.og.title || meta.title,
    ogDescription: meta.og.description || meta.description,
    ogImage: meta.og.image,
    ogUrl: meta.og.url || meta.canonical,
    ogSiteName: meta.og.siteName,
    twitterCard: meta.twitter.card,
  })
}
