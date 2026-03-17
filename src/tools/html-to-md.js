// HTML to Markdown converter — pure function, uses DOMParser
// Tested in html-to-md.test.js

export function htmlToMarkdown(html) {
  if (!html || !html.trim()) return ''
  var doc = new DOMParser().parseFromString(html, 'text/html')
  return processNode(doc.body).trim()
}

function processNode(node) {
  if (node.nodeType === 3) {
    // Text node
    return node.textContent
  }
  if (node.nodeType !== 1) return ''

  var tag = node.tagName.toLowerCase()
  var children = processChildren(node)

  switch (tag) {
    case 'h1': return '\n\n# ' + children.trim() + '\n\n'
    case 'h2': return '\n\n## ' + children.trim() + '\n\n'
    case 'h3': return '\n\n### ' + children.trim() + '\n\n'
    case 'h4': return '\n\n#### ' + children.trim() + '\n\n'
    case 'h5': return '\n\n##### ' + children.trim() + '\n\n'
    case 'h6': return '\n\n###### ' + children.trim() + '\n\n'
    case 'p': return '\n\n' + children.trim() + '\n\n'
    case 'br': return '\n'
    case 'hr': return '\n\n---\n\n'
    case 'strong':
    case 'b': return '**' + children + '**'
    case 'em':
    case 'i': return '*' + children + '*'
    case 'code':
      if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') return children
      return '`' + children + '`'
    case 'pre': {
      var codeEl = node.querySelector('code')
      var text = codeEl ? codeEl.textContent : node.textContent
      return '\n\n```\n' + text + '\n```\n\n'
    }
    case 'blockquote': {
      var lines = children.trim().split('\n')
      return '\n\n' + lines.map(function (l) { return '> ' + l }).join('\n') + '\n\n'
    }
    case 'a': {
      var href = node.getAttribute('href') || ''
      return '[' + children + '](' + href + ')'
    }
    case 'img': {
      var alt = node.getAttribute('alt') || ''
      var src = node.getAttribute('src') || ''
      return '![' + alt + '](' + src + ')'
    }
    case 'ul': return '\n\n' + processListItems(node, 'ul') + '\n\n'
    case 'ol': return '\n\n' + processListItems(node, 'ol') + '\n\n'
    case 'li': return children
    case 'table': return '\n\n' + processTable(node) + '\n\n'
    case 'div':
    case 'span':
    case 'section':
    case 'article':
    case 'main':
    case 'header':
    case 'footer':
    case 'nav':
      return children
    default:
      return children
  }
}

function processChildren(node) {
  var result = ''
  for (var i = 0; i < node.childNodes.length; i++) {
    result += processNode(node.childNodes[i])
  }
  return result
}

function processListItems(node, type) {
  var items = []
  var idx = 1
  for (var i = 0; i < node.children.length; i++) {
    if (node.children[i].tagName.toLowerCase() === 'li') {
      var prefix = type === 'ol' ? idx + '. ' : '- '
      items.push(prefix + processChildren(node.children[i]).trim())
      idx++
    }
  }
  return items.join('\n')
}

function processTable(table) {
  var rows = table.querySelectorAll('tr')
  if (rows.length === 0) return ''

  var result = []
  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].querySelectorAll('th, td')
    var rowCells = []
    for (var j = 0; j < cells.length; j++) {
      rowCells.push(processChildren(cells[j]).trim().replace(/\|/g, '\\|'))
    }
    result.push('| ' + rowCells.join(' | ') + ' |')
    if (i === 0) {
      result.push('| ' + rowCells.map(function () { return '---' }).join(' | ') + ' |')
    }
  }
  return result.join('\n')
}
