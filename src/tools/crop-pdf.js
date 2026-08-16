import { initPdfCropTool } from './pdf-crop-ui.js'

// Not initPdfTool: that module's `compress` mode only re-saves the file, which
// made this page a duplicate of /compress-pdf/ under a cropping title.
initPdfCropTool({ suffix: 'cropped' })
