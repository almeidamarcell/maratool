/**
 * Volume Converter — config for the shared linear conversion engine.
 * Factors are multiply-to-base; each line cites its source for factor audit.
 * Reference: NIST Special Publication 811 (https://www.nist.gov/pml/special-publication-811)
 */
import './convert-engine.js'

;(function () {
  window.maratoolConvertEngine({
    prefix: 'vlc',
    categories: {
      volume: { label: 'Volume', base: 'liter', units: {
        'Cubic meter (m³)': 1000, // exact: 1 m³ = 1000 L
        'Liter (L)': 1, // base unit
        'Milliliter (mL)': 0.001, // exact
        'US gallon (gal)': 3.785411784, // exact: NIST SP 811, 231 in³
        'US quart (qt)': 0.946352946, // exact: gal/4
        'US pint (pt)': 0.473176473, // exact: gal/8
        'US cup (cup)': 0.2365882365, // exact: gal/16 (NIST SP 811)
        'US fluid ounce (fl oz)': 0.0295735295625, // exact: gal/128
        'Tablespoon (tbsp)': 0.01478676478125, // exact: fl oz/2
        'Teaspoon (tsp)': 0.00492892159375, // exact: fl oz/6
        'Imperial gallon (imp gal)': 4.54609, // exact: UK Weights and Measures Act
        'Cubic foot (ft³)': 28.316846592, // exact: NIST SP 811
        'Cubic inch (in³)': 0.016387064, // exact: NIST SP 811
      } }
    },
    defaultFrom: 'US gallon (gal)',
    defaultTo: 'Liter (L)',
  })
})()
