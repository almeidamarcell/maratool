import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToWebpArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoToWebpArgs,
  outputExt: '.webp',
  outputSuffix: 'webp',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.webp') },
})
