import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildFreezeVideoArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildFreezeVideoArgs,
  outputExt: '.mp4',
  outputSuffix: 'freeze',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.mp4') },
})
