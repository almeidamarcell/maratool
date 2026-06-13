export function buildMuteArgs({ inputName, outputName }) {
  return ['-i', inputName, '-an', '-c:v', 'copy', '-y', outputName]
}

export function getOutputFilename(inputName) {
  if (!inputName || typeof inputName !== 'string') return 'video-muted.mp4'
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + '-muted.mp4'
  var stem = inputName.substring(0, dot)
  var ext = inputName.substring(dot)
  return stem + '-muted' + ext
}
