import { calcReadingLevel } from './reading-level-core.js'

;(function () {
  var input = document.getElementById('rl-input')
  var grade = document.getElementById('rl-grade')
  var ease = document.getElementById('rl-ease')
  var words = document.getElementById('rl-words')
  var sentences = document.getElementById('rl-sentences')

  function update() {
    var r = calcReadingLevel(input.value)
    grade.textContent = r.words ? r.gradeLevel.toFixed(1) : '—'
    ease.textContent = r.words ? r.readingEase.toFixed(0) : '—'
    words.textContent = String(r.words)
    sentences.textContent = String(r.sentences)
  }

  input.addEventListener('input', update)
  update()
})()
