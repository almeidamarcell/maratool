import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildVideoSpeedArgs } from './ezgif-video-ext-core.js'
import { getVideoExtOutputFilename } from './ezgif-video-ext-core.js'

initFfmpegTool({
  buildArgs: buildVideoSpeedArgs,
  outputExt: '.mp4',
  outputSuffix: 'smooth',
  acceptVideo: true,
  acceptAudio: false,
  getOutputName: function (n, s, e) { return getVideoExtOutputFilename(n, s, e || '.mp4') },
})
