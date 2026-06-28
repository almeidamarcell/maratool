export function initEzgifStub(slug) {
  var root = document.getElementById('ez-root')
  if (!root) return
  root.innerHTML = '<p class="tool-hint">Tool <strong>' + slug + '</strong> — open the upload UI on the full tool page. Stub loads for generated tools pending full UI.</p>'
}
