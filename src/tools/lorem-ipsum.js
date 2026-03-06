import './hash-state.js'
// Lorem Ipsum Generator — Classic, Mussum, Dilmes
(function () {
  var variantSelect = document.getElementById('lorem-variant')
  var typeSelect = document.getElementById('lorem-type')
  var countInput = document.getElementById('lorem-count')
  var generateBtn = document.getElementById('lorem-generate')
  var output = document.getElementById('lorem-output')
  var copyBtn = document.getElementById('lorem-copy')
  var flavorLabel = document.getElementById('lorem-flavor')

  var flavors = {
    classic: 'The original placeholder text since the 1500s',
    mussum: 'No estilo do imortil Mussum, o bebedor',
    dilmes: 'Frases da presidenta, com toda a l\u00f3gica que lhe \u00e9 peculiar'
  }

  // ── Classic Lorem Ipsum corpus ──
  var classicSentences = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus, nec gravida arcu iaculis ut.',
    'Proin dictum eros vel felis efficitur, non dapibus est fermentum.',
    'Nulla facilisi vestibulum at erat sit amet tincidunt.',
    'Maecenas accumsan lacus vel facilisis volutpat est velit egestas dui.',
    'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh.',
    'Donec id elit non mi porta gravida at eget metus.',
    'Nullam quis risus eget urna mollis ornare vel eu leo.',
    'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.',
    'Aenean lacinia bibendum nulla sed consectetur.',
    'Praesent commodo cursus magna, vel scelerisque nisl consectetur et.',
    'Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
    'Morbi leo risus, porta ac consectetur ac, vestibulum at eros.',
    'Etiam porta sem malesuada magna mollis euismod.',
    'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
    'Vestibulum id ligula porta felis euismod semper.',
    'Cras mattis consectetur purus sit amet fermentum.',
    'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    'Suspendisse potenti nullam porttitor lacus at turpis donec posuere metus vitae ipsum.',
    'Aliquam erat volutpat maecenas pharetra convallis posuere morbi leo urna.',
    'Phasellus fermentum in dolor vel molestie sed id semper risus.',
    'Quisque ut nisi vitae lectus sagittis venenatis nec sed turpis egestas.',
    'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.',
    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet.',
    'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus.',
    'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
    'Ut aut perferendis doloribus asperiores repellat aut fugit sed quia consequuntur magni dolores.',
    'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium.',
    'Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.',
    'Nam quod ratione voluptatem sequi nesciunt neque porro quisquam est.',
    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
  ]

  // ── Mussum Ipsum corpus ──
  var mussumSentences = [
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

  // ── Dilmes Ipsum corpus ──
  var dilmesSentences = [
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

  var corpora = {
    classic: classicSentences,
    mussum: mussumSentences,
    dilmes: dilmesSentences
  }

  function shuffle(arr) {
    var a = arr.slice()
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var tmp = a[i]
      a[i] = a[j]
      a[j] = tmp
    }
    return a
  }

  function pickSentences(corpus, n) {
    var result = []
    while (result.length < n) {
      var shuffled = shuffle(corpus)
      for (var i = 0; i < shuffled.length && result.length < n; i++) {
        result.push(shuffled[i])
      }
    }
    return result
  }

  function generate() {
    var variant = variantSelect.value
    var type = typeSelect.value
    var count = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 3))
    var corpus = corpora[variant]
    var text = ''

    if (type === 'paragraphs') {
      var paragraphs = []
      for (var p = 0; p < count; p++) {
        var sentCount = 4 + Math.floor(Math.random() * 3) // 4-6 sentences
        var sents = pickSentences(corpus, sentCount)
        // First paragraph of classic always starts with "Lorem ipsum..."
        if (p === 0 && variant === 'classic') {
          sents[0] = classicSentences[0]
        }
        paragraphs.push(sents.join(' '))
      }
      text = paragraphs.join('\n\n')
    } else if (type === 'sentences') {
      var sents = pickSentences(corpus, count)
      if (variant === 'classic' && count >= 1) {
        sents[0] = classicSentences[0]
      }
      text = sents.join(' ')
    } else {
      // words
      var allWords = []
      var pool = pickSentences(corpus, Math.ceil(count / 5) + 2)
      for (var i = 0; i < pool.length; i++) {
        var words = pool[i].split(/\s+/)
        for (var w = 0; w < words.length; w++) {
          allWords.push(words[w])
        }
      }
      if (variant === 'classic') {
        var opening = classicSentences[0].split(/\s+/)
        allWords = opening.concat(allWords)
      }
      text = allWords.slice(0, count).join(' ')
    }

    output.value = text
  }

  function saveState() {
    HashState.save({
      variant: variantSelect.value,
      type: typeSelect.value,
      count: countInput.value
    })
  }

  variantSelect.addEventListener('change', function () {
    flavorLabel.textContent = flavors[variantSelect.value]
    saveState()
  })

  typeSelect.addEventListener('change', saveState)
  countInput.addEventListener('change', saveState)

  generateBtn.addEventListener('click', function () {
    generate()
    saveState()
  })

  copyBtn.addEventListener('click', function () {
    var text = output.value
    if (!text) return
    navigator.clipboard.writeText(text).then(function () {
      copyBtn.textContent = 'Copied!'
      copyBtn.classList.add('copied')
      setTimeout(function () {
        copyBtn.textContent = 'Copy'
        copyBtn.classList.remove('copied')
      }, 2000)
    })
  })

  // Restore from hash state
  var _hs = HashState.parse()
  if (_hs.variant) { variantSelect.value = _hs.variant; flavorLabel.textContent = flavors[_hs.variant] }
  if (_hs.type) typeSelect.value = _hs.type
  if (_hs.count) countInput.value = _hs.count

  // Generate initial output
  generate()
})()
