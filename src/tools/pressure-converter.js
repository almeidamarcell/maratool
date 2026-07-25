/**
 * Pressure Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'prc',
    categories: {
      pressure: { label: 'Pressure', base: 'pascal', units: {
        'Pascal (Pa)': 1, // base unit
        'Kilopascal (kPa)': 1000, // exact
        'Megapascal (MPa)': 1e6, // exact
        'Bar (bar)': 1e5, // exact: NIST SP 811
        'Millibar (mbar)': 100, // exact
        'PSI (lbf/in²)': 6894.757293168, // NIST SP 811: 6.894757293168e3 Pa
        'Atmosphere (atm)': 101325, // exact: NIST SP 811
        'Torr (Torr)': 133.322368421, // 101325/760 (NIST SP 811)
        'Millimeter of mercury (mmHg)': 133.322387415, // exact: NIST SP 811
        'Inch of mercury (inHg)': 3386.389, // NIST SP 811, conventional (0 °C)
        'Kilogram-force per cm² (kgf/cm²)': 98066.5, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'PSI (lbf/in²)',
    defaultTo: 'Bar (bar)',
  })
})()
