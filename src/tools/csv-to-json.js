import './hash-state.js'
import { detectDelimiter, csvToJson, jsonToCsv } from './csv-parser.js'
// CSV to JSON Converter
;(function () {
  'use strict'

  // Tab switching
  var tabs = document.querySelectorAll('.tool-tab')
  var panels = document.querySelectorAll('.tab-panel')
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active') })
      panels.forEach(function (p) { p.style.display = 'none' })
      tab.classList.add('active')
      var target = document.getElementById(tab.dataset.panel)
      if (target) target.style.display = 'block'
    })
  })

  // CSV → JSON
  var csvInput = document.getElementById('c2j-csv')
  var jsonOutput = document.getElementById('c2j-json')
  var delimSelect = document.getElementById('c2j-delim')
  var copyJsonBtn = document.getElementById('c2j-copy-json')

  function convertCsvToJson() {
    var csv = csvInput.value.trim()
    if (!csv) { jsonOutput.value = ''; return }
    var delim = delimSelect.value === 'auto' ? detectDelimiter(csv) : delimSelect.value === 'tab' ? '\t' : delimSelect.value
    try {
      var result = csvToJson(csv, delim)
      jsonOutput.value = JSON.stringify(result, null, 2)
      jsonOutput.classList.remove('error-state')
    } catch (e) {
      jsonOutput.value = 'Error: ' + e.message
      jsonOutput.classList.add('error-state')
    }
  }

  csvInput.addEventListener('input', convertCsvToJson)
  delimSelect.addEventListener('change', convertCsvToJson)

  // JSON → CSV
  var jsonInput = document.getElementById('j2c-json')
  var csvOutput = document.getElementById('j2c-csv')
  var copyCsvBtn = document.getElementById('j2c-copy-csv')

  function convertJsonToCsv() {
    var json = jsonInput.value.trim()
    if (!json) { csvOutput.value = ''; return }
    try {
      var data = JSON.parse(json)
      if (!Array.isArray(data)) throw new Error('Input must be a JSON array')
      csvOutput.value = jsonToCsv(data, ',')
      csvOutput.classList.remove('error-state')
    } catch (e) {
      csvOutput.value = 'Error: ' + e.message
      csvOutput.classList.add('error-state')
    }
  }

  jsonInput.addEventListener('input', convertJsonToCsv)

  // Copy buttons
  function setupCopy(btn, textarea, label) {
    btn.addEventListener('click', function () {
      if (!textarea.value) return
      navigator.clipboard.writeText(textarea.value).then(function () {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(function () {
          btn.textContent = label
          btn.classList.remove('copied')
        }, 2000)
      })
    })
  }
  setupCopy(copyJsonBtn, jsonOutput, 'Copy JSON')
  setupCopy(copyCsvBtn, csvOutput, 'Copy CSV')
})()
