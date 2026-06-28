import { loadFFmpeg } from './ffmpeg-loader.js'
import { createBatchConverter } from './batch-converter.js'

;(function () {
  var P = 'w2m'
  var dropzone = document.getElementById(P + '-dropzone')
  var fileInput = document.getElementById(P + '-file')
  var workspace = document.getElementById(P + '-workspace')
  var progress = document.getElementById(P + '-progress')
  var progressText = document.getElementById(P + '-progress-text')
  var progressFill = document.getElementById(P + '-progress-fill')
  var errorEl = document.getElementById(P + '-error')
  var errorText = document.getElementById(P + '-error-text')

  var ffmpegState = null
  var batch = null

  function showErr(msg) {
    errorEl.style.display = ''
    errorText.textContent = msg
    workspace.style.display = 'none'
    progress.style.display = 'none'
  }

  function buildWorkspace() {
    workspace.innerHTML =
      '<div class="' + P + '-controls">' +
      '<div class="' + P + '-row"><label class="tool-label">Quality (CRF) <input type="range" id="' + P + '-quality" min="18" max="35" value="23" /> <span id="' + P + '-quality-val">23</span></label></div>' +
      '<div class="' + P + '-row"><label class="tool-label">Resolution <select id="' + P + '-res" class="tool-input">' +
      '<option value="original">Original</option><option value="720">720p max</option><option value="480">480p max</option></select></label></div>' +
      '<div id="' + P + '-batch-mount"></div>' +
      '<div class="' + P + '-actions">' +
      '<button class="tool-button" id="' + P + '-convert">Convert to MP4</button>' +
      '<button class="copy-btn" id="' + P + '-change">Change files</button></div></div>'
    workspace.style.display = ''
    dropzone.style.display = 'none'

    document.getElementById(P + '-quality').addEventListener('input', function () {
      document.getElementById(P + '-quality-val').textContent = this.value
    })

    batch = createBatchConverter({
      mount: document.getElementById(P + '-batch-mount'),
      accept: 'image/webp',
      multiple: true,
      prefix: P + '-batch',
    })

    document.getElementById(P + '-convert').addEventListener('click', convertAll)
    document.getElementById(P + '-change').addEventListener('click', reset)
  }

  async function ensureFfmpeg() {
    if (ffmpegState) return ffmpegState
    progress.style.display = ''
    progressText.textContent = 'Loading FFmpeg...'
    progressFill.style.width = '5%'
    ffmpegState = await loadFFmpeg(function (pct) {
      progressFill.style.width = Math.min(pct, 30) + '%'
    })
    progress.style.display = 'none'
    return ffmpegState
  }

  async function convertOne(file, settings) {
    var state = await ensureFfmpeg()
    var ff = state.ff
    var fetchFile = state.fetchFile
    var inName = 'in_' + Date.now() + '.webp'
    var outName = 'out_' + Date.now() + '.mp4'
    var data = await fetchFile(file)
    await ff.writeFile(inName, data)

    var args = ['-i', inName]
    if (settings.res !== 'original') {
      var h = settings.res === '720' ? 720 : 480
      args.push('-vf', 'scale=-2:' + h)
    }
    args.push('-c:v', 'libx264', '-crf', String(settings.quality), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outName)

    var ret = await ff.exec(args)
    if (ret !== 0) throw new Error('FFmpeg conversion failed.')
    var out = await ff.readFile(outName)
    await ff.deleteFile(inName)
    await ff.deleteFile(outName)
    return new Blob([out.buffer], { type: 'video/mp4' })
  }

  async function convertAll() {
    var files = batch.getFiles()
    if (!files.length) { showErr('Add at least one WebP file.'); return }
    var settings = {
      quality: parseInt(document.getElementById(P + '-quality').value, 10),
      res: document.getElementById(P + '-res').value,
    }
    errorEl.style.display = 'none'
    await batch.run(files, function (file, onProgress) {
      return convertOne(file, settings).then(function (blob) {
        onProgress(100)
        return {
          blob: blob,
          filename: file.name.replace(/\.webp$/i, '') + '.mp4',
        }
      })
    })
  }

  function showWorkspace() {
    if (!workspace.innerHTML) buildWorkspace()
    else workspace.style.display = ''
    dropzone.style.display = 'none'
  }

  function handleFiles(fileList) {
    var files = Array.from(fileList).filter(function (f) {
      return f.type === 'image/webp' || /\.webp$/i.test(f.name)
    })
    if (!files.length) { showErr('Please upload WebP files.'); return }
    showWorkspace()
    batch.addFiles(files)
  }

  function reset() {
    workspace.innerHTML = ''
    workspace.style.display = 'none'
    dropzone.style.display = ''
    fileInput.value = ''
    batch = null
  }

  dropzone.addEventListener('click', function () { fileInput.click() })
  fileInput.setAttribute('multiple', 'multiple')
  fileInput.setAttribute('accept', 'image/webp,.webp')
  dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over') })
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault(); dropzone.classList.remove('drag-over')
    handleFiles(e.dataTransfer.files)
  })
  fileInput.addEventListener('change', function () {
    handleFiles(fileInput.files)
  })
})()
