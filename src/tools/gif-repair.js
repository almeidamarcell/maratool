import { initGifAnimTool } from './gif-anim-ui.js'

// 'repair' diagnoses the file's byte structure, salvages every decodable frame
// and re-encodes a clean GIF. The old wiring was 'loop-count', which only
// rewrote the Netscape loop block — that page is /gif-loop-count.
initGifAnimTool({ op: 'repair', suffix: 'repaired' })
