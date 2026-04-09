/**
 * MockupCommon — shared utilities for all mockup tools.
 * IIFE, no imports. Attaches to window.MockupCommon.
 * Assumes html2canvas is loaded as a global from CDN.
 */
;(function () {
  window.MockupCommon = {
    /**
     * Toggle .dark class on the phone screen element.
     * @param {HTMLElement} screenEl - The .phone-screen element
     * @returns {boolean} Whether dark mode is now on
     */
    toggleDarkMode: function (screenEl) {
      screenEl.classList.toggle('dark')
      return screenEl.classList.contains('dark')
    },

    /**
     * Toggle .no-frame class on the phone frame element.
     * @param {HTMLElement} frameEl - The .phone-frame element
     * @returns {boolean} Whether the frame is now visible
     */
    toggleFrame: function (frameEl) {
      frameEl.classList.toggle('no-frame')
      return !frameEl.classList.contains('no-frame')
    },

    /**
     * Export a DOM element as a PNG download using html2canvas.
     * @param {HTMLElement} targetEl - Element to capture
     * @param {string} filename - Download filename (e.g. 'whatsapp-mockup.png')
     */
    exportPNG: function (targetEl, filename) {
      if (typeof html2canvas !== 'function') {
        console.error('MockupCommon.exportPNG: html2canvas is not loaded')
        return
      }
      html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      }).then(function (canvas) {
        canvas.toBlob(function (blob) {
          var url = URL.createObjectURL(blob)
          var a = document.createElement('a')
          a.href = url
          a.download = filename || 'mockup.png'
          a.click()
          URL.revokeObjectURL(url)
        }, 'image/png')
      })
    },

    /**
     * Returns current time as HH:MM string.
     * @returns {string}
     */
    getTimeNow: function () {
      var d = new Date()
      return (
        d.getHours().toString().padStart(2, '0') +
        ':' +
        d.getMinutes().toString().padStart(2, '0')
      )
    },
  }
})()
