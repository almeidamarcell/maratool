(function () {
  var exprDisplay = document.getElementById('sc-expr')
  var resultDisplay = document.getElementById('sc-result')
  var buttonsContainer = document.getElementById('sc-buttons')
  var historyList = document.getElementById('sc-history-list')
  var clearHistoryBtn = document.getElementById('sc-clear-history')
  var degBtn = document.getElementById('sc-deg-btn')
  var radBtn = document.getElementById('sc-rad-btn')
  var memIndicator = document.getElementById('sc-mem-indicator')

  var expression = ''
  var lastAnswer = 0
  var memory = 0
  var angleMode = 'deg' // 'deg' or 'rad'
  var history = []
  var justEvaluated = false

  function updateDisplay() {
    exprDisplay.textContent = expression || '\u00A0'
    memIndicator.textContent = memory !== 0 ? 'M' : ''
  }

  function setResult(val) {
    resultDisplay.textContent = val
  }

  function prepareExpression(expr) {
    var prepared = expr
    // Replace display symbols with math.js syntax
    prepared = prepared.replace(/\u00d7/g, '*')
    prepared = prepared.replace(/\u00f7/g, '/')
    prepared = prepared.replace(/\u2212/g, '-')
    prepared = prepared.replace(/\u03c0/g, 'pi')

    // Handle factorial: "5!" -> "factorial(5)"
    prepared = prepared.replace(/(\d+)!/g, 'factorial($1)')

    // Handle implicit multiplication: "2pi" -> "2*pi", "2(" -> "2*("
    prepared = prepared.replace(/(\d)(pi|e|sin|cos|tan|asin|acos|atan|log|ln|exp|abs|sqrt)/g, '$1*$2')
    prepared = prepared.replace(/(\d)\(/g, '$1*(')
    prepared = prepared.replace(/\)([\d])/g, ')*$1')
    prepared = prepared.replace(/\)\(/g, ')*(')

    // Handle angle mode for trig functions
    if (angleMode === 'deg') {
      prepared = prepared.replace(/\bsin\(/g, 'sin(pi/180*')
      prepared = prepared.replace(/\bcos\(/g, 'cos(pi/180*')
      prepared = prepared.replace(/\btan\(/g, 'tan(pi/180*')
      // Inverse trig returns radians, convert to degrees
      prepared = prepared.replace(/\basin\(/g, '(180/pi*asin(')
      prepared = prepared.replace(/\bacos\(/g, '(180/pi*acos(')
      prepared = prepared.replace(/\batan\(/g, '(180/pi*atan(')
    }

    // Replace 'ln' with 'log' (math.js uses log for natural log)
    prepared = prepared.replace(/\bln\(/g, 'log(')
    // Replace 'log(' with 'log10(' for base-10 log
    // But be careful not to double-replace. We mark log10 distinctly.
    // Actually math.js log is natural log, log10 is base-10
    // Our UI "log" means base-10, "ln" means natural
    // ln -> already replaced to log above. log -> log10
    // We need to handle ordering: first replace 'ln(' -> 'log(', then 'log(' that were original -> 'log10('
    // Redo: let's use placeholders
    prepared = prepared.replace(/\blog10\(/g, '__LOG10__(')
    // Now remaining 'log(' that aren't __LOG10__ are natural logs (from ln replacement)
    // We need the original 'log(' (base-10) to become 'log10('
    // Reset approach:
    return prepared
  }

  // Better approach: handle ln and log separately
  function prepareExpressionV2(expr) {
    var prepared = expr

    // Replace display symbols
    prepared = prepared.replace(/×/g, '*')
    prepared = prepared.replace(/÷/g, '/')
    prepared = prepared.replace(/−/g, '-')

    // Handle factorial
    prepared = prepared.replace(/(\d+(\.\d+)?)!/g, 'factorial($1)')

    // Mark 'ln(' as natural log and 'log(' as base-10
    prepared = prepared.replace(/\bln\(/g, '___NATLOG___(')
    prepared = prepared.replace(/\blog\(/g, 'log10(')
    prepared = prepared.replace(/___NATLOG___\(/g, 'log(')

    // Replace constants
    prepared = prepared.replace(/\bpi\b/g, 'pi')

    // Handle angle mode for trig functions
    if (angleMode === 'deg') {
      // Inverse trig: result * 180/pi
      prepared = prepared.replace(/\basin\(/g, '___ASIN___(')
      prepared = prepared.replace(/\bacos\(/g, '___ACOS___(')
      prepared = prepared.replace(/\batan\(/g, '___ATAN___(')

      prepared = prepared.replace(/\bsin\(/g, 'sin(pi/180*')
      prepared = prepared.replace(/\bcos\(/g, 'cos(pi/180*')
      prepared = prepared.replace(/\btan\(/g, 'tan(pi/180*')

      prepared = prepared.replace(/___ASIN___\(/g, '(180/pi)*asin(')
      prepared = prepared.replace(/___ACOS___\(/g, '(180/pi)*acos(')
      prepared = prepared.replace(/___ATAN___\(/g, '(180/pi)*atan(')
    }

    // Implicit multiplication
    prepared = prepared.replace(/(\d)(pi|e\b|sin|cos|tan|asin|acos|atan|log10|log|exp|abs|sqrt)/g, '$1*$2')
    prepared = prepared.replace(/(\d)\(/g, '$1*(')
    prepared = prepared.replace(/\)([\d])/g, ')*$1')
    prepared = prepared.replace(/\)\(/g, ')*(')
    prepared = prepared.replace(/(pi|e)\(/g, '$1*(')

    // mod -> %
    prepared = prepared.replace(/\bmod\b/g, '%')

    return prepared
  }

  function evaluate() {
    if (!expression) return
    try {
      var prepared = prepareExpressionV2(expression)
      var result = math.evaluate(prepared)
      if (typeof result === 'object' && result.entries) {
        result = result.entries[result.entries.length - 1]
      }
      var numResult = typeof result === 'number' ? result : parseFloat(result)
      if (isNaN(numResult) || !isFinite(numResult)) {
        setResult('Error')
        return
      }
      // Round to avoid floating point display issues
      var displayResult = Math.abs(numResult) < 1e-14 ? 0 : numResult
      var formatted = Number.isInteger(displayResult) ? String(displayResult) : parseFloat(displayResult.toPrecision(12)).toString()
      setResult(formatted)
      lastAnswer = numResult

      // Add to history
      history.unshift({ expr: expression, result: formatted })
      if (history.length > 20) history.pop()
      renderHistory()

      expression = formatted
      justEvaluated = true
    } catch (e) {
      setResult('Error')
    }
  }

  function appendToExpression(text) {
    if (justEvaluated) {
      // If user types a number or function after evaluating, start fresh
      // If they type an operator, continue from result
      if (/^[0-9.]$/.test(text) || /^(sin|cos|tan|asin|acos|atan|log|ln|exp|abs|sqrt)$/.test(text)) {
        expression = ''
        setResult('0')
      }
      justEvaluated = false
    }
    expression += text
    updateDisplay()
  }

  function handleAction(action) {
    switch (action) {
      case 'clear':
        expression = ''
        justEvaluated = false
        setResult('0')
        updateDisplay()
        break
      case 'backspace':
        if (justEvaluated) {
          expression = ''
          justEvaluated = false
          setResult('0')
          updateDisplay()
          return
        }
        // Remove last function or character
        var fns = ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', 'exp(', 'abs(', 'sqrt(', 'mod']
        var removed = false
        for (var i = 0; i < fns.length; i++) {
          if (expression.endsWith(fns[i])) {
            expression = expression.slice(0, -fns[i].length)
            removed = true
            break
          }
        }
        if (!removed) {
          expression = expression.slice(0, -1)
        }
        updateDisplay()
        break
      case '=':
        evaluate()
        break
      case 'sin': case 'cos': case 'tan':
      case 'asin': case 'acos': case 'atan':
      case 'log': case 'ln': case 'exp': case 'abs': case 'sqrt':
        appendToExpression(action + '(')
        break
      case 'pow':
        appendToExpression('^')
        break
      case 'fact':
        appendToExpression('!')
        break
      case 'pi':
        appendToExpression('pi')
        break
      case 'e':
        appendToExpression('e')
        break
      case 'mod':
        appendToExpression(' mod ')
        break
      case 'ans':
        appendToExpression(String(lastAnswer))
        break
      case 'mc':
        memory = 0
        memIndicator.textContent = ''
        break
      case 'mr':
        appendToExpression(String(memory))
        break
      case 'm+':
        var cur = parseFloat(resultDisplay.textContent)
        if (!isNaN(cur)) { memory += cur; memIndicator.textContent = 'M' }
        break
      case 'm-':
        var cur2 = parseFloat(resultDisplay.textContent)
        if (!isNaN(cur2)) { memory -= cur2; memIndicator.textContent = memory !== 0 ? 'M' : '' }
        break
      default:
        appendToExpression(action)
        break
    }
  }

  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<p class="sc-history-empty">No calculations yet.</p>'
      return
    }
    var html = ''
    for (var i = 0; i < history.length; i++) {
      html += '<div class="sc-history-item" data-idx="' + i + '">' +
        '<div class="sc-history-expr">' + escapeHtml(history[i].expr) + '</div>' +
        '<div class="sc-history-result">= ' + escapeHtml(history[i].result) + '</div>' +
        '</div>'
    }
    historyList.innerHTML = html
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  // Button clicks
  buttonsContainer.addEventListener('click', function (e) {
    var btn = e.target.closest('.sc-btn')
    if (!btn) return
    handleAction(btn.dataset.action)
  })

  // Angle mode toggle
  degBtn.addEventListener('click', function () {
    angleMode = 'deg'
    degBtn.classList.add('active')
    radBtn.classList.remove('active')
  })
  radBtn.addEventListener('click', function () {
    angleMode = 'rad'
    radBtn.classList.add('active')
    degBtn.classList.remove('active')
  })

  // History clicks
  historyList.addEventListener('click', function (e) {
    var item = e.target.closest('.sc-history-item')
    if (!item) return
    var idx = parseInt(item.dataset.idx)
    expression = history[idx].expr
    setResult(history[idx].result)
    justEvaluated = true
    updateDisplay()
  })

  clearHistoryBtn.addEventListener('click', function () {
    history = []
    renderHistory()
  })

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    // Don't capture if typing in another input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    var key = e.key
    if (/^[0-9.]$/.test(key)) {
      handleAction(key)
      e.preventDefault()
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      handleAction(key)
      e.preventDefault()
    } else if (key === '(' || key === ')') {
      handleAction(key)
      e.preventDefault()
    } else if (key === 'Enter' || key === '=') {
      handleAction('=')
      e.preventDefault()
    } else if (key === 'Backspace') {
      handleAction('backspace')
      e.preventDefault()
    } else if (key === 'Escape') {
      handleAction('clear')
      e.preventDefault()
    } else if (key === '%') {
      handleAction('%')
      e.preventDefault()
    } else if (key === '^') {
      handleAction('^')
      e.preventDefault()
    }
  })

  // Init
  updateDisplay()
  renderHistory()
})()
