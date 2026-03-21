(function () {
  var baseInput = document.getElementById('tc-base')
  var pxInput = document.getElementById('tc-px')
  var ptInput = document.getElementById('tc-pt')
  var emInput = document.getElementById('tc-em')
  var remInput = document.getElementById('tc-rem')
  var pctInput = document.getElementById('tc-pct')
  var tableBody = document.getElementById('tc-table-body')

  var fields = [
    { id: 'px', el: pxInput },
    { id: 'pt', el: ptInput },
    { id: 'em', el: emInput },
    { id: 'rem', el: remInput },
    { id: '%', el: pctInput }
  ]

  var commonPx = [8, 10, 12, 14, 16, 18, 20, 24, 32, 36, 48, 64, 72, 96]

  function getBase() {
    var v = parseFloat(baseInput.value)
    return (v && v > 0) ? v : 16
  }

  function round(n) {
    return Math.round(n * 10000) / 10000
  }

  // All conversions go through px as intermediate
  function toPx(value, unit) {
    var base = getBase()
    switch (unit) {
      case 'px': return value
      case 'pt': return value * (96 / 72)
      case 'em': return value * base
      case 'rem': return value * base
      case '%': return value * base / 100
      default: return value
    }
  }

  function fromPx(px, unit) {
    var base = getBase()
    switch (unit) {
      case 'px': return px
      case 'pt': return px * (72 / 96)
      case 'em': return px / base
      case 'rem': return px / base
      case '%': return (px / base) * 100
      default: return px
    }
  }

  function updateFrom(sourceUnit) {
    var sourceField = null
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].id === sourceUnit) { sourceField = fields[i]; break }
    }
    if (!sourceField) return

    var val = parseFloat(sourceField.el.value)
    if (isNaN(val)) {
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].id !== sourceUnit) fields[i].el.value = ''
      }
      return
    }

    var px = toPx(val, sourceUnit)
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].id !== sourceUnit) {
        fields[i].el.value = round(fromPx(px, fields[i].id))
      }
    }
  }

  function buildTable() {
    var base = getBase()
    var html = ''
    for (var i = 0; i < commonPx.length; i++) {
      var px = commonPx[i]
      var pt = round(px * 72 / 96)
      var em = round(px / base)
      var rem = round(px / base)
      var pct = round((px / base) * 100)
      html += '<tr>' +
        '<td data-val="' + px + 'px">' + px + 'px</td>' +
        '<td data-val="' + pt + 'pt">' + pt + 'pt</td>' +
        '<td data-val="' + em + 'em">' + em + 'em</td>' +
        '<td data-val="' + rem + 'rem">' + rem + 'rem</td>' +
        '<td data-val="' + pct + '%">' + pct + '%</td>' +
        '</tr>'
    }
    tableBody.innerHTML = html
  }

  function copyText(text, el) {
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      if (el.tagName === 'BUTTON') {
        var orig = el.textContent
        el.textContent = 'Copied!'
        el.classList.add('copied')
        setTimeout(function () {
          el.textContent = orig
          el.classList.remove('copied')
        }, 2000)
      } else {
        el.classList.add('copied')
        setTimeout(function () { el.classList.remove('copied') }, 2000)
      }
    })
  }

  // Bind input events
  for (var i = 0; i < fields.length; i++) {
    (function (field) {
      field.el.addEventListener('input', function () {
        updateFrom(field.id)
      })
    })(fields[i])
  }

  baseInput.addEventListener('input', function () {
    buildTable()
    // Re-convert from whichever field has a value
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].el.value !== '') {
        updateFrom(fields[i].id)
        break
      }
    }
  })

  // Copy buttons
  var copyBtns = document.querySelectorAll('.tc-copy')
  for (var i = 0; i < copyBtns.length; i++) {
    (function (btn) {
      btn.addEventListener('click', function () {
        var unit = btn.getAttribute('data-unit')
        for (var j = 0; j < fields.length; j++) {
          if (fields[j].id === unit && fields[j].el.value !== '') {
            copyText(fields[j].el.value + (unit === '%' ? '%' : unit), btn)
            break
          }
        }
      })
    })(copyBtns[i])
  }

  // Table click to copy
  tableBody.addEventListener('click', function (e) {
    var td = e.target.closest('td')
    if (!td) return
    var val = td.getAttribute('data-val')
    if (val) copyText(val, td)
  })

  buildTable()
})()
