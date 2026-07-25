/**
 * Torque Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'tqc',
    categories: {
      torque: { label: 'Torque', base: 'newton-meter', units: {
        'Newton-meter (N·m)': 1, // base unit
        'Newton-centimeter (N·cm)': 0.01, // exact
        'Foot-pound (ft·lbf)': 1.3558179483314004, // exact: NIST SP 811
        'Inch-pound (in·lbf)': 0.1129848290276167, // exact: ft·lbf/12
        'Kilogram-force meter (kgf·m)': 9.80665, // exact: NIST SP 811
        'Kilogram-force centimeter (kgf·cm)': 0.0980665, // exact: kgf·m/100
      } }
    },
    defaultFrom: 'Newton-meter (N·m)',
    defaultTo: 'Foot-pound (ft·lbf)',
  })
})()
