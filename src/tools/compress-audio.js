import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildCompressAudioArgs } from './ezgif-audio-core.js'
import { getAudioOutputFilename } from './ezgif-audio-core.js'

initFfmpegTool({
  buildArgs: buildCompressAudioArgs,
  outputExt: '.mp4',
  outputSuffix: 'compressed',
  acceptVideo: false,
  acceptAudio: true,
  getOutputName: function (n, s, e) { return getAudioOutputFilename(n, s, e || '.mp3') },
})
