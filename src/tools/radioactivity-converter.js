/**
 * Becquerel to Curie — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: US NRC — Measuring Radiation (https://www.nrc.gov/about-nrc/radiation/health-effects/measuring-radiation.html)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'rac',
    categories: {
      radioactivity: { label: 'Radioactivity', base: 'becquerel', units: {
        'Terabecquerel (TBq)': 1e12, // exact SI prefix
        'Gigabecquerel (GBq)': 1e9, // exact SI prefix
        'Megabecquerel (MBq)': 1e6, // exact SI prefix
        'Kilobecquerel (kBq)': 1e3, // exact SI prefix
        'Becquerel (Bq)': 1, // SI derived unit: 1 decay/s (BIPM)
        'Curie (Ci)': 3.7e10, // exact: NIST SP 811 / US NRC
        'Millicurie (mCi)': 3.7e7, // exact
        'Microcurie (µCi)': 3.7e4, // exact
        'Nanocurie (nCi)': 37, // exact
        'Picocurie (pCi)': 0.037, // exact
        'Disintegrations per minute (dpm)': 0.016666666666666666, // exact fraction: 1/60 Bq
        'Disintegrations per second (dps)': 1, // exact: identical to Bq
      } }
    },
    defaultFrom: 'Millicurie (mCi)',
    defaultTo: 'Megabecquerel (MBq)',
  })
})()
