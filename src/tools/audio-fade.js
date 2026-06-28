import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildFadeAudioArgs } from './ezgif-audio-core.js'
import { getAudioOutputFilename } from './ezgif-audio-core.js'

initFfmpegTool({
  buildArgs: buildFadeAudioArgs,
  outputExt: '.mp4',
  outputSuffix: 'fade',
  acceptVideo: false,
  acceptAudio: true,
  getOutputName: function (n, s, e) { return getAudioOutputFilename(n, s, e || '.mp3') },
})
