;(function () {
  var template = document.getElementById('pv-template')
  var vars = document.getElementById('pv-vars')
  var output = document.getElementById('pv-output')
  var copy = document.getElementById('pv-copy')

  function render() {
    var text = template.value
    var map = {}
    vars.value.split('\n').forEach(function (line) {
      var idx = line.indexOf('=')
      if (idx > 0) map[line.slice(0, idx).trim()] = line.slice(idx + 1)
    })
    output.textContent = text.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, key) {
      return map[key] !== undefined ? map[key] : '{{' + key + '}}'
    })
  }

  ;[template, vars].forEach(function (el) { el.addEventListener('input', render) })
  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copy.textContent = 'Copied!'
      setTimeout(function () { copy.textContent = 'Copy' }, 2000)
    })
  })
  render()
})()
