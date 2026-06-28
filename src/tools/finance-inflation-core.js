/** US CPI multipliers (approximate, base 2000 = 1.0) — for educational estimates */

const CPI_INDEX = {
  1990: 0.65, 1995: 0.75, 2000: 1.0, 2005: 1.15, 2010: 1.22,
  2015: 1.32, 2020: 1.45, 2021: 1.52, 2022: 1.65, 2023: 1.72, 2024: 1.78, 2025: 1.82,
}

function cpiForYear(year) {
  if (CPI_INDEX[year]) return CPI_INDEX[year]
  const years = Object.keys(CPI_INDEX).map(Number).sort((a, b) => a - b)
  if (year <= years[0]) return CPI_INDEX[years[0]]
  if (year >= years[years.length - 1]) return CPI_INDEX[years[years.length - 1]]
  for (let i = 0; i < years.length - 1; i++) {
    if (year >= years[i] && year <= years[i + 1]) {
      const t = (year - years[i]) / (years[i + 1] - years[i])
      return CPI_INDEX[years[i]] + t * (CPI_INDEX[years[i + 1]] - CPI_INDEX[years[i]])
    }
  }
  return 1
}

export function inflationAdjust(amount, fromYear, toYear) {
  const from = cpiForYear(fromYear)
  const to = cpiForYear(toYear)
  const adjusted = amount * (to / from)
  const pctChange = ((to / from) - 1) * 100
  return { adjusted, pctChange, fromCpi: from, toCpi: to }
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
