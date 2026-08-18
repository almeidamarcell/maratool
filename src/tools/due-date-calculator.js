(function () {
  var method = document.getElementById('ddc-method')
  var dateInput = document.getElementById('ddc-date')
  var cycle = document.getElementById('ddc-cycle')
  var cycleWrap = document.getElementById('ddc-cycle-wrap')
  var eddEl = document.getElementById('ddc-edd')
  var gaEl = document.getElementById('ddc-ga')
  var triEl = document.getElementById('ddc-trimester')
  var t2El = document.getElementById('ddc-t2')
  var t3El = document.getElementById('ddc-t3')
  var termEl = document.getElementById('ddc-term')
  var msgEl = document.getElementById('ddc-msg')

  var DAY = 86400000

  // Days added to the entered date to reach the EDD (ACOG CO 700):
  // LMP: Naegele's rule 280d (+ cycle adjustment); conception: 266d;
  // IVF: 261d from day-5 transfer, 263d from day-3 transfer.
  var OFFSETS = { lmp: 280, conception: 266, ivf5: 261, ivf3: 263 }

  function addDays(d, n) { return new Date(d.getTime() + n * DAY) }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function reset(msg) {
    eddEl.textContent = gaEl.textContent = triEl.textContent = '—'
    t2El.textContent = t3El.textContent = termEl.textContent = '—'
    msgEl.textContent = msg || ''
  }

  function update() {
    cycleWrap.hidden = method.value !== 'lmp'
    if (!dateInput.value) { reset(''); return }
    var parts = dateInput.value.split('-')
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    if (isNaN(d.getTime())) { reset(''); return }

    var offset = OFFSETS[method.value]
    if (method.value === 'lmp') {
      var c = parseInt(cycle.value, 10)
      if (isNaN(c) || c < 20 || c > 45) c = 28
      offset += c - 28
    }
    var edd = addDays(d, offset)
    var lmpEq = addDays(edd, -280) // gestational-age zero point

    var today = new Date()
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    var gaDays = Math.floor((today.getTime() - lmpEq.getTime()) / DAY)

    eddEl.textContent = fmtDate(edd)
    t2El.textContent = fmtDate(addDays(lmpEq, 98))   // 14w0d
    t3El.textContent = fmtDate(addDays(lmpEq, 196))  // 28w0d
    termEl.textContent = fmtDate(addDays(lmpEq, 273)) // 39w0d

    if (gaDays < 0) {
      gaEl.textContent = triEl.textContent = '—'
      msgEl.textContent = 'The entered date is in the future — gestational age starts counting from it.'
      return
    }
    if (gaDays > 315) { // 45 weeks
      gaEl.textContent = triEl.textContent = '—'
      msgEl.textContent = 'That date is more than 45 weeks ago — check the date or method.'
      return
    }
    var w = Math.floor(gaDays / 7)
    var rem = gaDays % 7
    gaEl.textContent = w + 'w ' + rem + 'd'
    triEl.textContent = w < 14 ? '1st' : w < 28 ? '2nd' : '3rd'
    msgEl.textContent = ''
  }

  method.addEventListener('change', update)
  dateInput.addEventListener('change', update)
  dateInput.addEventListener('input', update)
  cycle.addEventListener('input', update)

  update()
})()
