// Document converter — pure functions (testable without CDN libs)
import { htmlToMarkdown } from './html-to-md.js'
import { markdownToHtml } from './markdown-to-html-core.js'
import { csvToJson, jsonToCsv } from './csv-parser.js'

export const ACCEPTED_EXTENSIONS = [
  'docx', 'doc', 'md', 'markdown', 'html', 'htm', 'rtf', 'epub', 'odt', 'csv', 'json', 'rst', 'txt',
]

export const OUTPUT_FORMATS = ['html', 'md', 'rtf', 'pdf', 'csv', 'json', 'txt']

export const CONVERSION_MATRIX = {
  docx: ['html', 'md', 'rtf', 'pdf', 'txt'],
  doc: ['html', 'md', 'txt'],
  md: ['html', 'rtf', 'pdf', 'txt'],
  html: ['md', 'rtf', 'pdf', 'txt'],
  rtf: ['txt', 'html', 'md'],
  epub: ['html', 'md', 'txt'],
  odt: ['html', 'md', 'txt'],
  csv: ['json', 'txt'],
  json: ['csv', 'txt'],
  rst: ['html', 'txt', 'md'],
  txt: ['md', 'html', 'rtf', 'txt'],
}

export function detectInputFormat(filename) {
  var ext = (filename.split('.').pop() || '').toLowerCase()
  if (ext === 'markdown') return 'md'
  if (ext === 'htm') return 'html'
  if (CONVERSION_MATRIX[ext]) return ext
  return 'txt'
}

export function getAvailableOutputs(inputFormat) {
  return CONVERSION_MATRIX[inputFormat] || ['txt']
}

export function getOutputExtension(format) {
  var map = {
    html: 'html',
    md: 'md',
    rtf: 'rtf',
    pdf: 'pdf',
    csv: 'csv',
    json: 'json',
    txt: 'txt',
  }
  return map[format] || 'txt'
}

export function getOutputMimeType(format) {
  var map = {
    html: 'text/html',
    md: 'text/markdown',
    rtf: 'application/rtf',
    pdf: 'application/pdf',
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain',
  }
  return map[format] || 'text/plain'
}

export function stripRtf(rtf) {
  if (!rtf) return ''
  var text = rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\line/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\\'[0-9a-f]{2}/gi, function (m) {
      return String.fromCharCode(parseInt(m.slice(2), 16))
    })
    .replace(/\\[a-z]+\d* ?/gi, '')
    .replace(/[{}]/g, '')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

export function textToRtf(text) {
  if (!text) return '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24 }'
  var escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\n/g, '\\par\n')
  return '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs24\n' + escaped + '\n}'
}

export function htmlToPlainText(html) {
  if (!html) return ''
  var doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent || '').replace(/\s+\n/g, '\n').trim()
}

export function rstToHtml(rst) {
  if (!rst || !rst.trim()) return ''
  var lines = rst.replace(/\r\n/g, '\n').split('\n')
  var html = []
  var inCode = false
  var codeLines = []

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]

    if (line.trim().startsWith('.. code-block::') || line.trim() === '::') {
      if (!inCode && line.trim() === '::') {
        inCode = true
        codeLines = []
        continue
      }
      if (line.trim().startsWith('.. code-block::')) {
        inCode = true
        codeLines = []
        continue
      }
    }

    if (inCode) {
      if (line.trim() === '' && codeLines.length > 0) {
        html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>')
        inCode = false
        codeLines = []
        continue
      }
      if (line.startsWith('   ') || line.startsWith('\t')) {
        codeLines.push(line.replace(/^(   |\t)/, ''))
        continue
      }
      if (codeLines.length) {
        html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>')
        codeLines = []
      }
      inCode = false
    }

    var titleMatch = line.match(/^([=`-~"#^+*]{3,})\s*$/)
    if (titleMatch && i > 0) {
      var prev = lines[i - 1].trim()
      if (prev) {
        var level = titleMatch[1].charAt(0) === '=' ? 1 : titleMatch[1].charAt(0) === '-' ? 2 : 3
        html.pop()
        html.push('<h' + level + '>' + escapeHtml(prev) + '</h' + level + '>')
        continue
      }
    }

    if (/^#{1,6}\s/.test(line)) {
      var h = line.match(/^(#{1,6})\s+(.+)$/)
      html.push('<h' + h[1].length + '>' + inlineRst(h[2]) + '</h' + h[1].length + '>')
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      html.push('<li>' + inlineRst(line.replace(/^[-*+]\s+/, '')) + '</li>')
      continue
    }

    if (!line.trim()) {
      html.push('')
      continue
    }

    if (line.startsWith('..')) continue
    html.push('<p>' + inlineRst(line) + '</p>')
  }

  if (codeLines.length) {
    html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>')
  }

  return wrapListItems(html.join('\n'))
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineRst(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/``([^`]+)``/g, '<code>$1</code>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function wrapListItems(html) {
  return html.replace(/((?:<li>.*?<\/li>\n?)+)/g, function (block) {
    return '<ul>\n' + block + '</ul>\n'
  })
}

export function odtXmlToHtml(xml) {
  if (!xml) return ''
  var doc = new DOMParser().parseFromString(xml, 'text/xml')
  var body = doc.querySelector('office\\:body, body')
  if (!body) body = doc.documentElement
  var parts = []
  var nodes = body.querySelectorAll('text\\:h, text\\:p, h, p')
  if (!nodes.length) {
    return '<p>' + escapeHtml(body.textContent || '').trim() + '</p>'
  }
  nodes.forEach(function (node) {
    var tag = (node.localName || node.tagName || '').toLowerCase()
    var text = (node.textContent || '').trim()
    if (!text) return
    if (tag === 'h' || tag.endsWith(':h')) {
      var level = parseInt(node.getAttribute('text:outline-level') || '1', 10)
      if (level < 1 || level > 6) level = 1
      parts.push('<h' + level + '>' + escapeHtml(text) + '</h' + level + '>')
    } else {
      parts.push('<p>' + escapeHtml(text) + '</p>')
    }
  })
  return parts.join('\n')
}

export function buildFilename(baseName, outputFormat) {
  var stem = baseName.replace(/\.[^.]+$/, '') || 'converted'
  return stem + '.' + getOutputExtension(outputFormat)
}

export function convertContent(parsed, outputFormat) {
  var html = parsed.html || ''
  var text = parsed.text || ''
  var json = parsed.json

  switch (outputFormat) {
    case 'html':
      if (html) return { type: 'html', content: wrapHtmlDocument(html) }
      if (parsed.format === 'md') return { type: 'html', content: wrapHtmlDocument(markdownToHtml(text)) }
      if (parsed.format === 'rst') return { type: 'html', content: wrapHtmlDocument(rstToHtml(text)) }
      return { type: 'html', content: wrapHtmlDocument('<pre>' + escapeHtml(text) + '</pre>') }

    case 'md':
      if (parsed.format === 'md') return { type: 'text', content: text }
      if (html) return { type: 'text', content: htmlToMarkdown(html) }
      return { type: 'text', content: text }

    case 'rtf':
      return { type: 'text', content: textToRtf(html ? htmlToPlainText(html) : text) }

    case 'txt':
      if (html) return { type: 'text', content: htmlToPlainText(html) }
      if (json !== undefined) return { type: 'text', content: typeof json === 'string' ? json : JSON.stringify(json, null, 2) }
      return { type: 'text', content: text }

    case 'json':
      if (json !== undefined) {
        return { type: 'text', content: typeof json === 'string' ? json : JSON.stringify(json, null, 2) }
      }
      if (parsed.format === 'csv') {
        return { type: 'text', content: JSON.stringify(csvToJson(text), null, 2) }
      }
      throw new Error('Cannot convert this file to JSON')

    case 'csv':
      if (parsed.format === 'csv') return { type: 'text', content: text }
      if (json !== undefined) {
        var data = typeof json === 'string' ? JSON.parse(json) : json
        if (!Array.isArray(data)) throw new Error('JSON must be an array to convert to CSV')
        return { type: 'text', content: jsonToCsv(data, ',') }
      }
      throw new Error('Cannot convert this file to CSV')

    case 'pdf':
      if (!html && parsed.format === 'md') html = markdownToHtml(text)
      if (!html && parsed.format === 'rst') html = rstToHtml(text)
      if (!html) html = '<pre>' + escapeHtml(text) + '</pre>'
      return { type: 'pdf', content: wrapHtmlDocument(html) }

    default:
      throw new Error('Unsupported output format')
  }
}

export function wrapHtmlDocument(bodyHtml) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;line-height:1.6;color:#1a1a18;padding:0 1rem}pre,code{font-family:monospace;background:#f7f7f5;padding:0.2em 0.4em;border-radius:4px}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #e8e8e4;padding:6px 10px}</style></head><body>' + bodyHtml + '</body></html>'
}

export function isPreviewable(format) {
  return format === 'html' || format === 'md' || format === 'txt' || format === 'json' || format === 'csv' || format === 'rtf'
}
