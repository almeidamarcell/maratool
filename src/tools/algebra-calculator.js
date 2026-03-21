(function () {
  'use strict'

  var exprInput = document.getElementById('ac-expression')
  var varInput = document.getElementById('ac-variable')
  var katexOutput = document.getElementById('ac-katex-output')
  var rawOutput = document.getElementById('ac-raw-output')
  var copyBtn = document.getElementById('ac-copy-btn')
  var errorEl = document.getElementById('ac-error')
  var loadingEl = document.getElementById('ac-loading')
  var opsContainer = document.getElementById('ac-ops')
  var chipsContainer = document.getElementById('ac-chips')

  var currentOp = 'simplify'
  var lastRaw = ''
  var nerdamerReady = false

  // Load nerdamer from CDN
  function loadNerdamer() {
    if (nerdamerReady) return Promise.resolve()
    if (window._nerdamerPromise) return window._nerdamerPromise
    loadingEl.style.display = ''
    window._nerdamerPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/nerdamer@1.1.13/all.min.js'
      script.onload = function () {
        nerdamerReady = true
        loadingEl.style.display = 'none'
        resolve()
      }
      script.onerror = function () {
        loadingEl.textContent = 'Failed to load algebra engine.'
        reject(new Error('Failed to load nerdamer'))
      }
      document.head.appendChild(script)
    })
    return window._nerdamerPromise
  }

  // Load KaTeX
  var katexReady = false
  function loadKatex() {
    if (katexReady || window.katex) { katexReady = true; return Promise.resolve() }
    if (window._katexPromise) return window._katexPromise
    window._katexPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js'
      script.onload = function () { katexReady = true; resolve() }
      script.onerror = function () { reject(new Error('Failed to load KaTeX')) }
      document.head.appendChild(script)
    })
    return window._katexPromise
  }

  // Operation switcher
  opsContainer.addEventListener('click', function (e) {
    var btn = e.target.closest('.ac-op')
    if (!btn) return
    var ops = opsContainer.querySelectorAll('.ac-op')
    for (var i = 0; i < ops.length; i++) ops[i].classList.remove('active')
    btn.classList.add('active')
    currentOp = btn.dataset.op
    compute()
  })

  // Example chips
  chipsContainer.addEventListener('click', function (e) {
    var chip = e.target.closest('.ac-chip')
    if (!chip) return
    exprInput.value = chip.dataset.expr
    compute()
  })

  // Input events
  exprInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') compute()
  })

  // Copy
  copyBtn.addEventListener('click', function () {
    if (!lastRaw) return
    navigator.clipboard.writeText(lastRaw).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = orig
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  function compute() {
    var expr = exprInput.value.trim()
    if (!expr) {
      katexOutput.innerHTML = ''
      rawOutput.textContent = ''
      errorEl.textContent = ''
      copyBtn.style.display = 'none'
      lastRaw = ''
      return
    }

    Promise.all([loadNerdamer(), loadKatex()]).then(function () {
      try {
        errorEl.textContent = ''
        var variable = varInput.value.trim() || 'x'
        var result
        var texStr

        // Handle equations with = sign for solve
        var cleanExpr = expr
        if (currentOp === 'solve' && expr.indexOf('=') !== -1) {
          var sides = expr.split('=')
          cleanExpr = '(' + sides[0].trim() + ') - (' + sides[1].trim() + ')'
        }

        switch (currentOp) {
          case 'simplify':
            result = nerdamer(cleanExpr)
            break
          case 'factor':
            result = nerdamer('factor(' + cleanExpr + ')')
            break
          case 'expand':
            result = nerdamer('expand(' + cleanExpr + ')')
            break
          case 'solve':
            result = nerdamer.solve(cleanExpr, variable)
            break
          case 'derivative':
            result = nerdamer('diff(' + cleanExpr + ', ' + variable + ')')
            break
          case 'integrate':
            result = nerdamer('integrate(' + cleanExpr + ', ' + variable + ')')
            break
        }

        lastRaw = result.text('fractions')
        rawOutput.textContent = lastRaw

        try {
          texStr = result.toTeX()
          if (currentOp === 'integrate') {
            texStr = texStr + ' + C'
          }
          katex.render(texStr, katexOutput, { displayMode: true, throwOnError: false })
        } catch (texErr) {
          katexOutput.textContent = lastRaw
        }

        copyBtn.style.display = ''
      } catch (err) {
        katexOutput.innerHTML = ''
        rawOutput.textContent = ''
        errorEl.textContent = 'Error: ' + (err.message || 'Invalid expression')
        copyBtn.style.display = 'none'
        lastRaw = ''
      }
    })
  }

  // Auto-compute on load if expression present
  if (exprInput.value.trim()) compute()
})()
