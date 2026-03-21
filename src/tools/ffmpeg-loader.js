// Shared FFmpeg loader — custom classic Worker approach
// The official @ffmpeg/ffmpeg ESM Worker silently hangs without SharedArrayBuffer.
// This module creates a classic (non-module) Worker using the UMD core build,
// avoiding all SharedArrayBuffer and cross-origin module resolution issues.

var CDN = 'https://cdn.jsdelivr.net/npm'

async function toBlobURL(url, mimeType) {
  var resp = await fetch(url)
  var blob = new Blob([await resp.arrayBuffer()], { type: mimeType })
  return URL.createObjectURL(blob)
}

export function createFFmpegWrapper() {
  var pending = {}
  var msgId = 0
  var logCallbacks = []
  var worker = null

  function send(type, data, transfer) {
    return new Promise(function (resolve, reject) {
      var id = ++msgId
      pending[id] = { resolve: resolve, reject: reject }
      worker.postMessage({ id: id, type: type, data: data }, transfer || [])
    })
  }

  var workerCode = [
    'var ffmpegCore = null;',
    'self.onmessage = async function(e) {',
    '  var msg = e.data;',
    '  try {',
    '    if (msg.type === "LOAD") {',
    '      importScripts(msg.data.coreURL);',
    '      ffmpegCore = await createFFmpegCore({',
    '        wasmBinary: msg.data.wasmBinary,',
    '        print: function(t) { self.postMessage({ type: "LOG", data: t }); },',
    '        printErr: function(t) { self.postMessage({ type: "LOG", data: t }); }',
    '      });',
    '      self.postMessage({ id: msg.id, type: "OK", data: true });',
    '    } else if (msg.type === "EXEC") {',
    '      ffmpegCore.setTimeout(-1);',
    '      ffmpegCore.exec.apply(null, msg.data);',
    '      var ret = ffmpegCore.ret;',
    '      ffmpegCore.reset();',
    '      self.postMessage({ id: msg.id, type: "OK", data: ret });',
    '    } else if (msg.type === "WRITE") {',
    '      var fs = ffmpegCore.FS || ffmpegCore["FS"];',
    '      fs.writeFile(msg.data.path, new Uint8Array(msg.data.buf));',
    '      self.postMessage({ id: msg.id, type: "OK", data: true });',
    '    } else if (msg.type === "READ") {',
    '      var fs = ffmpegCore.FS || ffmpegCore["FS"];',
    '      var d = fs.readFile(msg.data.path);',
    '      self.postMessage({ id: msg.id, type: "OK", data: d }, [d.buffer]);',
    '    } else if (msg.type === "DELETE") {',
    '      var fs = ffmpegCore.FS || ffmpegCore["FS"];',
    '      try { fs.unlink(msg.data.path); } catch(_){}',
    '      self.postMessage({ id: msg.id, type: "OK", data: true });',
    '    }',
    '  } catch(err) {',
    '    self.postMessage({ id: msg.id, type: "ERR", data: err.message || String(err) });',
    '  }',
    '};'
  ].join('\n')

  return {
    _lastLogs: [],
    on: function (event, cb) {
      if (event === 'log') logCallbacks.push(cb)
    },
    load: async function (opts) {
      var blob = new Blob([workerCode], { type: 'text/javascript' })
      worker = new Worker(URL.createObjectURL(blob))

      worker.onmessage = function (e) {
        var msg = e.data
        if (msg.type === 'LOG') {
          for (var i = 0; i < logCallbacks.length; i++) logCallbacks[i]({ message: msg.data })
          return
        }
        var p = pending[msg.id]
        if (!p) return
        delete pending[msg.id]
        if (msg.type === 'ERR') p.reject(new Error(msg.data))
        else p.resolve(msg.data)
      }
      worker.onerror = function (e) { console.error('[ffmpeg worker error]', e) }

      await send('LOAD', { coreURL: opts.coreURL, wasmBinary: opts.wasmBinary }, [opts.wasmBinary])
    },
    exec: function (args) { return send('EXEC', args) },
    writeFile: function (path, buf) {
      var buffer = buf.buffer ? buf.buffer : buf
      return send('WRITE', { path: path, buf: buffer }, [buffer])
    },
    readFile: function (path) { return send('READ', { path: path }) },
    deleteFile: function (path) { return send('DELETE', { path: path }) },
  }
}

// Load FFmpeg with progress callbacks
// onProgress(pct, detail) called during loading
export async function loadFFmpeg(onProgress) {
  onProgress = onProgress || function () {}

  // Load fetchFile util
  var utilMod = await import(CDN + '/@ffmpeg/util@0.12.1/dist/esm/index.js')

  onProgress(5, 'Downloading FFmpeg core...')
  var coreBlobURL = await toBlobURL(CDN + '/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js', 'text/javascript')

  onProgress(15, 'Downloading WASM (~25 MB)...')
  var wasmResp = await fetch(CDN + '/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm')
  var wasmBinary = await wasmResp.arrayBuffer()

  onProgress(40, 'Initializing FFmpeg...')

  var ff = createFFmpegWrapper()
  await ff.load({ coreURL: coreBlobURL, wasmBinary: wasmBinary })

  onProgress(50, 'FFmpeg ready')

  return { ff: ff, fetchFile: utilMod.fetchFile }
}
