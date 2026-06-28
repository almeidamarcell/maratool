import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildReverseVideoArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildReverseVideoArgs,
  outputExt: '.mp4',
  outputSuffix: 'reversed',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.mp4') },
})
