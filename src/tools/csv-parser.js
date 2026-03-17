// CSV Parser — pure functions, no DOM
// Used by csv-to-json.js tool and tested in csv-parser.test.js

export function detectDelimiter(text) {
  var firstLine = text.split('\n')[0] || ''
  var counts = { ',': 0, ';': 0, '\t': 0 }
  var inQuote = false
  for (var i = 0; i < firstLine.length; i++) {
    if (firstLine[i] === '"') { inQuote = !inQuote; continue }
    if (!inQuote && counts.hasOwnProperty(firstLine[i])) {
      counts[firstLine[i]]++
    }
  }
  if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';'] && counts['\t'] > 0) return '\t'
  if (counts[';'] > counts[',']) return ';'
  return ','
}

export function parseCsv(text, delimiter) {
  if (!delimiter) delimiter = detectDelimiter(text)
  var rows = []
  var row = []
  var cell = ''
  var inQuote = false
  var i = 0
  var len = text.length

  while (i < len) {
    var ch = text[i]
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuote = false
        i++
        continue
      }
      cell += ch
      i++
    } else {
      if (ch === '"') {
        inQuote = true
        i++
      } else if (ch === delimiter) {
        row.push(cell)
        cell = ''
        i++
      } else if (ch === '\r') {
        // Skip \r, handle \r\n
        i++
        if (i < len && text[i] === '\n') i++
        row.push(cell)
        cell = ''
        if (row.length > 1 || row[0] !== '') rows.push(row)
        row = []
      } else if (ch === '\n') {
        row.push(cell)
        cell = ''
        if (row.length > 1 || row[0] !== '') rows.push(row)
        row = []
        i++
      } else {
        cell += ch
        i++
      }
    }
  }
  // Last cell/row
  row.push(cell)
  if (row.length > 1 || row[0] !== '') rows.push(row)

  if (rows.length === 0) return { headers: [], rows: [] }
  return { headers: rows[0], rows: rows.slice(1) }
}

export function csvToJson(text, delimiter) {
  var parsed = parseCsv(text, delimiter)
  if (parsed.headers.length === 0) return []
  return parsed.rows.map(function (row) {
    var obj = {}
    parsed.headers.forEach(function (h, idx) {
      obj[h] = idx < row.length ? row[idx] : ''
    })
    return obj
  })
}

export function jsonToCsv(jsonArray, delimiter) {
  if (!delimiter) delimiter = ','
  if (!Array.isArray(jsonArray) || jsonArray.length === 0) return ''

  // Collect all keys
  var keys = []
  var seen = {}
  jsonArray.forEach(function (obj) {
    if (typeof obj !== 'object' || obj === null) return
    Object.keys(obj).forEach(function (k) {
      if (!seen[k]) { seen[k] = true; keys.push(k) }
    })
  })

  function escapeField(val) {
    var s = val === null || val === undefined ? '' : String(val)
    if (s.indexOf(delimiter) !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  var header = keys.map(escapeField).join(delimiter)
  var rows = jsonArray.map(function (obj) {
    if (typeof obj !== 'object' || obj === null) return keys.map(function () { return '' }).join(delimiter)
    return keys.map(function (k) { return escapeField(obj[k]) }).join(delimiter)
  })

  return header + '\n' + rows.join('\n')
}
