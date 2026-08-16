import { initGifExtTool } from './ezgif-gif-ext-ui.js'

// A sprite sheet is one composited grid image. 'to-frames' — which this page
// used to run — writes each frame as its own PNG, which is /gif-to-frames.
initGifExtTool({ mode: 'sprite-sheet', suffix: 'sprite' })
