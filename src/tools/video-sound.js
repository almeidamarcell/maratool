import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildAddAudioToVideoArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildAddAudioToVideoArgs,
  outputExt: '.mp4',
  outputSuffix: 'audio',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.mp4') },
})
