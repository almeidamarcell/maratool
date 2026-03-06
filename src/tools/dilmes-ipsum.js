import './hash-state.js'
// Dilmes Ipsum Generator
(function () {
  var typeSelect = document.getElementById('dilmes-type')
  var countInput = document.getElementById('dilmes-count')
  var generateBtn = document.getElementById('dilmes-generate')
  var output = document.getElementById('dilmes-output')
  var copyBtn = document.getElementById('dilmes-copy')

  var sentences = [
    'Eu, para ir, eu fa\u00e7o uma escala. Para voltar, eu fa\u00e7o duas, para voltar para o Brasil. Neste caso agora n\u00f3s t\u00ednhamos uma discuss\u00e3o.',
    '\u00c9 interessante que muitas vezes no Brasil, voc\u00ea \u00e9, como diz o povo brasileiro, muitas vezes voc\u00ea \u00e9 criticado por ter o cachorro e, outras vezes, por n\u00e3o ter o mesmo cachorro.',
    'E n\u00f3s criamos um programa que eu queria falar para voc\u00eas, que \u00e9 o Ci\u00eancia sem Fronteiras. Por que eu queria falar do Ci\u00eancia sem Fronteiras para voc\u00eas?',
    'Eu dou dinheiro pra minha filha. Eu dou dinheiro pra ela viajar. J\u00e1 vivi muito sem dinheiro, j\u00e1 vivi muito com dinheiro.',
    'A \u00fanica \u00e1rea que eu acho, que vai exigir muita aten\u00e7\u00e3o nossa, \u00e9 a \u00e1rea que a gente vai ter que prestar muita aten\u00e7\u00e3o.',
    'Primeiro eu queria cumprimentar os internautas. Oi Internautas! Depois dizer que o meio ambiente \u00e9 sem d\u00favida nenhuma uma amea\u00e7a ao desenvolvimento sustent\u00e1vel.',
    'Se hoje \u00e9 o dia das crian\u00e7as... Ontem eu disse: o dia da crian\u00e7a \u00e9 o dia da m\u00e3e, dos pais, das professoras, mas tamb\u00e9m \u00e9 o dia dos animais.',
    'Todos as descri\u00e7\u00f5es das pessoas s\u00e3o sobre a humanidade do atendimento, a pessoa pega no pulso, examina, olha com carinho.',
    'No meu xin\u00ealo da humildade eu gostaria muito de ver o Neymar e o Ganso. Por que eu acho que 11 entre 10 brasileiros gostariam.',
    'A popula\u00e7\u00e3o ela precisa da Zona Franca de Manaus, porque na Zona Franca de Manaus, n\u00e3o \u00e9 uma zona de exporta\u00e7\u00e3o, \u00e9 uma zona para o Brasil.',
    'A\u00ed voc\u00ea fala o seguinte: Mas voc\u00eas acabaram isso? Vou te falar: N\u00e3o, est\u00e1 em andamento! Tem obras que vai durar pra depois de 2010.',
    'Eu queria destacar uma quest\u00e3o, que \u00e9 uma quest\u00e3o que est\u00e1 afetando o Brasil inteiro, que \u00e9 a quest\u00e3o da vigil\u00e2ncia sanit\u00e1ria.',
  ]

  function shuffle(arr) {
    var a = arr.slice()
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp
    }
    return a
  }

  function pick(n) {
    var result = []
    while (result.length < n) {
      var s = shuffle(sentences)
      for (var i = 0; i < s.length && result.length < n; i++) result.push(s[i])
    }
    return result
  }

  function generate() {
    var type = typeSelect.value
    var count = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 3))
    var text = ''

    if (type === 'paragraphs') {
      var paras = []
      for (var p = 0; p < count; p++) {
        paras.push(pick(2 + Math.floor(Math.random() * 2)).join(' '))
      }
      text = paras.join('\n\n')
    } else if (type === 'sentences') {
      text = pick(count).join(' ')
    } else {
      var allWords = []
      var pool = pick(Math.ceil(count / 8) + 2)
      for (var i = 0; i < pool.length; i++) {
        var w = pool[i].split(/\s+/)
        for (var j = 0; j < w.length; j++) allWords.push(w[j])
      }
      text = allWords.slice(0, count).join(' ')
    }

    output.value = text
  }

  function saveState() {
    HashState.save({ type: typeSelect.value, count: countInput.value })
  }

  typeSelect.addEventListener('change', saveState)
  countInput.addEventListener('change', saveState)

  generateBtn.addEventListener('click', function () {
    generate()
    saveState()
  })

  copyBtn.addEventListener('click', function () {
    if (!output.value) return
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = 'Copiado!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copiar'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore from hash state
  var _hs = HashState.parse()
  if (_hs.type) typeSelect.value = _hs.type
  if (_hs.count) countInput.value = _hs.count

  generate()
})()
