/** Formatting helpers. All numbers come from the dataset - nothing is invented here. */

const integerFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const oneDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const twoDecimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatInteger(value) {
  return value === null || value === undefined ? '--' : integerFormatter.format(value)
}

export function formatDecimal(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  return digits === 2 ? twoDecimalFormatter.format(value) : oneDecimalFormatter.format(value)
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  return `${formatDecimal(value, digits)}%`
}

/** 6750876 -> "6.75M", 372344 -> "372K", 950 -> "950". */
export function formatCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '--'
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (absolute >= 10_000) return `${Math.round(value / 1000)}K`
  if (absolute >= 1_000) return `${(value / 1000).toFixed(1)}K`
  return integerFormatter.format(Math.round(value))
}

export function formatDays(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'No demand'
  return `${formatDecimal(value, 2)} d`
}

export function formatMonthRange(months) {
  if (!months.length) return 'No data'
  if (months.length === 1) return months[0].label
  return `${months[0].label} – ${months[months.length - 1].label}`
}
