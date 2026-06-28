import { validateJson } from './json-schema-validator-core.js'

;(function () {
  var instance = document.getElementById('jsv-instance')
  var schema = document.getElementById('jsv-schema')
  var output = document.getElementById('jsv-output')
  var validateBtn = document.getElementById('jsv-validate')

  validateBtn.addEventListener('click', function () {
    try {
      var inst = JSON.parse(instance.value || 'null')
      var sch = JSON.parse(schema.value || '{}')
      var r = validateJson(inst, sch)
      if (r.valid) {
        output.innerHTML = '<span style="color:#276749;font-weight:600;">✓ Valid — JSON matches schema</span>'
      } else {
        output.innerHTML = '<span style="color:#c53030;font-weight:600;">✗ Invalid</span><ul>' +
          r.errors.map(function (e) { return '<li>' + e + '</li>' }).join('') + '</ul>'
      }
    } catch (e) {
      output.innerHTML = '<span style="color:#c53030;">Parse error: ' + e.message + '</span>'
    }
  })
})()
