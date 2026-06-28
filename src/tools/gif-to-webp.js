import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToWebpArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: function (o) { return buildVideoToWebpArgs({ inputName: o.inputName, outputName: o.outputName, fps: 10 }) },
  outputExt: '.webp',
  outputSuffix: 'webp',
  acceptVideo: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e) },
})
