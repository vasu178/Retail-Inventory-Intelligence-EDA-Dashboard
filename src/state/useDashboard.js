import { useCallback, useMemo, useState } from 'react'
import { ALL } from '../lib/constants.js'
import { DEFAULT_FILTERS, resolvePeriod, summarize } from '../lib/metrics.js'

/**
 * Owns the filter state and derives every view once per change. The status filter
 * is kept separate from the analytical filters because it only narrows the
 * inventory views (health section and table), never the sales metrics.
 */
export function useDashboard(data) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [revision, setRevision] = useState(0)

  const analysis = useMemo(
    () => summarize(data, filters),
    // revision lets the refresh button re-run the derivation on demand
    [data, filters, revision],
  )

  const period = useMemo(() => resolvePeriod(data.months, filters), [data, filters])

  const setFilter = useCallback((key, value) => {
    setFilters((current) => {
      if (key === 'periodPreset') {
        return {
          ...current,
          periodPreset: value,
          from: value === 'custom' ? current.from || data.months[0].key : null,
          to: value === 'custom' ? current.to || data.months[data.months.length - 1].key : null,
        }
      }
      return { ...current, [key]: value }
    })
  }, [data.months])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  const activeFilterCount = useMemo(() => {
    const keys = ['store', 'category', 'product', 'status']
    return keys.filter((key) => filters[key] !== ALL).length + (filters.periodPreset !== ALL ? 1 : 0)
  }, [filters])

  /** The status filter only narrows inventory-level views. */
  const inventoryPairs = useMemo(
    () =>
      filters.status === ALL
        ? analysis.pairs
        : analysis.pairs.filter((pair) => pair.status === filters.status),
    [analysis.pairs, filters.status],
  )

  return {
    filters,
    period,
    analysis,
    inventoryPairs,
    activeFilterCount,
    setFilter,
    resetFilters,
    refresh,
  }
}
