import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildGifToMp4Args } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildGifToMp4Args,
  outputExt: '.mov',
  outputSuffix: 'live',
  acceptVideo: false,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.mov') },
})
