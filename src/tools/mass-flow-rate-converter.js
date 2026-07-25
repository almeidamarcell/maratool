/**
 * Mass Flow Rate — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'mfc',
    categories: {
      massflow: { label: 'Mass flow rate', base: 'kilogram per second', units: {
        'Kilogram per second (kg/s)': 1, // base unit (SI)
        'Kilogram per minute (kg/min)': 0.016666666666666666, // exact fraction: 1/60
        'Kilogram per hour (kg/h)': 0.0002777777777777778, // exact fraction: 1/3600
        'Gram per second (g/s)': 0.001, // exact
        'Tonne per hour (t/h)': 0.2777777777777778, // exact fraction: 1000/3600
        'Pound per second (lb/s)': 0.45359237, // exact: NIST SP 811 pound
        'Pound per minute (lb/min)': 0.007559872833333333, // exact: 0.45359237/60
        'Pound per hour (lb/h)': 0.00012599788055555556, // exact: 0.45359237/3600
      } }
    },
    defaultFrom: 'Kilogram per hour (kg/h)',
    defaultTo: 'Pound per hour (lb/h)',
  })
})()
