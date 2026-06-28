// Markdown to HTML — pure function for common GFM subset
// Tested in markdown-to-html-core.test.js

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineFormat(text) {
  var result = escapeHtml(text)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return result
}

export function markdownToHtml(markdown) {
  if (!markdown || !markdown.trim()) return ''

  var lines = markdown.replace(/\r\n/g, '\n').split('\n')
  var html = []
  var inCode = false
  var codeLines = []
  var inUl = false
  var inOl = false

  function closeLists() {
    if (inUl) { html.push('</ul>'); inUl = false }
    if (inOl) { html.push('</ol>'); inOl = false }
  }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i]

    if (line.trim().startsWith('```')) {
      closeLists()
      if (inCode) {
        html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>')
        codeLines = []
        inCode = false
      } else {
        inCode = true
      }
      continue
    }

    if (inCode) {
      codeLines.push(line)
      continue
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      closeLists()
      html.push('<hr>')
      continue
    }

    var heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      closeLists()
      var level = heading[1].length
      html.push('<h' + level + '>' + inlineFormat(heading[2]) + '</h' + level + '>')
      continue
    }

    var ul = line.match(/^[-*+]\s+(.+)$/)
    if (ul) {
      if (inOl) { html.push('</ol>'); inOl = false }
      if (!inUl) { html.push('<ul>'); inUl = true }
      html.push('<li>' + inlineFormat(ul[1]) + '</li>')
      continue
    }

    var ol = line.match(/^\d+\.\s+(.+)$/)
    if (ol) {
      if (inUl) { html.push('</ul>'); inUl = false }
      if (!inOl) { html.push('<ol>'); inOl = true }
      html.push('<li>' + inlineFormat(ol[1]) + '</li>')
      continue
    }

    var bq = line.match(/^>\s?(.+)$/)
    if (bq) {
      closeLists()
      html.push('<blockquote><p>' + inlineFormat(bq[1]) + '</p></blockquote>')
      continue
    }

    if (!line.trim()) {
      closeLists()
      continue
    }

    closeLists()
    html.push('<p>' + inlineFormat(line) + '</p>')
  }

  if (inCode && codeLines.length) {
    html.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>')
  }
  closeLists()

  return html.join('\n')
}
