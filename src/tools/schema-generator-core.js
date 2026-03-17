export function buildArticleSchema(fields) {
  var schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: fields.headline,
    author: { '@type': 'Person', name: fields.author },
    datePublished: fields.datePublished,
    url: fields.url,
  }
  if (fields.imageUrl) schema.image = fields.imageUrl
  return schema
}

export function buildProductSchema(fields) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: fields.name,
    description: fields.description,
    url: fields.url,
    offers: {
      '@type': 'Offer',
      price: fields.price,
      priceCurrency: fields.currency,
      availability: 'https://schema.org/' + fields.availability,
    },
  }
}

export function buildFaqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(function (item) {
      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      }
    }),
  }
}

export function buildHowToSchema(fields) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: fields.name,
    description: fields.description,
    step: (fields.steps || []).map(function (s, i) {
      return {
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
      }
    }),
  }
}

export function buildLocalBusinessSchema(fields) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: fields.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: fields.address,
    },
    telephone: fields.phone,
    url: fields.url,
    openingHours: fields.openingHours || undefined,
  }
}

export function buildPersonSchema(fields) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fields.name,
    jobTitle: fields.jobTitle,
    url: fields.url,
    email: fields.email,
  }
}

export function formatJsonLd(schemaObject) {
  return '<script type="application/ld+json">\n' +
    JSON.stringify(schemaObject, null, 2) +
    '\n</script>'
}
