/**
 * Frequency Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: BIPM SI Brochure (https://www.bipm.org/en/publications/si-brochure)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'fqc',
    categories: {
      frequency: { label: 'Frequency', base: 'hertz', units: {
        'Hertz (Hz)': 1, // base unit: 1 cycle per second
        'Kilohertz (kHz)': 1e3, // exact
        'Megahertz (MHz)': 1e6, // exact
        'Gigahertz (GHz)': 1e9, // exact
        'Revolutions per minute (RPM)': 0.016666666666666666, // exact fraction: 1/60 Hz
        'Beats per minute (BPM)': 0.016666666666666666, // exact fraction: 1/60 Hz
        'Radian per second (rad/s)': 0.15915494309189535, // 1/(2π) Hz (BIPM SI Brochure)
      } }
    },
    defaultFrom: 'Hertz (Hz)',
    defaultTo: 'Revolutions per minute (RPM)',
  })
})()
