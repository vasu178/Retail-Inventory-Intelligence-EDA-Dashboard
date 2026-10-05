/**
 * All analytical logic for the dashboard lives here as pure functions over the
 * generated dataset. Components only render what these functions return, so no
 * metric is ever calculated twice or hard-coded in the UI.
 *
 * Definitions (project assumptions, see README):
 *   Average Inventory     day-weighted mean of Inventory Level for a product-store pair
 *   Average Daily Demand  summed Demand / trading days in the selected window
 *   Days of Inventory     Average Inventory / Average Daily Demand (null when demand is 0)
 *   Fulfilment Rate       SUM(Units Sold) / SUM(Demand) * 100
 */

import { ALL, MONTH_SHORT_LABELS, POLICY_DAYS, STATUS, STATUS_ORDER, THRESHOLDS } from './constants.js'

/** Applies the project's inventory-status thresholds. */
export function classifyStatus(daysOfInventory, avgDailyDemand) {
  if (!(avgDailyDemand > 0)) return STATUS.NO_DEMAND
  if (daysOfInventory === null || Number.isNaN(daysOfInventory)) return STATUS.NO_DEMAND
  if (daysOfInventory < THRESHOLDS.criticalBelow) return STATUS.CRITICAL
  if (daysOfInventory < THRESHOLDS.lowBelow) return STATUS.LOW_STOCK
  if (daysOfInventory <= THRESHOLDS.healthyMax) return STATUS.HEALTHY
  return STATUS.OVERSTOCK
}

export const DEFAULT_FILTERS = {
  store: ALL,
  category: ALL,
  product: ALL,
  status: ALL,
  periodPreset: ALL,
  from: null,
  to: null,
}

/** Builds the period dropdown options from the months actually present in the data. */
export function buildPeriodOptions(months) {
  const years = [...new Set(months.map((month) => month.key.slice(0, 4)))]
  const options = [
    {
      value: ALL,
      label: `Full range (${months[0].shortLabel} ${months[0].key.slice(0, 4)} – ${months[months.length - 1].shortLabel} ${months[months.length - 1].key.slice(0, 4)})`,
    },
  ]
  years.forEach((year) => options.push({ value: year, label: year }))
  options.push({ value: 'last12', label: 'Last 12 months' })
  options.push({ value: 'last6', label: 'Last 6 months' })
  options.push({ value: 'custom', label: 'Custom range' })
  return options
}

/** Resolves a period preset (or custom from/to) to inclusive month indexes. */
export function resolvePeriod(months, { periodPreset = ALL, from = null, to = null } = {}) {
  const last = months.length - 1
  const indexOf = (key, fallback) => {
    const index = months.findIndex((month) => month.key === key)
    return index === -1 ? fallback : index
  }
  switch (periodPreset) {
    case 'last12':
      return { fromIndex: Math.max(0, last - 11), toIndex: last }
    case 'last6':
      return { fromIndex: Math.max(0, last - 5), toIndex: last }
    case 'custom':
      return { fromIndex: indexOf(from, 0), toIndex: indexOf(to, last) }
    case ALL:
      return { fromIndex: 0, toIndex: last }
    default: {
      const matching = months
        .map((month, index) => ({ index, year: month.key.slice(0, 4) }))
        .filter((month) => month.year === periodPreset)
      return matching.length
        ? { fromIndex: matching[0].index, toIndex: matching[matching.length - 1].index }
        : { fromIndex: 0, toIndex: last }
    }
  }
}

/** Filters the fact table by store / category / product / period. */
export function selectRows(data, filters = {}) {
  const { store = ALL, category = ALL, product = ALL } = filters
  const { fromIndex, toIndex } = resolvePeriod(data.months, filters)

  const storeIndex = store === ALL ? -1 : data.stores.indexOf(store)
  const productIndex = product === ALL ? -1 : data.products.indexOf(product)
  const categoryIndex = category === ALL ? -1 : data.categories.indexOf(category)

  const pairMatches = data.pairs.map(
    (pair) =>
      (storeIndex === -1 || pair.store === storeIndex) &&
      (productIndex === -1 || pair.product === productIndex) &&
      (categoryIndex === -1 || pair.category === categoryIndex),
  )

  const rows = []
  for (const row of data.rows) {
    if (row.month < fromIndex || row.month > toIndex) continue
    if (!pairMatches[row.pair]) continue
    rows.push(row)
  }
  return rows
}

/** The five headline KPIs. */
export function computeKpis(data, rows) {
  let unitsSold = 0
  let demand = 0
  let unitsOrdered = 0
  let inventorySum = 0
  let dailyRows = 0
  const monthsSeen = new Set()

  for (const row of rows) {
    unitsSold += row.unitsSold
    demand += row.demand
    unitsOrdered += row.unitsOrdered
    inventorySum += row.inventorySum
    dailyRows += row.days
    monthsSeen.add(row.month)
  }

  let tradingDays = 0
  monthsSeen.forEach((monthIndex) => {
    tradingDays += data.months[monthIndex].days
  })

  return {
    unitsSold,
    demand,
    unitsOrdered,
    avgInventory: dailyRows ? inventorySum / dailyRows : null,
    fulfillmentRate: demand > 0 ? (unitsSold / demand) * 100 : null,
    tradingDays,
    dailyRows,
    monthCount: monthsSeen.size,
  }
}

/** Months that actually contain data for the current selection. */
export function activeMonths(data, rows) {
  const monthsSeen = new Set()
  rows.forEach((row) => monthsSeen.add(row.month))
  return [...monthsSeen].sort((a, b) => a - b).map((index) => data.months[index])
}

/**
 * Demand / units-sold series for the line chart.
 * grain: 'month' = real time series, 'calendarMonth' = aggregated by month number.
 */
export function buildDemandSeries(data, rows, grain = 'month') {
  const buckets = new Map()

  for (const row of rows) {
    const month = data.months[row.month]
    const key = grain === 'calendarMonth' ? month.monthNumber : row.month
    let bucket = buckets.get(key)
    if (!bucket) {
      bucket = {
        key,
        label: grain === 'calendarMonth' ? MONTH_SHORT_LABELS[month.monthNumber - 1] : month.shortLabel,
        fullLabel: grain === 'calendarMonth' ? `${MONTH_SHORT_LABELS[month.monthNumber - 1]} (all years)` : month.label,
        demand: 0,
        unitsSold: 0,
        unitsOrdered: 0,
        inventorySum: 0,
        days: 0,
      }
      buckets.set(key, bucket)
    }
    bucket.demand += row.demand
    bucket.unitsSold += row.unitsSold
    bucket.unitsOrdered += row.unitsOrdered
    bucket.inventorySum += row.inventorySum
    bucket.days += row.days
  }

  return [...buckets.values()]
    .sort((a, b) => a.key - b.key)
    .map((bucket) => ({
      ...bucket,
      avgInventory: bucket.days ? bucket.inventorySum / bucket.days : null,
    }))
}

/** Units sold and demand per category, highest first. */
export function buildCategoryBreakdown(data, rows) {
  const buckets = new Map()

  for (const row of rows) {
    const categoryIndex = data.pairs[row.pair].category
    let bucket = buckets.get(categoryIndex)
    if (!bucket) {
      bucket = { label: data.categories[categoryIndex], unitsSold: 0, demand: 0, orders: 0, inventorySum: 0, days: 0, pairs: new Set() }
      buckets.set(categoryIndex, bucket)
    }
    bucket.unitsSold += row.unitsSold
    bucket.demand += row.demand
    bucket.orders += row.unitsOrdered
    bucket.inventorySum += row.inventorySum
    bucket.days += row.days
    bucket.pairs.add(row.pair)
  }

  return [...buckets.values()]
    .map((bucket) => ({
      label: bucket.label,
      unitsSold: bucket.unitsSold,
      demand: bucket.demand,
      unitsOrdered: bucket.orders,
      avgInventory: bucket.days ? bucket.inventorySum / bucket.days : null,
      pairCount: bucket.pairs.size,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold || a.label.localeCompare(b.label))
}

/** Units sold, demand and average inventory per store, highest sales first. */
export function buildStoreBreakdown(data, rows) {
  const buckets = new Map()

  for (const row of rows) {
    const storeIndex = data.pairs[row.pair].store
    let bucket = buckets.get(storeIndex)
    if (!bucket) {
      bucket = { label: data.stores[storeIndex], unitsSold: 0, demand: 0, orders: 0, inventorySum: 0, days: 0, pairs: new Set() }
      buckets.set(storeIndex, bucket)
    }
    bucket.unitsSold += row.unitsSold
    bucket.demand += row.demand
    bucket.orders += row.unitsOrdered
    bucket.inventorySum += row.inventorySum
    bucket.days += row.days
    bucket.pairs.add(row.pair)
  }

  return [...buckets.values()]
    .map((bucket) => ({
      label: bucket.label,
      unitsSold: bucket.unitsSold,
      demand: bucket.demand,
      unitsOrdered: bucket.orders,
      avgInventory: bucket.days ? bucket.inventorySum / bucket.days : null,
      pairCount: bucket.pairs.size,
      fulfillmentRate: bucket.demand > 0 ? (bucket.unitsSold / bucket.demand) * 100 : null,
    }))
    .sort((a, b) => b.unitsSold - a.unitsSold || a.label.localeCompare(b.label))
}

/** Product-store inventory health for the selected window. */
export function buildPairAggregates(data, rows) {
  const buckets = new Map()

  for (const row of rows) {
    let bucket = buckets.get(row.pair)
    if (!bucket) {
      bucket = { pair: row.pair, days: 0, inventorySum: 0, unitsSold: 0, unitsOrdered: 0, demand: 0 }
      buckets.set(row.pair, bucket)
    }
    bucket.days += row.days
    bucket.inventorySum += row.inventorySum
    bucket.unitsSold += row.unitsSold
    bucket.unitsOrdered += row.unitsOrdered
    bucket.demand += row.demand
  }

  const aggregates = []
  buckets.forEach((bucket) => {
    const dimension = data.pairs[bucket.pair]
    const product = data.products[dimension.product]
    const store = data.stores[dimension.store]
    const avgInventory = bucket.days ? bucket.inventorySum / bucket.days : null
    const avgDailyDemand = bucket.days ? bucket.demand / bucket.days : null
    const daysOfInventory = avgDailyDemand > 0 ? avgInventory / avgDailyDemand : null

    aggregates.push({
      id: `${product}-${store}`,
      product,
      store,
      category: data.categories[dimension.category],
      avgInventory,
      avgDailyDemand,
      daysOfInventory,
      status: classifyStatus(daysOfInventory, avgDailyDemand),
      suggestedReorderQty: Math.max(avgDailyDemand * POLICY_DAYS - avgInventory, 0),
      unitsSold: bucket.unitsSold,
      demand: bucket.demand,
      unitsOrdered: bucket.unitsOrdered,
      tradingDays: bucket.days,
    })
  })

  return aggregates.sort((a, b) => a.store.localeCompare(b.store) || a.product.localeCompare(b.product))
}

/** Count and share per inventory status, always in the canonical status order. */
export function buildStatusDistribution(pairs) {
  const total = pairs.length
  return STATUS_ORDER.map((status) => {
    const count = pairs.filter((pair) => pair.status === status).length
    return { status, count, share: total ? (count / total) * 100 : 0 }
  })
}

/** Critical / Low Stock counts and average cover per store, riskiest first. */
export function buildStoreRisk(data, pairs) {
  const buckets = new Map()

  pairs.forEach((pair) => {
    let bucket = buckets.get(pair.store)
    if (!bucket) {
      bucket = { label: pair.store, counts: {}, total: 0, daysOfInventory: [] }
      buckets.set(pair.store, bucket)
    }
    bucket.counts[pair.status] = (bucket.counts[pair.status] || 0) + 1
    bucket.total += 1
    if (pair.daysOfInventory !== null) bucket.daysOfInventory.push(pair.daysOfInventory)
  })

  return [...buckets.values()]
    .map((bucket) => {
      const critical = bucket.counts[STATUS.CRITICAL] || 0
      const lowStock = bucket.counts[STATUS.LOW_STOCK] || 0
      return {
        label: bucket.label,
        statuses: bucket.counts,
        critical,
        lowStock,
        healthy: bucket.counts[STATUS.HEALTHY] || 0,
        overstock: bucket.counts[STATUS.OVERSTOCK] || 0,
        noDemand: bucket.counts[STATUS.NO_DEMAND] || 0,
        riskCount: critical + lowStock,
        totalPairs: bucket.total,
        avgDaysOfInventory: bucket.daysOfInventory.length
          ? bucket.daysOfInventory.reduce((total, value) => total + value, 0) / bucket.daysOfInventory.length
          : null,
      }
    })
    .sort(
      (a, b) =>
        b.riskCount - a.riskCount || b.critical - a.critical || a.label.localeCompare(b.label),
    )
}

/** Median days of cover across the pairs given (null when no pair has demand). */
export function medianCoverDays(pairs) {
  const values = pairs
    .map((pair) => pair.daysOfInventory)
    .filter((value) => value !== null && Number.isFinite(value))
    .sort((a, b) => a - b)
  if (!values.length) return null
  const middle = Math.floor(values.length / 2)
  return values.length % 2 === 0 ? (values[middle - 1] + values[middle]) / 2 : values[middle]
}

/** How many pairs ask for a replenishment in the current window. */
export function countNeedingReorder(pairs) {
  return pairs.filter((pair) => pair.suggestedReorderQty > 0).length
}

/** One call that returns every derived view for the current filters. */
export function summarize(data, filters = {}) {
  const rows = selectRows(data, filters)
  const pairs = buildPairAggregates(data, rows)
  return {
    filters,
    rows,
    months: activeMonths(data, rows),
    kpis: computeKpis(data, rows),
    pairs,
    statusDistribution: buildStatusDistribution(pairs),
    demandSeries: buildDemandSeries(data, rows, 'month'),
    seasonalitySeries: buildDemandSeries(data, rows, 'calendarMonth'),
    categories: buildCategoryBreakdown(data, rows),
    stores: buildStoreBreakdown(data, rows),
    storeRisk: buildStoreRisk(data, pairs),
    medianCover: medianCoverDays(pairs),
    reorderCount: countNeedingReorder(pairs),
  }
}
