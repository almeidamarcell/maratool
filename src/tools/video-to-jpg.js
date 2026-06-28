import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToImageArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoToImageArgs,
  outputExt: '.jpg',
  outputSuffix: 'frame',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.jpg') },
})
