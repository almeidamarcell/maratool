import {
  TEXT_INPUT_FORMATS,
  buildConversionOptions,
  parseConversionResult,
} from './document-converter-core.js'

var pandocApi = null

export async function initPandoc(onProgress) {
  if (pandocApi) return pandocApi
  if (onProgress) onProgress('Downloading Pandoc engine (~56 MB, one-time)…')
  var wasmResp = await fetch('/vendor/pandoc.wasm')
  if (!wasmResp.ok) throw new Error('Pandoc WASM not found. Run npm install and rebuild.')
  var wasmBuffer = await wasmResp.arrayBuffer()
  if (onProgress) onProgress('Initializing Pandoc…')
  var apiResp = await fetch('/vendor/pandoc-api.js')
  if (!apiResp.ok) throw new Error('Pandoc API bundle not found. Run npm install and rebuild.')
  var apiBlob = new Blob([await apiResp.text()], { type: 'text/javascript' })
  var apiUrl = URL.createObjectURL(apiBlob)
  var mod = await import(apiUrl)
  URL.revokeObjectURL(apiUrl)
  pandocApi = await mod.createPandocInstance(wasmBuffer)
  if (onProgress) onProgress('Pandoc ready')
  return pandocApi
}

export async function convertDocument(file, inputFormat, outputFormat) {
  var pandoc = await initPandoc()
  var inputFilename = file.name
  var options = buildConversionOptions(inputFormat, outputFormat, inputFilename)
  var files = {}
  var stdin = null

  if (TEXT_INPUT_FORMATS.has(inputFormat)) {
    stdin = await file.text()
  } else {
    files[inputFilename] = file
  }

  var result = await pandoc.convert(options, stdin, files)
  return parseConversionResult(result, outputFormat, options)
}

export async function zipWithMedia(outputBlob, outputName, mediaFiles) {
  var JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default
  var zip = new JSZip()
  zip.file(outputName, outputBlob)
  for (var path in mediaFiles) {
    zip.file(path, mediaFiles[path])
  }
  return zip.generateAsync({ type: 'blob' })
}
