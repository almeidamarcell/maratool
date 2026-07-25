/**
 * Flow Rate Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'vfc',
    categories: {
      volflow: { label: 'Volumetric flow rate', base: 'cubic meter per second', units: {
        'Cubic meter per second (m³/s)': 1, // base unit (SI)
        'Cubic meter per hour (m³/h)': 0.0002777777777777778, // exact fraction: 1/3600
        'Liter per second (L/s)': 0.001, // exact
        'Liter per minute (L/min)': 0.000016666666666666667, // exact fraction: 0.001/60
        'Liter per hour (L/h)': 2.7777777777777776e-7, // exact fraction: 0.001/3600
        'US gallon per minute (GPM)': 0.0000630901964, // exact: 3.785411784e-3/60
        'US gallon per hour (GPH)': 0.0000010515032733333333, // exact: 3.785411784e-3/3600
        'Cubic foot per minute (CFM)': 0.0004719474432, // exact: 0.028316846592/60
        'Cubic foot per second (ft³/s)': 0.028316846592, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'US gallon per minute (GPM)',
    defaultTo: 'Liter per minute (L/min)',
  })
})()
