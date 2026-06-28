import { weightedAverage, formatMoney } from './finance-stock-core.js'

;(function () {
  var container = document.getElementById('sa-lots')
  var addBtn = document.getElementById('sa-add')
  var avgEl = document.getElementById('sa-avg')
  var sharesEl = document.getElementById('sa-shares')
  var costEl = document.getElementById('sa-cost')

  function getLots() {
    return Array.from(container.querySelectorAll('.sa-lot')).map(function (row) {
      return {
        shares: row.querySelector('.sa-shares').value,
        price: row.querySelector('.sa-price').value,
      }
    })
  }

  function update() {
    var r = weightedAverage(getLots())
    if (!r) { avgEl.textContent = sharesEl.textContent = costEl.textContent = '—'; return }
    avgEl.textContent = formatMoney(r.avgPrice)
    sharesEl.textContent = r.totalShares.toLocaleString()
    costEl.textContent = formatMoney(r.totalCost)
  }

  function addLot() {
    var div = document.createElement('div')
    div.className = 'calc-row sa-lot'
    div.innerHTML = '<div class="calc-field"><label class="tool-label">Shares</label><input type="number" class="tool-input sa-shares" min="0" step="any" /></div><div class="calc-field"><label class="tool-label">Price ($)</label><input type="number" class="tool-input sa-price" min="0" step="any" /></div>'
    container.appendChild(div)
    div.querySelectorAll('input').forEach(function (el) { el.addEventListener('input', update) })
    update()
  }

  addBtn.addEventListener('click', addLot)
  addLot()
  addLot()
})()
