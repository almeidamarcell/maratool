import { validateVideoFile } from './fps-converter-core.js'

export function buildLosslessArgs({ inputName, outputName }) {
  return ['-i', inputName, '-c', 'copy', '-y', outputName]
}

export function buildReencodeArgs({ inputName, outputName, vcodec, acodec, extraVideoArgs }) {
  var args = ['-i', inputName, '-c:v', vcodec]
  if (extraVideoArgs && extraVideoArgs.length) {
    for (var i = 0; i < extraVideoArgs.length; i++) {
      args.push(extraVideoArgs[i])
    }
  }
  args.push('-c:a', acodec, '-y', outputName)
  return args
}

export function getOutputFilename(inputName, outputExt) {
  if (!inputName || typeof inputName !== 'string' || inputName === '') return 'video' + outputExt
  var dot = inputName.lastIndexOf('.')
  if (dot === -1 || dot === 0) return inputName + outputExt
  var stem = inputName.substring(0, dot)
  return stem + outputExt
}

export function validateFormatInput(file, allowedTypes) {
  var base = validateVideoFile(file)
  if (!base.valid) return base
  if (!allowedTypes || allowedTypes.indexOf(file.type) === -1) {
    return { valid: false, error: 'Unsupported format. Expected: ' + allowedTypes.join(', ') }
  }
  return { valid: true }
}
