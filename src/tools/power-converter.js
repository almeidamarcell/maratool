/**
 * Power Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'pwc',
    categories: {
      power: { label: 'Power', base: 'watt', units: {
        'Watt (W)': 1, // base unit
        'Kilowatt (kW)': 1000, // exact
        'Megawatt (MW)': 1e6, // exact
        'Horsepower, mechanical (hp)': 745.6998715822702, // exact: 550 ft·lbf/s (NIST SP 811)
        'Horsepower, metric (PS)': 735.49875, // exact: 75 kgf·m/s (NIST SP 811)
        'BTU per hour (BTU/h)': 0.2930710701722222, // exact: 1055.05585262/3600
        'Foot-pound per second (ft·lbf/s)': 1.3558179483314004, // exact: NIST SP 811
        'Ton of refrigeration (RT)': 3516.8528420666665, // exact: 12 000 BTU(IT)/h
      } }
    },
    defaultFrom: 'Horsepower, mechanical (hp)',
    defaultTo: 'Kilowatt (kW)',
  })
})()
