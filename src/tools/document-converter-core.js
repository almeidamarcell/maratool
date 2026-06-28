// Document converter — format metadata and helpers (no Pandoc dependency)

export const INPUT_EXTENSIONS = [
  'docx', 'doc', 'md', 'markdown', 'html', 'htm', 'rtf', 'epub', 'odt', 'csv', 'tsv', 'json', 'rst', 'docbook', 'txt',
]

export const OUTPUT_FORMATS = [
  'html', 'md', 'docx', 'epub', 'odt', 'rtf', 'csv', 'tsv', 'json', 'rst', 'docbook', 'txt',
]

export const TEXT_INPUT_FORMATS = new Set(['md', 'html', 'htm', 'csv', 'tsv', 'json', 'rst', 'txt', 'rtf', 'docbook'])

export const BINARY_OUTPUT_FORMATS = new Set(['docx', 'epub', 'odt', 'rtf'])

export function detectInputFormat(filename) {
  var ext = (filename.split('.').pop() || '').toLowerCase()
  if (ext === 'markdown') return 'md'
  if (ext === 'htm') return 'html'
  if (INPUT_EXTENSIONS.indexOf(ext) !== -1) return ext
  return 'txt'
}

export function getAvailableOutputs(inputFormat) {
  return OUTPUT_FORMATS.filter(function (fmt) {
    return fmt !== inputFormat && !(inputFormat === 'html' && fmt === 'htm')
  })
}

export function pandocReader(format) {
  var map = {
    md: 'markdown',
    html: 'html',
    htm: 'html',
    doc: 'docx',
    docx: 'docx',
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    rtf: 'rtf',
    rst: 'rst',
    epub: 'epub',
    odt: 'odt',
    docbook: 'docbook',
    txt: 'plain',
  }
  return map[format] || format
}

export function pandocWriter(format) {
  var map = {
    md: 'markdown',
    txt: 'plain',
    html: 'html',
    docx: 'docx',
    epub: 'epub',
    odt: 'odt',
    rtf: 'rtf',
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    rst: 'rst',
    docbook: 'docbook',
  }
  return map[format] || format
}

export function getOutputExtension(format) {
  var map = {
    html: 'html',
    md: 'md',
    docx: 'docx',
    epub: 'epub',
    odt: 'odt',
    rtf: 'rtf',
    csv: 'csv',
    tsv: 'tsv',
    json: 'json',
    rst: 'rst',
    docbook: 'xml',
    txt: 'txt',
  }
  return map[format] || 'txt'
}

export function getOutputMimeType(format) {
  var map = {
    html: 'text/html',
    md: 'text/markdown',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    epub: 'application/epub+zip',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
    csv: 'text/csv',
    tsv: 'text/tab-separated-values',
    json: 'application/json',
    rst: 'text/prs.fallenstein.rst',
    docbook: 'application/xml',
    txt: 'text/plain',
    zip: 'application/zip',
  }
  return map[format] || 'application/octet-stream'
}

export function buildFilename(baseName, outputFormat, isZip) {
  var stem = baseName.replace(/\.[^.]+$/, '') || 'converted'
  if (isZip) return stem + '.zip'
  return stem + '.' + getOutputExtension(outputFormat)
}

export function buildConversionOptions(inputFormat, outputFormat, inputFilename) {
  var from = pandocReader(inputFormat)
  var to = pandocWriter(outputFormat)
  var opts = {
    from: from,
    to: to,
    'extract-media': 'media',
  }

  if (!TEXT_INPUT_FORMATS.has(inputFormat)) {
    opts['input-files'] = [inputFilename]
  }

  if (outputFormat === 'html' || outputFormat === 'epub' || outputFormat === 'docbook') {
    opts.standalone = true
  }

  if (BINARY_OUTPUT_FORMATS.has(outputFormat)) {
    opts['output-file'] = 'output.' + getOutputExtension(outputFormat)
  }

  return opts
}

export function isPreviewable(format, isBinary) {
  if (isBinary) return false
  return format === 'html' || format === 'md' || format === 'txt' || format === 'json' || format === 'csv' || format === 'tsv' || format === 'rst' || format === 'rtf' || format === 'docbook'
}

export function wrapHtmlPreview(html) {
  if (!html) return ''
  if (/<!DOCTYPE/i.test(html) || /<html[\s>]/i.test(html)) return html
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:720px;margin:2rem auto;line-height:1.6;color:#1a1a18;padding:0 1rem}pre,code{font-family:monospace;background:#f7f7f5;padding:0.2em 0.4em;border-radius:4px}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #e8e8e4;padding:6px 10px}</style></head><body>' + html + '</body></html>'
}

export function parseConversionResult(result, outputFormat, options) {
  var outputFile = options['output-file']
  var stdout = result.stdout || ''
  var stderr = result.stderr || ''
  var warnings = result.warnings || []
  var mediaKeys = Object.keys(result.mediaFiles || {})
  var hasMedia = mediaKeys.length > 0

  if (stderr && !stdout && !outputFile) {
    throw new Error(stderr.trim().split('\n')[0] || 'Conversion failed')
  }

  if (outputFile && result.files && result.files[outputFile]) {
    return {
      type: 'binary',
      blob: result.files[outputFile],
      content: null,
      hasMedia: hasMedia,
      mediaFiles: result.mediaFiles,
      outputFilename: outputFile,
      warnings: warnings,
      stderr: stderr,
    }
  }

  if (stderr && !stdout) {
    throw new Error(stderr.trim().split('\n')[0] || 'Conversion failed')
  }

  return {
    type: 'text',
    blob: null,
    content: stdout,
    hasMedia: hasMedia,
    mediaFiles: result.mediaFiles,
    outputFilename: null,
    warnings: warnings,
    stderr: stderr,
  }
}
