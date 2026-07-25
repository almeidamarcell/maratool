(function () {
  var val = document.getElementById('mpg-value')
  var unit = document.getElementById('mpg-unit')
  var outUs = document.getElementById('mpg-out-mpgus')
  var outUk = document.getElementById('mpg-out-mpguk')
  var outL = document.getElementById('mpg-out-l100')
  var outKml = document.getElementById('mpg-out-kml')
  var copyBtn = document.getElementById('mpg-copy')

  // Exact definitions: US gal = 3.785411784 L, imperial gal = 4.54609 L, mile = 1.609344 km (NIST SP 811)
  var L_US = 3.785411784
  var L_UK = 4.54609
  var KM_MI = 1.609344

  var summary = ''

  function fmt(x) {
    if (!isFinite(x)) return '—'
    return parseFloat(x.toFixed(2)).toString()
  }

  function update() {
    var v = parseFloat(val.value)
    if (isNaN(v) || v <= 0) {
      outUs.textContent = outUk.textContent = outL.textContent = outKml.textContent = '—'
      summary = ''
      return
    }
    // Normalize to km per liter, then derive everything
    var kmPerL
    switch (unit.value) {
      case 'mpgus': kmPerL = v * KM_MI / L_US; break
      case 'mpguk': kmPerL = v * KM_MI / L_UK; break
      case 'l100': kmPerL = 100 / v; break
      default: kmPerL = v
    }
    var mpgUs = kmPerL * L_US / KM_MI
    var mpgUk = kmPerL * L_UK / KM_MI
    var l100 = 100 / kmPerL

    outUs.textContent = fmt(mpgUs)
    outUk.textContent = fmt(mpgUk)
    outL.textContent = fmt(l100)
    outKml.textContent = fmt(kmPerL)
    summary = fmt(mpgUs) + ' MPG (US) = ' + fmt(mpgUk) + ' MPG (UK) = ' + fmt(l100) + ' L/100km = ' + fmt(kmPerL) + ' km/L'
  }

  val.addEventListener('input', update)
  unit.addEventListener('change', update)

  copyBtn.addEventListener('click', function () {
    if (!summary) return
    navigator.clipboard.writeText(summary).then(function () {
      var orig = copyBtn.textContent
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = orig
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })
})()
