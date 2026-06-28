;(function () {
  var original = document.getElementById('sd-original')
  var d1 = document.getElementById('sd-d1')
  var d2 = document.getElementById('sd-d2')
  var finalEl = document.getElementById('sd-final')
  var savedEl = document.getElementById('sd-saved')

  function stackedPrice(base, discounts) {
    var price = base
    discounts.forEach(function (d) { price = price * (1 - d / 100) })
    return price
  }

  function update() {
    var base = parseFloat(original.value) || 0
    var discounts = [parseFloat(d1.value) || 0, parseFloat(d2.value) || 0].filter(function (d) { return d > 0 })
    var final = stackedPrice(base, discounts)
    finalEl.textContent = '$' + final.toFixed(2)
    savedEl.textContent = '$' + (base - final).toFixed(2)
  }
  ;[original, d1, d2].forEach(function (el) { el.addEventListener('input', update) })
  update()
})()
