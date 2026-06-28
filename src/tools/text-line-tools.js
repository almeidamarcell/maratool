;(function () {
  var input = document.getElementById('tlt-input')
  var output = document.getElementById('tlt-output')
  var copyBtn = document.getElementById('tlt-copy')

  document.querySelectorAll('[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lines = input.value.split('\n')
      var action = btn.getAttribute('data-action')
      var result
      switch (action) {
        case 'sort-asc': result = lines.slice().sort(function (a, b) { return a.localeCompare(b) }); break
        case 'sort-desc': result = lines.slice().sort(function (a, b) { return b.localeCompare(a) }); break
        case 'dedup': result = [...new Set(lines)]; break
        case 'random': result = lines.slice().sort(function () { return Math.random() - 0.5 }); break
        case 'upper': result = lines.map(function (l) { return l.toUpperCase() }); break
        case 'lower': result = lines.map(function (l) { return l.toLowerCase() }); break
        case 'title': result = lines.map(function (l) { return l.replace(/\b\w/g, function (c) { return c.toUpperCase() }) }); break
        case 'reverse': result = lines.map(function (l) { return l.split('').reverse().join('') }); break
        default: return
      }
      output.value = result.join('\n')
    })
  })

  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copied!'
      setTimeout(function () { copyBtn.textContent = 'Copy' }, 2000)
    })
  })
})()
