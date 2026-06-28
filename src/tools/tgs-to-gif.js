import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildAnimatedToGifArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: function (o) { return buildAnimatedToGifArgs({ inputName: o.inputName, outputName: o.outputName, fps: 10, width: 480 }) },
  outputExt: '.gif',
  outputSuffix: 'gif',
  acceptVideo: true,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.gif') },
})
