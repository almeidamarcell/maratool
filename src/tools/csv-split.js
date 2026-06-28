import { splitCsv } from './csv-tools-core.js'

;(function () {
  var input = document.getElementById('cs-input')
  var size = document.getElementById('cs-size')
  var output = document.getElementById('cs-output')
  var splitBtn = document.getElementById('cs-split')

  splitBtn.addEventListener('click', function () {
    var chunks = splitCsv(input.value, parseInt(size.value, 10) || 100)
    output.innerHTML = chunks.map(function (c, i) {
      return '<div class="csv-chunk"><div class="csv-chunk-head">Part ' + (i + 1) + ' <button type="button" class="copy-btn cs-copy" data-i="' + i + '">Copy</button></div><textarea class="tool-textarea csv-chunk-body" rows="6" readonly>' + c.replace(/</g, '&lt;') + '</textarea></div>'
    }).join('')
    output.querySelectorAll('.cs-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ta = btn.closest('.csv-chunk').querySelector('textarea')
        navigator.clipboard.writeText(ta.value).then(function () {
          btn.textContent = 'Copied!'
          setTimeout(function () { btn.textContent = 'Copy' }, 2000)
        })
      })
    })
  })
})()
