export function xmlNodeToObject(node) {
  var obj = {}

  // Collect attributes
  var attrs = {}
  if (node.attributes && node.attributes.length > 0) {
    for (var i = 0; i < node.attributes.length; i++) {
      attrs['@' + node.attributes[i].name] = node.attributes[i].value
    }
  }

  // Collect child elements
  var children = {}
  var textContent = ''
  for (var j = 0; j < node.childNodes.length; j++) {
    var child = node.childNodes[j]
    if (child.nodeType === 3) {
      // Text node
      var text = child.nodeValue.trim()
      if (text) textContent += text
    } else if (child.nodeType === 1) {
      var childResult = xmlNodeToObject(child)
      var childValue = childResult[child.nodeName]
      if (children[child.nodeName] !== undefined) {
        // Convert to array if repeated
        if (!Array.isArray(children[child.nodeName])) {
          children[child.nodeName] = [children[child.nodeName]]
        }
        children[child.nodeName].push(childValue)
      } else {
        children[child.nodeName] = childValue
      }
    }
  }

  var hasAttrs = Object.keys(attrs).length > 0
  var hasChildren = Object.keys(children).length > 0

  var value
  if (hasAttrs || hasChildren) {
    value = Object.assign({}, attrs, children)
    if (textContent) value['#text'] = textContent
  } else {
    value = textContent
  }

  obj[node.nodeName] = value
  return obj
}

export function parseXmlToJson(xmlStr, DOMParserClass) {
  var parser = new DOMParserClass()
  var doc = parser.parseFromString(xmlStr, 'application/xml')
  var root = doc.documentElement
  if (root.nodeName === 'parsererror') {
    throw new Error('XML parse error: ' + (root.textContent || 'invalid XML'))
  }
  return xmlNodeToObject(root)
}

export function convertXmlToJson(xmlStr, DOMParserClass) {
  if (!xmlStr || !xmlStr.trim()) {
    return { result: null, error: 'Input is empty' }
  }
  try {
    var obj = parseXmlToJson(xmlStr, DOMParserClass)
    return { result: JSON.stringify(obj, null, 2), error: null }
  } catch (e) {
    return { result: null, error: e.message || 'Invalid XML' }
  }
}
