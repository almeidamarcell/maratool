(function () {
  var CHEATSHEET = [
    {
      name: 'Display',
      items: [
        { c: 'block', css: 'display: block' },
        { c: 'inline-block', css: 'display: inline-block' },
        { c: 'inline', css: 'display: inline' },
        { c: 'flex', css: 'display: flex' },
        { c: 'inline-flex', css: 'display: inline-flex' },
        { c: 'grid', css: 'display: grid' },
        { c: 'inline-grid', css: 'display: inline-grid' },
        { c: 'table', css: 'display: table' },
        { c: 'hidden', css: 'display: none' },
        { c: 'contents', css: 'display: contents' }
      ]
    },
    {
      name: 'Position',
      items: [
        { c: 'static', css: 'position: static' },
        { c: 'fixed', css: 'position: fixed' },
        { c: 'absolute', css: 'position: absolute' },
        { c: 'relative', css: 'position: relative' },
        { c: 'sticky', css: 'position: sticky' },
        { c: 'top-0', css: 'top: 0px' },
        { c: 'right-0', css: 'right: 0px' },
        { c: 'bottom-0', css: 'bottom: 0px' },
        { c: 'left-0', css: 'left: 0px' },
        { c: 'inset-0', css: 'inset: 0px' },
        { c: 'inset-x-0', css: 'left: 0px; right: 0px' },
        { c: 'inset-y-0', css: 'top: 0px; bottom: 0px' }
      ]
    },
    {
      name: 'Flexbox',
      items: [
        { c: 'flex-row', css: 'flex-direction: row' },
        { c: 'flex-row-reverse', css: 'flex-direction: row-reverse' },
        { c: 'flex-col', css: 'flex-direction: column' },
        { c: 'flex-col-reverse', css: 'flex-direction: column-reverse' },
        { c: 'flex-wrap', css: 'flex-wrap: wrap' },
        { c: 'flex-nowrap', css: 'flex-wrap: nowrap' },
        { c: 'flex-1', css: 'flex: 1 1 0%' },
        { c: 'flex-auto', css: 'flex: 1 1 auto' },
        { c: 'flex-initial', css: 'flex: 0 1 auto' },
        { c: 'flex-none', css: 'flex: none' },
        { c: 'grow', css: 'flex-grow: 1' },
        { c: 'grow-0', css: 'flex-grow: 0' },
        { c: 'shrink', css: 'flex-shrink: 1' },
        { c: 'shrink-0', css: 'flex-shrink: 0' }
      ]
    },
    {
      name: 'Grid',
      items: [
        { c: 'grid-cols-1', css: 'grid-template-columns: repeat(1, minmax(0, 1fr))' },
        { c: 'grid-cols-2', css: 'grid-template-columns: repeat(2, minmax(0, 1fr))' },
        { c: 'grid-cols-3', css: 'grid-template-columns: repeat(3, minmax(0, 1fr))' },
        { c: 'grid-cols-4', css: 'grid-template-columns: repeat(4, minmax(0, 1fr))' },
        { c: 'grid-cols-6', css: 'grid-template-columns: repeat(6, minmax(0, 1fr))' },
        { c: 'grid-cols-12', css: 'grid-template-columns: repeat(12, minmax(0, 1fr))' },
        { c: 'grid-rows-1', css: 'grid-template-rows: repeat(1, minmax(0, 1fr))' },
        { c: 'grid-rows-2', css: 'grid-template-rows: repeat(2, minmax(0, 1fr))' },
        { c: 'grid-rows-3', css: 'grid-template-rows: repeat(3, minmax(0, 1fr))' },
        { c: 'col-span-1', css: 'grid-column: span 1 / span 1' },
        { c: 'col-span-2', css: 'grid-column: span 2 / span 2' },
        { c: 'col-span-full', css: 'grid-column: 1 / -1' },
        { c: 'gap-0', css: 'gap: 0px' },
        { c: 'gap-1', css: 'gap: 0.25rem' },
        { c: 'gap-2', css: 'gap: 0.5rem' },
        { c: 'gap-4', css: 'gap: 1rem' },
        { c: 'gap-6', css: 'gap: 1.5rem' },
        { c: 'gap-8', css: 'gap: 2rem' }
      ]
    },
    {
      name: 'Alignment',
      items: [
        { c: 'justify-start', css: 'justify-content: flex-start' },
        { c: 'justify-end', css: 'justify-content: flex-end' },
        { c: 'justify-center', css: 'justify-content: center' },
        { c: 'justify-between', css: 'justify-content: space-between' },
        { c: 'justify-around', css: 'justify-content: space-around' },
        { c: 'justify-evenly', css: 'justify-content: space-evenly' },
        { c: 'items-start', css: 'align-items: flex-start' },
        { c: 'items-end', css: 'align-items: flex-end' },
        { c: 'items-center', css: 'align-items: center' },
        { c: 'items-baseline', css: 'align-items: baseline' },
        { c: 'items-stretch', css: 'align-items: stretch' },
        { c: 'self-auto', css: 'align-self: auto' },
        { c: 'self-start', css: 'align-self: flex-start' },
        { c: 'self-center', css: 'align-self: center' },
        { c: 'self-end', css: 'align-self: flex-end' }
      ]
    },
    {
      name: 'Spacing',
      items: [
        { c: 'p-0', css: 'padding: 0px' },
        { c: 'p-1', css: 'padding: 0.25rem' },
        { c: 'p-2', css: 'padding: 0.5rem' },
        { c: 'p-3', css: 'padding: 0.75rem' },
        { c: 'p-4', css: 'padding: 1rem' },
        { c: 'p-5', css: 'padding: 1.25rem' },
        { c: 'p-6', css: 'padding: 1.5rem' },
        { c: 'p-8', css: 'padding: 2rem' },
        { c: 'px-4', css: 'padding-left: 1rem; padding-right: 1rem' },
        { c: 'py-4', css: 'padding-top: 1rem; padding-bottom: 1rem' },
        { c: 'm-0', css: 'margin: 0px' },
        { c: 'm-1', css: 'margin: 0.25rem' },
        { c: 'm-2', css: 'margin: 0.5rem' },
        { c: 'm-4', css: 'margin: 1rem' },
        { c: 'm-8', css: 'margin: 2rem' },
        { c: 'm-auto', css: 'margin: auto' },
        { c: 'mx-auto', css: 'margin-left: auto; margin-right: auto' },
        { c: 'my-4', css: 'margin-top: 1rem; margin-bottom: 1rem' },
        { c: '-m-1', css: 'margin: -0.25rem' },
        { c: 'space-x-4', css: 'margin-left: 1rem (on children)' },
        { c: 'space-y-4', css: 'margin-top: 1rem (on children)' }
      ]
    },
    {
      name: 'Sizing',
      items: [
        { c: 'w-0', css: 'width: 0px' },
        { c: 'w-1', css: 'width: 0.25rem' },
        { c: 'w-4', css: 'width: 1rem' },
        { c: 'w-8', css: 'width: 2rem' },
        { c: 'w-16', css: 'width: 4rem' },
        { c: 'w-32', css: 'width: 8rem' },
        { c: 'w-64', css: 'width: 16rem' },
        { c: 'w-full', css: 'width: 100%' },
        { c: 'w-screen', css: 'width: 100vw' },
        { c: 'w-auto', css: 'width: auto' },
        { c: 'w-1/2', css: 'width: 50%' },
        { c: 'w-1/3', css: 'width: 33.333%' },
        { c: 'w-fit', css: 'width: fit-content' },
        { c: 'h-full', css: 'height: 100%' },
        { c: 'h-screen', css: 'height: 100vh' },
        { c: 'h-auto', css: 'height: auto' },
        { c: 'min-w-0', css: 'min-width: 0px' },
        { c: 'min-w-full', css: 'min-width: 100%' },
        { c: 'max-w-sm', css: 'max-width: 24rem' },
        { c: 'max-w-md', css: 'max-width: 28rem' },
        { c: 'max-w-lg', css: 'max-width: 32rem' },
        { c: 'max-w-xl', css: 'max-width: 36rem' },
        { c: 'max-w-2xl', css: 'max-width: 42rem' },
        { c: 'max-w-full', css: 'max-width: 100%' },
        { c: 'max-w-screen-sm', css: 'max-width: 640px' },
        { c: 'max-w-screen-md', css: 'max-width: 768px' },
        { c: 'max-w-screen-lg', css: 'max-width: 1024px' }
      ]
    },
    {
      name: 'Typography',
      items: [
        { c: 'text-xs', css: 'font-size: 0.75rem; line-height: 1rem' },
        { c: 'text-sm', css: 'font-size: 0.875rem; line-height: 1.25rem' },
        { c: 'text-base', css: 'font-size: 1rem; line-height: 1.5rem' },
        { c: 'text-lg', css: 'font-size: 1.125rem; line-height: 1.75rem' },
        { c: 'text-xl', css: 'font-size: 1.25rem; line-height: 1.75rem' },
        { c: 'text-2xl', css: 'font-size: 1.5rem; line-height: 2rem' },
        { c: 'text-3xl', css: 'font-size: 1.875rem; line-height: 2.25rem' },
        { c: 'text-4xl', css: 'font-size: 2.25rem; line-height: 2.5rem' },
        { c: 'font-thin', css: 'font-weight: 100' },
        { c: 'font-light', css: 'font-weight: 300' },
        { c: 'font-normal', css: 'font-weight: 400' },
        { c: 'font-medium', css: 'font-weight: 500' },
        { c: 'font-semibold', css: 'font-weight: 600' },
        { c: 'font-bold', css: 'font-weight: 700' },
        { c: 'font-extrabold', css: 'font-weight: 800' },
        { c: 'italic', css: 'font-style: italic' },
        { c: 'not-italic', css: 'font-style: normal' },
        { c: 'tracking-tight', css: 'letter-spacing: -0.025em' },
        { c: 'tracking-normal', css: 'letter-spacing: 0em' },
        { c: 'tracking-wide', css: 'letter-spacing: 0.025em' },
        { c: 'leading-none', css: 'line-height: 1' },
        { c: 'leading-tight', css: 'line-height: 1.25' },
        { c: 'leading-normal', css: 'line-height: 1.5' },
        { c: 'leading-relaxed', css: 'line-height: 1.625' },
        { c: 'leading-loose', css: 'line-height: 2' }
      ]
    },
    {
      name: 'Text',
      items: [
        { c: 'text-left', css: 'text-align: left' },
        { c: 'text-center', css: 'text-align: center' },
        { c: 'text-right', css: 'text-align: right' },
        { c: 'text-justify', css: 'text-align: justify' },
        { c: 'uppercase', css: 'text-transform: uppercase' },
        { c: 'lowercase', css: 'text-transform: lowercase' },
        { c: 'capitalize', css: 'text-transform: capitalize' },
        { c: 'normal-case', css: 'text-transform: none' },
        { c: 'underline', css: 'text-decoration-line: underline' },
        { c: 'line-through', css: 'text-decoration-line: line-through' },
        { c: 'no-underline', css: 'text-decoration-line: none' },
        { c: 'truncate', css: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap' },
        { c: 'break-words', css: 'overflow-wrap: break-word' },
        { c: 'whitespace-nowrap', css: 'white-space: nowrap' },
        { c: 'whitespace-pre', css: 'white-space: pre' }
      ]
    },
    {
      name: 'Backgrounds',
      items: [
        { c: 'bg-transparent', css: 'background-color: transparent' },
        { c: 'bg-white', css: 'background-color: #fff' },
        { c: 'bg-black', css: 'background-color: #000' },
        { c: 'bg-slate-50', css: 'background-color: #f8fafc' },
        { c: 'bg-slate-100', css: 'background-color: #f1f5f9' },
        { c: 'bg-slate-500', css: 'background-color: #64748b' },
        { c: 'bg-slate-900', css: 'background-color: #0f172a' },
        { c: 'bg-none', css: 'background-image: none' },
        { c: 'bg-cover', css: 'background-size: cover' },
        { c: 'bg-contain', css: 'background-size: contain' },
        { c: 'bg-center', css: 'background-position: center' },
        { c: 'bg-no-repeat', css: 'background-repeat: no-repeat' },
        { c: 'bg-repeat', css: 'background-repeat: repeat' },
        { c: 'bg-fixed', css: 'background-attachment: fixed' }
      ]
    },
    {
      name: 'Borders',
      items: [
        { c: 'border', css: 'border-width: 1px' },
        { c: 'border-0', css: 'border-width: 0px' },
        { c: 'border-2', css: 'border-width: 2px' },
        { c: 'border-4', css: 'border-width: 4px' },
        { c: 'border-t', css: 'border-top-width: 1px' },
        { c: 'border-b', css: 'border-bottom-width: 1px' },
        { c: 'border-solid', css: 'border-style: solid' },
        { c: 'border-dashed', css: 'border-style: dashed' },
        { c: 'border-dotted', css: 'border-style: dotted' },
        { c: 'border-none', css: 'border-style: none' },
        { c: 'rounded', css: 'border-radius: 0.25rem' },
        { c: 'rounded-md', css: 'border-radius: 0.375rem' },
        { c: 'rounded-lg', css: 'border-radius: 0.5rem' },
        { c: 'rounded-xl', css: 'border-radius: 0.75rem' },
        { c: 'rounded-2xl', css: 'border-radius: 1rem' },
        { c: 'rounded-full', css: 'border-radius: 9999px' },
        { c: 'rounded-none', css: 'border-radius: 0px' },
        { c: 'divide-x', css: 'border-left-width: 1px (on children)' },
        { c: 'divide-y', css: 'border-top-width: 1px (on children)' }
      ]
    },
    {
      name: 'Effects',
      items: [
        { c: 'shadow-sm', css: 'box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)' },
        { c: 'shadow', css: 'box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
        { c: 'shadow-md', css: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
        { c: 'shadow-lg', css: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' },
        { c: 'shadow-xl', css: 'box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' },
        { c: 'shadow-none', css: 'box-shadow: 0 0 #0000' },
        { c: 'opacity-0', css: 'opacity: 0' },
        { c: 'opacity-25', css: 'opacity: 0.25' },
        { c: 'opacity-50', css: 'opacity: 0.5' },
        { c: 'opacity-75', css: 'opacity: 0.75' },
        { c: 'opacity-100', css: 'opacity: 1' }
      ]
    },
    {
      name: 'Transitions',
      items: [
        { c: 'transition', css: 'transition-property: color, background-color, border-color, ...' },
        { c: 'transition-all', css: 'transition-property: all' },
        { c: 'transition-colors', css: 'transition-property: color, background-color, border-color, ...' },
        { c: 'transition-none', css: 'transition-property: none' },
        { c: 'duration-75', css: 'transition-duration: 75ms' },
        { c: 'duration-100', css: 'transition-duration: 100ms' },
        { c: 'duration-150', css: 'transition-duration: 150ms' },
        { c: 'duration-200', css: 'transition-duration: 200ms' },
        { c: 'duration-300', css: 'transition-duration: 300ms' },
        { c: 'duration-500', css: 'transition-duration: 500ms' },
        { c: 'ease-linear', css: 'transition-timing-function: linear' },
        { c: 'ease-in', css: 'transition-timing-function: cubic-bezier(0.4, 0, 1, 1)' },
        { c: 'ease-out', css: 'transition-timing-function: cubic-bezier(0, 0, 0.2, 1)' },
        { c: 'ease-in-out', css: 'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)' }
      ]
    },
    {
      name: 'Transforms',
      items: [
        { c: 'scale-0', css: 'transform: scale(0)' },
        { c: 'scale-50', css: 'transform: scale(.5)' },
        { c: 'scale-75', css: 'transform: scale(.75)' },
        { c: 'scale-100', css: 'transform: scale(1)' },
        { c: 'scale-125', css: 'transform: scale(1.25)' },
        { c: 'scale-150', css: 'transform: scale(1.5)' },
        { c: 'rotate-0', css: 'transform: rotate(0deg)' },
        { c: 'rotate-45', css: 'transform: rotate(45deg)' },
        { c: 'rotate-90', css: 'transform: rotate(90deg)' },
        { c: 'rotate-180', css: 'transform: rotate(180deg)' },
        { c: '-rotate-45', css: 'transform: rotate(-45deg)' },
        { c: 'translate-x-0', css: 'transform: translateX(0px)' },
        { c: 'translate-x-4', css: 'transform: translateX(1rem)' },
        { c: 'translate-y-4', css: 'transform: translateY(1rem)' },
        { c: '-translate-x-1/2', css: 'transform: translateX(-50%)' },
        { c: '-translate-y-1/2', css: 'transform: translateY(-50%)' }
      ]
    },
    {
      name: 'Layout',
      items: [
        { c: 'container', css: 'width: 100%; max-width varies by breakpoint' },
        { c: 'box-border', css: 'box-sizing: border-box' },
        { c: 'box-content', css: 'box-sizing: content-box' },
        { c: 'overflow-auto', css: 'overflow: auto' },
        { c: 'overflow-hidden', css: 'overflow: hidden' },
        { c: 'overflow-scroll', css: 'overflow: scroll' },
        { c: 'overflow-visible', css: 'overflow: visible' },
        { c: 'overflow-x-auto', css: 'overflow-x: auto' },
        { c: 'overflow-y-auto', css: 'overflow-y: auto' },
        { c: 'z-0', css: 'z-index: 0' },
        { c: 'z-10', css: 'z-index: 10' },
        { c: 'z-20', css: 'z-index: 20' },
        { c: 'z-30', css: 'z-index: 30' },
        { c: 'z-40', css: 'z-index: 40' },
        { c: 'z-50', css: 'z-index: 50' },
        { c: 'z-auto', css: 'z-index: auto' }
      ]
    },
    {
      name: 'Interactivity',
      items: [
        { c: 'cursor-pointer', css: 'cursor: pointer' },
        { c: 'cursor-default', css: 'cursor: default' },
        { c: 'cursor-not-allowed', css: 'cursor: not-allowed' },
        { c: 'cursor-wait', css: 'cursor: wait' },
        { c: 'cursor-grab', css: 'cursor: grab' },
        { c: 'select-none', css: 'user-select: none' },
        { c: 'select-text', css: 'user-select: text' },
        { c: 'select-all', css: 'user-select: all' },
        { c: 'pointer-events-none', css: 'pointer-events: none' },
        { c: 'pointer-events-auto', css: 'pointer-events: auto' },
        { c: 'resize', css: 'resize: both' },
        { c: 'resize-none', css: 'resize: none' },
        { c: 'resize-x', css: 'resize: horizontal' },
        { c: 'resize-y', css: 'resize: vertical' }
      ]
    },
    {
      name: 'Breakpoints',
      items: [
        { c: 'sm:', css: '@media (min-width: 640px)' },
        { c: 'md:', css: '@media (min-width: 768px)' },
        { c: 'lg:', css: '@media (min-width: 1024px)' },
        { c: 'xl:', css: '@media (min-width: 1280px)' },
        { c: '2xl:', css: '@media (min-width: 1536px)' },
        { c: 'max-sm:', css: '@media (max-width: 639px)' },
        { c: 'max-md:', css: '@media (max-width: 767px)' },
        { c: 'max-lg:', css: '@media (max-width: 1023px)' }
      ]
    }
  ]

  var searchInput = document.getElementById('tw-search')
  var countEl = document.getElementById('tw-count')
  var contentEl = document.getElementById('tw-content')

  var totalItems = 0
  for (var i = 0; i < CHEATSHEET.length; i++) {
    totalItems += CHEATSHEET[i].items.length
  }

  function render() {
    var query = searchInput.value.trim().toLowerCase()
    var html = ''
    var matchCount = 0
    var hasResults = false

    for (var i = 0; i < CHEATSHEET.length; i++) {
      var cat = CHEATSHEET[i]
      var filtered = []

      for (var j = 0; j < cat.items.length; j++) {
        var item = cat.items[j]
        if (!query || item.c.toLowerCase().indexOf(query) !== -1 || item.css.toLowerCase().indexOf(query) !== -1) {
          filtered.push(item)
        }
      }

      if (filtered.length === 0) continue
      hasResults = true
      matchCount += filtered.length

      var isOpen = query ? ' open' : ''
      html += '<div class="tw-category' + isOpen + '" data-cat="' + i + '">'
      html += '<div class="tw-category-header">'
      html += '<span class="tw-category-title">' + cat.name + '</span>'
      html += '<span class="tw-category-badge">' + filtered.length + '</span>'
      html += '</div>'
      html += '<div class="tw-category-body">'
      html += '<table class="tw-table">'
      html += '<thead><tr><th>Class</th><th>CSS</th></tr></thead>'
      html += '<tbody>'

      for (var k = 0; k < filtered.length; k++) {
        html += '<tr>'
        html += '<td class="tw-class" data-copy="' + filtered[k].c + '">' + filtered[k].c + '</td>'
        html += '<td class="tw-css">' + filtered[k].css + '</td>'
        html += '</tr>'
      }

      html += '</tbody></table></div></div>'
    }

    if (!hasResults) {
      html = '<div class="tw-empty">No classes match your search.</div>'
    }

    html += '<div class="tw-tip">Tip: Use arbitrary values with square brackets, e.g. <code>w-[200px]</code>, <code>text-[#1a1a18]</code>, <code>p-[13px]</code></div>'

    contentEl.innerHTML = html
    countEl.textContent = query ? matchCount + ' of ' + totalItems : totalItems + ' classes'
  }

  // Toggle category
  contentEl.addEventListener('click', function (e) {
    var header = e.target.closest('.tw-category-header')
    if (header) {
      var cat = header.closest('.tw-category')
      if (cat) cat.classList.toggle('open')
      return
    }

    var td = e.target.closest('.tw-class')
    if (td) {
      var text = td.getAttribute('data-copy')
      if (!text) return
      navigator.clipboard.writeText(text).then(function () {
        td.classList.add('copied')
        var orig = td.textContent
        td.textContent = 'Copied!'
        setTimeout(function () {
          td.textContent = orig
          td.classList.remove('copied')
        }, 2000)
      })
    }
  })

  searchInput.addEventListener('input', render)
  render()
})()
