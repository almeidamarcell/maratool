import { countTitle, countDescription } from './meta-tag-generator-core.js'

export function analyzeMetaTags(meta) {
  if (meta.error) return { error: meta.error, issues: [], score: 0 }

  var issues = []

  if (!meta.title) {
    issues.push({ level: 'error', field: 'title', message: 'Missing <title> tag' })
  } else {
    var t = countTitle(meta.title)
    if (t.status === 'short') issues.push({ level: 'warn', field: 'title', message: 'Title is short (' + t.count + ' chars) — aim for 50–60' })
    if (t.status === 'long') issues.push({ level: 'warn', field: 'title', message: 'Title may truncate in search (' + t.count + ' chars) — aim for 50–60' })
    if (t.status === 'ok') issues.push({ level: 'ok', field: 'title', message: 'Title length looks good (' + t.count + ' chars)' })
  }

  if (!meta.description) {
    issues.push({ level: 'error', field: 'description', message: 'Missing meta description' })
  } else {
    var d = countDescription(meta.description)
    if (d.status === 'short') issues.push({ level: 'warn', field: 'description', message: 'Description is short (' + d.count + ' chars) — aim for 140–160' })
    if (d.status === 'long') issues.push({ level: 'warn', field: 'description', message: 'Description may truncate (' + d.count + ' chars) — aim for 140–160' })
    if (d.status === 'ok') issues.push({ level: 'ok', field: 'description', message: 'Description length looks good (' + d.count + ' chars)' })
  }

  if (!meta.canonical) {
    issues.push({ level: 'warn', field: 'canonical', message: 'No canonical URL — add <link rel="canonical"> to avoid duplicate content issues' })
  } else {
    issues.push({ level: 'ok', field: 'canonical', message: 'Canonical URL set' })
  }

  if (!meta.og.title && !meta.og.description) {
    issues.push({ level: 'warn', field: 'og', message: 'No Open Graph tags — social shares will look plain' })
  } else {
    if (!meta.og.title) issues.push({ level: 'warn', field: 'og:title', message: 'Missing og:title' })
    if (!meta.og.description) issues.push({ level: 'warn', field: 'og:description', message: 'Missing og:description' })
    if (!meta.og.image) issues.push({ level: 'warn', field: 'og:image', message: 'Missing og:image — link previews won\'t show an image' })
    if (meta.og.title && meta.og.description) {
      issues.push({ level: 'ok', field: 'og', message: 'Open Graph basics present' })
    }
  }

  if (!meta.twitter.card) {
    issues.push({ level: 'warn', field: 'twitter', message: 'No twitter:card tag — Twitter/X will guess the preview format' })
  } else {
    issues.push({ level: 'ok', field: 'twitter', message: 'Twitter Card type set (' + meta.twitter.card + ')' })
  }

  var errors = issues.filter(function (i) { return i.level === 'error' }).length
  var warns = issues.filter(function (i) { return i.level === 'warn' }).length
  var oks = issues.filter(function (i) { return i.level === 'ok' }).length
  var score = Math.max(0, Math.min(100, oks * 15 - errors * 25 - warns * 8 + 40))

  return { issues: issues, score: score, summary: { errors: errors, warnings: warns, passed: oks } }
}
