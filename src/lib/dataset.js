import payload from '../../data/dashboard-data.json'

/**
 * Rehydrates the generated payload (data/dashboard-data.json) into a shape the
 * dashboard can query. The file stores facts at month x product-store grain with
 * column-arrays to keep the bundle small; here we trade that back for plain rows.
 */
export function buildDataset(raw) {
  const { meta, dimensions, pairs, facts } = raw

  const rows = facts.month.map((monthIndex, index) => ({
    month: monthIndex,
    pair: facts.pair[index],
    days: facts.days[index],
    inventorySum: facts.inventorySum[index],
    unitsSold: facts.unitsSold[index],
    unitsOrdered: facts.unitsOrdered[index],
    demand: facts.demand[index],
  }))

  return {
    meta,
    months: dimensions.months.map((month) => ({
      ...month,
      monthNumber: Number(month.key.slice(5, 7)),
    })),
    stores: dimensions.stores,
    products: dimensions.products,
    categories: dimensions.categories,
    pairs: pairs.map(([store, product, category]) => ({ store, product, category })),
    rows,
  }
}

export const dataset = buildDataset(payload)
