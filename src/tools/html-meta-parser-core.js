// Parse meta tags from pasted HTML — shared by meta-tag-checker and open-graph-preview

export function parseMetaFromHtml(html) {
  if (!html || !html.trim()) {
    return { error: 'HTML is empty' }
  }
  var doc = new DOMParser().parseFromString(html, 'text/html')
  if (doc.querySelector('parsererror')) {
    return { error: 'Could not parse HTML' }
  }

  function metaContent(name, attr) {
    attr = attr || 'name'
    var el = doc.querySelector('meta[' + attr + '="' + name + '"]')
    return el ? el.getAttribute('content') || '' : ''
  }

  function metaProperty(prop) {
    return metaContent(prop, 'property')
  }

  var titleEl = doc.querySelector('title')
  var canonicalEl = doc.querySelector('link[rel="canonical"]')

  return {
    title: titleEl ? titleEl.textContent.trim() : '',
    description: metaContent('description'),
    robots: metaContent('robots'),
    canonical: canonicalEl ? canonicalEl.getAttribute('href') || '' : '',
    og: {
      title: metaProperty('og:title'),
      description: metaProperty('og:description'),
      url: metaProperty('og:url'),
      image: metaProperty('og:image'),
      type: metaProperty('og:type'),
      siteName: metaProperty('og:site_name'),
    },
    twitter: {
      card: metaContent('twitter:card'),
      title: metaContent('twitter:title'),
      description: metaContent('twitter:description'),
      image: metaContent('twitter:image'),
      site: metaContent('twitter:site'),
    },
  }
}
