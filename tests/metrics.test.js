/**
 * Verifies the dashboard's calculation layer against values computed independently
 * in pandas (data/expected_reference.json, written by analysis/build_dashboard_data.py).
 * If either pipeline drifts these tests fail.
 */

import { describe, expect, it } from 'vitest'
import reference from '../data/expected_reference.json'
import { dataset } from '../src/lib/dataset.js'
import {
  ALL,
  classifyStatus,
  computeKpis,
  medianCoverDays,
  selectRows,
  summarize,
} from '../src/lib/metrics.js'
import { STATUS, STATUS_ORDER } from '../src/lib/constants.js'

function toFilters(filters) {
  const custom = Boolean(filters.from || filters.to)
  return {
    store: filters.store ?? ALL,
    category: filters.category ?? ALL,
    product: filters.product ?? ALL,
    status: ALL,
    periodPreset: custom ? 'custom' : ALL,
    from: filters.from ?? null,
    to: filters.to ?? null,
  }
}

const byId = (id) => reference.scenarios.find((scenario) => scenario.id === id)

describe('dataset payload', () => {
  it('matches the generated dataset shape', () => {
    expect(dataset.stores).toHaveLength(5)
    expect(dataset.products).toHaveLength(20)
    expect(dataset.categories).toHaveLength(5)
    expect(dataset.months).toHaveLength(25)
    expect(dataset.pairs).toHaveLength(100)

    const dailyRows = dataset.rows.reduce((total, row) => total + row.days, 0)
    expect(dailyRows).toBe(dataset.meta.rows)
    expect(dailyRows).toBe(76000)
  })
})

describe('KPIs match the pandas reference', () => {
  reference.scenarios.forEach((scenario) => {
    it(`scenario: ${scenario.id}`, () => {
      const summary = summarize(dataset, toFilters(scenario.filters))
      const expected = scenario.kpis

      expect(summary.kpis.unitsSold).toBe(expected.unitsSold)
      expect(summary.kpis.demand).toBe(expected.demand)
      expect(summary.kpis.unitsOrdered).toBe(expected.unitsOrdered)
      expect(summary.kpis.tradingDays).toBe(expected.tradingDays)
      expect(summary.kpis.dailyRows).toBe(expected.dailyRows)

      if (expected.avgInventory === null) {
        expect(summary.kpis.avgInventory).toBeNull()
      } else {
        expect(summary.kpis.avgInventory).toBeCloseTo(expected.avgInventory, 6)
      }

      if (expected.fulfillmentRate === null) {
        expect(summary.kpis.fulfillmentRate).toBeNull()
      } else {
        expect(summary.kpis.fulfillmentRate).toBeCloseTo(expected.fulfillmentRate, 6)
      }

      expect(summary.pairs).toHaveLength(scenario.totalPairs)

      STATUS_ORDER.forEach((status) => {
        const count = summary.pairs.filter((pair) => pair.status === status).length
        expect(count).toBe(scenario.statusCounts[status])
      })

      const topCategory = summary.categories[0] ?? null
      if (scenario.topCategory === null) {
        expect(topCategory).toBeNull()
      } else {
        expect(topCategory.label).toBe(scenario.topCategory.Category)
        expect(topCategory.unitsSold).toBe(scenario.topCategory['Units Sold'])
      }

      const topStore = summary.stores[0] ?? null
      if (scenario.topStore === null) {
        expect(topStore).toBeNull()
      } else {
        expect(topStore.label).toBe(scenario.topStore['Store ID'])
        expect(topStore.unitsSold).toBe(scenario.topStore['Units Sold'])
      }
    })
  })
})

describe('pair level inventory maths', () => {
  it('matches every reference pair for the S001 + Furniture scenario', () => {
    const scenario = byId('s001-furniture')
    const summary = summarize(dataset, toFilters(scenario.filters))
    const byProduct = new Map(summary.pairs.map((pair) => [pair.product, pair]))

    scenario.pairs.forEach((expected) => {
      const actual = byProduct.get(expected.product)
      expect(actual, `pair ${expected.product}/${expected.store}`).toBeDefined()
      expect(actual.store).toBe(expected.store)
      expect(actual.category).toBe(expected.category)
      expect(actual.avgInventory).toBeCloseTo(expected.avgInventory, 6)
      expect(actual.avgDailyDemand).toBeCloseTo(expected.avgDailyDemand, 6)
      expect(actual.daysOfInventory).toBeCloseTo(expected.daysOfInventory, 6)
      expect(actual.status).toBe(expected.status)
      expect(actual.suggestedReorderQty).toBeCloseTo(expected.suggestedReorderQty, 6)
    })
  })

  it('classifies the project thresholds exactly on the boundaries', () => {
    expect(classifyStatus(2.999, 10)).toBe(STATUS.CRITICAL)
    expect(classifyStatus(3, 10)).toBe(STATUS.LOW_STOCK)
    expect(classifyStatus(6.999, 10)).toBe(STATUS.LOW_STOCK)
    expect(classifyStatus(7, 10)).toBe(STATUS.HEALTHY)
    expect(classifyStatus(30, 10)).toBe(STATUS.HEALTHY)
    expect(classifyStatus(30.001, 10)).toBe(STATUS.OVERSTOCK)
    expect(classifyStatus(null, 0)).toBe(STATUS.NO_DEMAND)
    expect(classifyStatus(4, 0)).toBe(STATUS.NO_DEMAND)
  })

  it('computes fulfilment rate from totals, never as an average of row percentages', () => {
    const rows = selectRows(dataset, toFilters({}))
    const kpis = computeKpis(dataset, rows)
    expect(kpis.unitsSold / kpis.demand * 100).toBeCloseTo(kpis.fulfillmentRate, 10)
    const averageOfRatios =
      (rows.reduce((total, row) => total + row.unitsSold / row.demand, 0) / rows.length) * 100
    expect(Math.abs(averageOfRatios - kpis.fulfillmentRate)).toBeGreaterThan(0.001)
  })
})

describe('store risk ranking', () => {
  it('sorts by risk count then critical count then store id', () => {
    const summary = summarize(dataset, toFilters({}))
    expect(summary.storeRisk.map((row) => row.label)).toEqual(['S001', 'S005', 'S003', 'S004', 'S002'])
    expect(summary.storeRisk.map((row) => row.critical)).toEqual([12, 11, 10, 10, 7])
    expect(summary.storeRisk.every((row) => row.riskCount === row.critical + row.lowStock)).toBe(true)
    expect(summary.storeRisk.every((row) => row.totalPairs === 20)).toBe(true)
  })

  it('reports a median cover consistent with the pairs it summarises', () => {
    const summary = summarize(dataset, toFilters({}))
    expect(medianCoverDays(summary.pairs)).toBeCloseTo(summary.medianCover, 10)
    expect(summary.medianCover).toBeGreaterThan(1)
    expect(summary.medianCover).toBeLessThan(7)
  })
})

describe('empty selections', () => {
  it('returns no records for a store/category combination with no data', () => {
    const scenario = byId('empty-s004-toys-late-2023')
    const summary = summarize(dataset, toFilters(scenario.filters))
    expect(summary.pairs).toHaveLength(0)
    expect(summary.rows).toHaveLength(0)
    expect(summary.kpis.unitsSold).toBe(0)
    expect(summary.kpis.avgInventory).toBeNull()
    expect(summary.kpis.fulfillmentRate).toBeNull()
    expect(summary.statusDistribution.every((entry) => entry.count === 0)).toBe(true)
    expect(summary.categories).toHaveLength(0)
    expect(summary.stores).toHaveLength(0)
    expect(summary.demandSeries).toHaveLength(0)
  })
})

describe('demand series', () => {
  it('returns a real 25 point monthly trend and a 12 point seasonality view', () => {
    const summary = summarize(dataset, toFilters({}))
    expect(summary.demandSeries).toHaveLength(25)
    expect(summary.seasonalitySeries).toHaveLength(12)
    expect(summary.demandSeries[0].label).toBe('Jan')
    expect(summary.seasonalitySeries[0].label).toBe('Jan')

    const trendTotal = summary.demandSeries.reduce((total, point) => total + point.demand, 0)
    const seasonalityTotal = summary.seasonalitySeries.reduce((total, point) => total + point.demand, 0)
    expect(trendTotal).toBe(seasonalityTotal)
    expect(trendTotal).toBe(summary.kpis.demand)
  })

  it('narrows to the selected months only', () => {
    const summary = summarize(dataset, toFilters({ from: '2023-07', to: '2023-12' }))
    expect(summary.months).toHaveLength(6)
    expect(summary.demandSeries).toHaveLength(6)
  })
})
