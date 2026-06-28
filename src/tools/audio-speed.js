import { initFfmpegTool } from './ezgif-ffmpeg-ui.js'
import { buildAudioSpeedArgs } from './ezgif-audio-core.js'
import { getAudioOutputFilename } from './ezgif-audio-core.js'

initFfmpegTool({
  buildArgs: buildAudioSpeedArgs,
  outputExt: '.mp4',
  outputSuffix: 'speed',
  acceptVideo: false,
  acceptAudio: true,
  getOutputName: function (n, s, e) { return getAudioOutputFilename(n, s, e || '.mp3') },
})
