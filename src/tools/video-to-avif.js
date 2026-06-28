import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToAvifArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoToAvifArgs,
  outputExt: '.avif',
  outputSuffix: 'avif',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.avif') },
})
