import { initGifExtTool } from './ezgif-gif-ext-ui.js'

// 'split' cuts one GIF into several shorter GIFs. It is not 'to-frames', which
// this page used to run — that extracts stills and is what /gif-to-frames is for.
initGifExtTool({ mode: 'split', suffix: 'part' })
