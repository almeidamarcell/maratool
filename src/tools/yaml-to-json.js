import './hash-state.js'
import { convertYamlToJson, convertJsonToYaml } from './yaml-to-json-core.js'
// YAML to JSON Converter
;(function () {
  var CDN = 'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js'
  var jsYaml = null

  var yamlInput = document.getElementById('ytj-yaml-input')
  var jsonInput = document.getElementById('ytj-json-input')
  var yamlOutput = document.getElementById('ytj-yaml-output')
  var jsonOutput = document.getElementById('ytj-json-output')
  var yamlError = document.getElementById('ytj-yaml-error')
  var jsonError = document.getElementById('ytj-json-error')
  var copyYamlBtn = document.getElementById('ytj-copy-yaml')
  var copyJsonBtn = document.getElementById('ytj-copy-json')

  function setError(el, msg) {
    if (el) { el.textContent = msg; el.style.display = msg ? '' : 'none' }
  }

  function convertYaml() {
    if (!jsYaml) return
    var result = convertYamlToJson(yamlInput.value, jsYaml)
    if (result.error) {
      jsonOutput.value = ''
      setError(yamlError, result.error)
    } else {
      jsonOutput.value = result.result
      setError(yamlError, '')
    }
  }

  function convertJson() {
    if (!jsYaml) return
    var result = convertJsonToYaml(jsonInput.value, jsYaml)
    if (result.error) {
      yamlOutput.value = ''
      setError(jsonError, result.error)
    } else {
      yamlOutput.value = result.result
      setError(jsonError, '')
    }
  }

  function makeCopy(btn, getContent) {
    btn.addEventListener('click', function () {
      var text = getContent()
      if (!text) return
      navigator.clipboard.writeText(text).then(function () {
        var orig = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(function () { btn.textContent = orig }, 2000)
      })
    })
  }

  function loadLibrary() {
    var s = document.createElement('script')
    s.src = CDN
    s.onload = function () {
      jsYaml = window.jsyaml
      convertYaml()
    }
    document.head.appendChild(s)
  }

  if (yamlInput) yamlInput.addEventListener('input', convertYaml)
  if (jsonInput) jsonInput.addEventListener('input', convertJson)
  if (copyJsonBtn) makeCopy(copyJsonBtn, function () { return jsonOutput.value })
  if (copyYamlBtn) makeCopy(copyYamlBtn, function () { return yamlOutput.value })

  loadLibrary()
})()
