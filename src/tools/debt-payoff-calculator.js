import { debtPlan, formatMonths } from './wave5-debt-core.js'
import { formatMoney } from './finance-amortization-core.js'

;(function () {
  var rowsEl = document.getElementById('dp-rows')
  var addBtn = document.getElementById('dp-add')
  var extraEl = document.getElementById('dp-extra')
  var warnEl = document.getElementById('dp-warning')
  var snowTime = document.getElementById('dp-snow-time')
  var snowInterest = document.getElementById('dp-snow-interest')
  var snowOrder = document.getElementById('dp-snow-order')
  var avalTime = document.getElementById('dp-aval-time')
  var avalInterest = document.getElementById('dp-aval-interest')
  var avalOrder = document.getElementById('dp-aval-order')
  var verdictEl = document.getElementById('dp-verdict')

  function setVisible(el, visible) {
    if (visible) el.removeAttribute('hidden')
    else el.setAttribute('hidden', '')
  }

  function addRow(name, bal, apr, min) {
    var row = document.createElement('div')
    row.className = 'dp-row'
    row.innerHTML =
      '<input type="text" class="tool-input dp-name" value="' + name + '" aria-label="Debt name" />' +
      '<input type="number" class="tool-input dp-balance" value="' + bal + '" placeholder="5000" min="0" aria-label="Balance" />' +
      '<input type="number" class="tool-input dp-apr" value="' + apr + '" placeholder="20" step="any" min="0" aria-label="APR %" />' +
      '<input type="number" class="tool-input dp-min" value="' + min + '" placeholder="150" min="0" aria-label="Minimum payment" />' +
      '<button type="button" class="tool-btn tool-btn-secondary dp-remove" aria-label="Remove debt">×</button>'
    row.querySelector('.dp-remove').addEventListener('click', function () {
      row.remove()
      update()
    })
    row.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', update) })
    rowsEl.appendChild(row)
    return row
  }

  function readDebts() {
    var debts = []
    rowsEl.querySelectorAll('.dp-row').forEach(function (row, i) {
      debts.push({
        name: row.querySelector('.dp-name').value || row.querySelector('.dp-name').placeholder || 'Debt ' + (i + 1),
        balance: parseFloat(row.querySelector('.dp-balance').value),
        aprPct: parseFloat(row.querySelector('.dp-apr').value),
        minPayment: parseFloat(row.querySelector('.dp-min').value),
      })
    })
    return debts.filter(function (d) { return d.balance > 0 && d.minPayment > 0 && d.aprPct >= 0 })
  }

  function clear() {
    ;[snowTime, snowInterest, avalTime, avalInterest].forEach(function (el) { el.textContent = '—' })
    snowOrder.textContent = ''
    avalOrder.textContent = ''
    verdictEl.textContent = ''
    setVisible(warnEl, false)
  }

  function update() {
    var debts = readDebts()
    if (!debts.length) { clear(); return }
    var extra = parseFloat(extraEl.value) || 0
    var snow = debtPlan(debts, extra, 'snowball')
    var aval = debtPlan(debts, extra, 'avalanche')
    if (!snow || !aval) { clear(); return }
    if (snow.neverPaysOff || aval.neverPaysOff) {
      clear()
      var stuck = snow.stuckOn || aval.stuckOn
      warnEl.textContent = stuck
        ? 'The minimum payment on "' + stuck + '" does not cover its monthly interest. Raise that payment or add an extra monthly budget.'
        : 'These payments never clear the debts. Raise the minimums or add an extra monthly budget.'
      setVisible(warnEl, true)
      return
    }
    setVisible(warnEl, false)
    snowTime.textContent = formatMonths(snow.months)
    snowInterest.textContent = formatMoney(snow.totalInterest)
    snowOrder.textContent = 'Payoff order: ' + snow.payoffOrder.join(' → ')
    avalTime.textContent = formatMonths(aval.months)
    avalInterest.textContent = formatMoney(aval.totalInterest)
    avalOrder.textContent = 'Payoff order: ' + aval.payoffOrder.join(' → ')
    var diff = snow.totalInterest - aval.totalInterest
    if (diff > 1) {
      verdictEl.textContent = 'Avalanche (highest APR first) saves ' + formatMoney(diff) + ' in interest over snowball. Snowball clears its first debt sooner — pick it if quick wins keep you going.'
    } else {
      verdictEl.textContent = 'Both strategies cost about the same here — pick snowball for the motivation of early wins.'
    }
  }

  addBtn.addEventListener('click', function () { addRow('Debt ' + (rowsEl.children.length + 1), '', '', '') })
  extraEl.addEventListener('input', update)

  addRow('Credit card', '3000', '24', '90')
  addRow('Car loan', '12000', '7', '300')
  update()
})()
