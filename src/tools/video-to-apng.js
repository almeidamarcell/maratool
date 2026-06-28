import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoToApngArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoToApngArgs,
  outputExt: '.apng',
  outputSuffix: 'apng',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.apng') },
})
