/**
 * Area Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'arc',
    categories: {
      area: { label: 'Area', base: 'square meter', units: {
        'Square kilometer (km²)': 1e6, // exact: 1 km² = 1 000 000 m²
        'Square meter (m²)': 1, // base unit
        'Square centimeter (cm²)': 1e-4, // exact: 1 cm² = 0.0001 m²
        'Square millimeter (mm²)': 1e-6, // exact: 1 mm² = 0.000001 m²
        'Hectare (ha)': 1e4, // exact: 1 ha = 10 000 m² (NIST SP 811)
        'Acre (ac)': 4046.8564224, // exact: NIST SP 811, international foot
        'Square mile (mi²)': 2589988.110336, // exact: NIST SP 811
        'Square yard (yd²)': 0.83612736, // exact: NIST SP 811
        'Square foot (ft²)': 0.09290304, // exact: NIST SP 811
        'Square inch (in²)': 0.00064516, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'Square foot (ft²)',
    defaultTo: 'Square meter (m²)',
  })
})()
