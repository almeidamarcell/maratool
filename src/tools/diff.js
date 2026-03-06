import './hash-state.js'
// Diff Checker — LCS-based line diff
(function () {
  const leftInput = document.getElementById('diff-left')
  const rightInput = document.getElementById('diff-right')
  const compareBtn = document.getElementById('diff-compare')
  const output = document.getElementById('diff-output')
  const statsEl = document.getElementById('diff-stats')

  // LCS (Longest Common Subsequence) for arrays
  function lcs(a, b) {
    const m = a.length
    const n = b.length
    // Use Myers diff-like approach for efficiency
    // For large inputs, fall back to simple LCS table
    if (m * n > 100000) {
      return simpleDiff(a, b)
    }
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
    // Backtrack
    const result = []
    let i = m, j = n
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.push({ type: 'equal', value: a[i - 1] })
        i--; j--
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        result.push({ type: 'removed', value: a[i - 1] })
        i--
      } else {
        result.push({ type: 'added', value: b[j - 1] })
        j--
      }
    }
    while (i > 0) { result.push({ type: 'removed', value: a[i - 1] }); i-- }
    while (j > 0) { result.push({ type: 'added', value: b[j - 1] }); j-- }
    return result.reverse()
  }

  // Simple diff for large inputs
  function simpleDiff(a, b) {
    const result = []
    const aSet = new Set(a)
    const bSet = new Set(b)
    // Mark lines only in a as removed, only in b as added, in both as equal
    // (simplified — not true LCS but practical for large files)
    let ai = 0, bi = 0
    while (ai < a.length || bi < b.length) {
      if (ai >= a.length) { result.push({ type: 'added', value: b[bi++] }); continue }
      if (bi >= b.length) { result.push({ type: 'removed', value: a[ai++] }); continue }
      if (a[ai] === b[bi]) { result.push({ type: 'equal', value: a[ai] }); ai++; bi++ }
      else {
        result.push({ type: 'removed', value: a[ai++] })
        result.push({ type: 'added', value: b[bi++] })
      }
    }
    return result
  }

  function compare() {
    const leftLines = leftInput.value.split('\n')
    const rightLines = rightInput.value.split('\n')

    if (!leftInput.value && !rightInput.value) {
      output.innerHTML = '<span style="color:var(--text-3);font-size:13px;">Paste text in both fields and click Compare.</span>'
      statsEl.textContent = ''
      return
    }

    const diff = lcs(leftLines, rightLines)

    let added = 0, removed = 0
    let html = ''

    diff.forEach(({ type, value }) => {
      const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      if (type === 'added') {
        html += `<div class="diff-line added">+ ${escaped}</div>`
        added++
      } else if (type === 'removed') {
        html += `<div class="diff-line removed">- ${escaped}</div>`
        removed++
      } else {
        html += `<div class="diff-line unchanged">  ${escaped}</div>`
      }
    })

    output.innerHTML = html || '<span style="color:var(--text-3);">No differences found — the texts are identical.</span>'

    if (added === 0 && removed === 0) {
      statsEl.textContent = 'Identical'
    } else {
      const parts = []
      if (added > 0) parts.push(`${added} line${added === 1 ? '' : 's'} added`)
      if (removed > 0) parts.push(`${removed} line${removed === 1 ? '' : 's'} removed`)
      statsEl.textContent = parts.join(', ')
    }
  }

  compareBtn.addEventListener('click', compare)

  // ---- HASH STATE ----
  function saveHash() {
    HashState.save({ left: leftInput.value, right: rightInput.value })
  }

  leftInput.addEventListener('input', saveHash)
  rightInput.addEventListener('input', saveHash)

  // Restore
  var saved = HashState.parse()
  if (saved.left !== undefined) leftInput.value = saved.left
  if (saved.right !== undefined) rightInput.value = saved.right
  if (saved.left && saved.right) compare()
})()
