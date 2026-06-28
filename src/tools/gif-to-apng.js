import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToApngArgs, getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: function (o) { return buildVideoToApngArgs({ inputName: o.inputName, outputName: o.outputName, fps: 10 }) },
  outputExt: '.apng',
  outputSuffix: 'apng',
  acceptVideo: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e) },
})
