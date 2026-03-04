// Mussum Ipsum Generator
(function () {
  var typeSelect = document.getElementById('mussum-type')
  var countInput = document.getElementById('mussum-count')
  var generateBtn = document.getElementById('mussum-generate')
  var output = document.getElementById('mussum-output')
  var copyBtn = document.getElementById('mussum-copy')

  var sentences = [
    'Pra l\u00e1, depois divoltis porris, paradis.',
    'Paisis, filhis, espiritis santis.',
    'M\u00e9 faiz elementum girarzis, nisi eros vermeio.',
    'Manduma pindureta quium dia nois paga.',
    'Sapien in monti palavris qui num significa nadis i pareci latim.',
    'Interessantiss quisso pudia ce receita de bolis, mais bolis eu num gostis.',
    'Suco de cevadiss, \u00e9 um leite divinis, qui tem lupuliz, matis, aguis e fermentis.',
    'Interagi no m\u00e9, cursus quis, vehicula ac nisi.',
    'Casamentiss faiz malandris se pirulit\u00e1.',
    'Cevadis im ampola pa arma uma pindureta.',
    'Atirei o pau no gatis, per gatis num morreus.',
    'Viva Forevis aptent taciti sociosqu ad litora torquent.',
    'Copo furadis \u00e9 disculpa de bebadis, arcu quam euismod magna.',
    'Delegadis gente finis, bibendum egestas augue arcu ut est.',
    'In elementis m\u00e9 pra quem \u00e9 amistosis quis leo.',
    'N\u00e3o sou faixa preta cumpadi, sou preto inteiris, inteiris.',
    'Mais vale um bebadis conhecidiss, que um alcoolatra anonimis.',
    'Suco de cevadiss deixa as pessoas mais interessantis.',
    'T\u00e1 deprimidis, eu conhe\u00e7o uma cachacis que pode alegrar sua vidis.',
    'Todo mundo v\u00ea os porris que eu tomo, mas ningu\u00e9m v\u00ea os tombis que eu levo!',
    'Quem manda na minha terra sou euzis!',
    'Si num tem leite ent\u00e3o bota uma pinga a\u00ed cumpadi!',
    'Diuretics paradis num copo \u00e9 motivis de denguis.',
    'Em p\u00e9 sem cair, deitado sem dormir, sentado sem cochilar e fazendo pose.',
    'A ordem dos tratores n\u00e3o altera o p\u00e3o duris.',
    'Quem num gosta di mim que vai ca\u00e7\u00e1 sua turmis!',
    'Quem num gosta di m\u00e9, boa gentis num \u00e9.',
    'Si u mundo t\u00e1 muito paradis? Toma um m\u00e9 que o mundo vai girarzis!',
    'Per aumento de cachacis, eu reclamis.',
    'Detraxit consequat et quo num tendi nada.',
    'Admodum accumsan disputationi eu sit. Vide electram sadipscing et per.',
    'Leite de capivaris, leite de mula manquis sem cabe\u00e7a.',
    'Aenean aliquam molestie leo, vitae iaculis nisl.',
    'Praesent vel viverra nisi. Mauris aliquet nunc non turpis scelerisque, eget.',
    'Posuere libero varius. Nullam a nisl ut ante blandit hendrerit. Aenean sit amet nisi.',
    'Nec orci ornare consequat. Praesent lacinia ultrices consectetur. Sed non ipsum felis.',
    'Praesent malesuada urna nisi, quis volutpat erat hendrerit non. Nam vulputate dapibus.',
    'Nullam volutpat risus nec leo commodo, ut interdum diam laoreet. Sed non consequat odio.',
    'Mauris nec dolor in eros commodo tempor. Aenean aliquam molestie leo, vitae iaculis nisl.',
    'Vehicula non. Ut sed ex eros. Vivamus sit amet nibh non tellus tristique interdum.',
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
        paras.push(pick(4 + Math.floor(Math.random() * 3)).join(' '))
      }
      text = paras.join('\n\n')
    } else if (type === 'sentences') {
      text = pick(count).join(' ')
    } else {
      var allWords = []
      var pool = pick(Math.ceil(count / 5) + 2)
      for (var i = 0; i < pool.length; i++) {
        var w = pool[i].split(/\s+/)
        for (var j = 0; j < w.length; j++) allWords.push(w[j])
      }
      text = allWords.slice(0, count).join(' ')
    }

    output.value = text
  }

  generateBtn.addEventListener('click', generate)

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

  generate()
})()
