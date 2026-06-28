import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildCutAudioArgs } from './ezgif-audio-core.js'
import { getAudioOutputFilename } from './ezgif-audio-core.js'

initFfmpegTool({
  buildArgs: buildCutAudioArgs,
  outputExt: '.mp4',
  outputSuffix: 'trimmed',
  acceptVideo: false,
  acceptAudio: true,
  getOutputName: function (n, s, e) { return getAudioOutputFilename(n, s, e || '.mp3') },
})
