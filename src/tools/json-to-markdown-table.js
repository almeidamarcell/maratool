import './hash-state.js'
// JSON to Markdown Table
;(function () {
  'use strict'

  var input = document.getElementById('jmt-input')
  var output = document.getElementById('jmt-output')
  var copyBtn = document.getElementById('jmt-copy')
  var alignSelect = document.getElementById('jmt-align')

  function escapeCell(val) {
    if (val === null || val === undefined) return ''
    var s = typeof val === 'object' ? JSON.stringify(val) : String(val)
    return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
  }

  function jsonToMarkdownTable(jsonStr, align) {
    var data
    try {
      data = JSON.parse(jsonStr)
    } catch (e) {
      return { error: 'Invalid JSON: ' + e.message }
    }

    if (!Array.isArray(data)) {
      return { error: 'Input must be a JSON array of objects.' }
    }
    if (data.length === 0) {
      return { error: 'Array is empty.' }
    }

    // Collect all unique keys
    var keys = []
    var seen = {}
    for (var i = 0; i < data.length; i++) {
      if (typeof data[i] !== 'object' || data[i] === null) continue
      var objKeys = Object.keys(data[i])
      for (var j = 0; j < objKeys.length; j++) {
        if (!seen[objKeys[j]]) {
          seen[objKeys[j]] = true
          keys.push(objKeys[j])
        }
      }
    }

    if (keys.length === 0) {
      return { error: 'No object keys found.' }
    }

    // Header
    var header = '| ' + keys.join(' | ') + ' |'

    // Separator
    var sep
    if (align === 'center') {
      sep = '| ' + keys.map(function () { return ':---:' }).join(' | ') + ' |'
    } else if (align === 'right') {
      sep = '| ' + keys.map(function () { return '---:' }).join(' | ') + ' |'
    } else {
      sep = '| ' + keys.map(function () { return '---' }).join(' | ') + ' |'
    }

    // Rows
    var rows = data.map(function (obj) {
      if (typeof obj !== 'object' || obj === null) return '| ' + keys.map(function () { return '' }).join(' | ') + ' |'
      return '| ' + keys.map(function (k) { return escapeCell(obj[k]) }).join(' | ') + ' |'
    })

    return { result: header + '\n' + sep + '\n' + rows.join('\n') }
  }

  function convert() {
    var value = input.value.trim()
    if (!value) {
      output.value = ''
      return
    }
    var align = alignSelect ? alignSelect.value : 'left'
    var res = jsonToMarkdownTable(value, align)
    if (res.error) {
      output.value = res.error
      output.classList.add('error-state')
    } else {
      output.value = res.result
      output.classList.remove('error-state')
    }
  }

  input.addEventListener('input', function () {
    convert()
    HashState.save({ input: input.value, align: alignSelect.value })
  })

  if (alignSelect) {
    alignSelect.addEventListener('change', function () {
      convert()
      HashState.save({ input: input.value, align: alignSelect.value })
    })
  }

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy Markdown'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore state
  var saved = HashState.parse()
  if (saved.align && alignSelect) alignSelect.value = saved.align
  if (saved.input) {
    input.value = saved.input
    convert()
  }
})()
