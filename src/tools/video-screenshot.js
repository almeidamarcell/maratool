import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoScreenshotArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoScreenshotArgs,
  outputExt: '.png',
  outputSuffix: 'frame',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.png') },
})
