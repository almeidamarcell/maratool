(function () {
  var type = document.getElementById('hsc-type')
  var val = document.getElementById('hsc-value')
  var outCm = document.getElementById('hsc-cm')
  var outIn = document.getElementById('hsc-in')
  var outUs = document.getElementById('hsc-us')
  var outUk = document.getElementById('hsc-uk')
  var outLetter = document.getElementById('hsc-letter')
  var msg = document.getElementById('hsc-msg')

  var CM_IN = 2.54

  var EIGHTHS = { 0: '', 1: '1/8', 2: '1/4', 3: '3/8', 4: '1/2', 5: '5/8', 6: '3/4', 7: '7/8' }

  function fmtSize(v) {
    var rounded = Math.round(v * 8) / 8
    var whole = Math.floor(rounded)
    var frac = EIGHTHS[Math.round((rounded - whole) * 8)]
    return frac ? whole + ' ' + frac : String(whole)
  }

  function letterFor(cm) {
    if (cm < 53) return '—'
    if (cm < 55) return 'XS'
    if (cm < 57) return 'S'
    if (cm < 59) return 'M'
    if (cm < 61) return 'L'
    if (cm < 63) return 'XL'
    if (cm < 65) return 'XXL'
    return '—'
  }

  function reset() {
    outCm.textContent = outIn.textContent = outUs.textContent = outUk.textContent = outLetter.textContent = '—'
  }

  function update() {
    var v = parseFloat(val.value)
    if (isNaN(v) || v <= 0) { reset(); return }

    // Traditional millinery sizing: US size = head circumference (in) / π; UK = US − 1/8
    var inches
    switch (type.value) {
      case 'cm': inches = v / CM_IN; break
      case 'in': inches = v; break
      case 'us': inches = v * Math.PI; break
      default: inches = (v + 0.125) * Math.PI // uk
    }
    var cm = inches * CM_IN
    if (cm < 40 || cm > 75) {
      reset()
      msg.textContent = 'That works out to ' + parseFloat(cm.toFixed(1)) + ' cm — outside the adult hat range (roughly 50–68 cm). Check the value and input type.'
      return
    }
    var us = inches / Math.PI

    outCm.textContent = parseFloat(cm.toFixed(1)).toString()
    outIn.textContent = parseFloat(inches.toFixed(2)).toString()
    outUs.textContent = fmtSize(us)
    outUk.textContent = fmtSize(us - 0.125)
    outLetter.textContent = letterFor(cm)
    msg.textContent = 'US sizes step in eighths (6 3/4 – 8). Enter e.g. 7.25 for 7 1/4.'
  }

  type.addEventListener('change', update)
  val.addEventListener('input', update)
})()
