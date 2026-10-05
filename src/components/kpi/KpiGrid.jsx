import { formatDecimal, formatInteger, formatPercent } from '../../lib/format.js'
import { KpiCard } from './KpiCard.jsx'
import { Sparkline } from './Sparkline.jsx'

export function KpiGrid({ kpis, series, pairCount }) {
  const hasData = series.length > 0
  const months = series.length

  const soldSeries = series.map((point) => point.unitsSold)
  const demandSeries = series.map((point) => point.demand)
  const orderSeries = series.map((point) => point.unitsOrdered)
  const inventorySeries = series.map((point) => point.avgInventory)

  const fulfillment = kpis.fulfillmentRate

  return (
    <div className="kpi-grid">
      <KpiCard
        label="Total units sold"
        value={formatInteger(kpis.unitsSold)}
        indicator={hasData ? <Sparkline values={soldSeries} /> : null}
        description={
          hasData
            ? `Across ${months} month${months === 1 ? '' : 's'} and ${pairCount} product–store pairs`
            : 'No records in the current selection'
        }
      />

      <KpiCard
        label="Total demand"
        value={formatInteger(kpis.demand)}
        indicator={hasData ? <Sparkline values={demandSeries} /> : null}
        description={
          hasData
            ? `${formatInteger(kpis.tradingDays)} trading days in the selected period`
            : 'No records in the current selection'
        }
      />

      <KpiCard
        label="Units ordered"
        value={formatInteger(kpis.unitsOrdered)}
        indicator={hasData ? <Sparkline values={orderSeries} color="#9B8FD6" /> : null}
        description={
          hasData && kpis.unitsSold > 0
            ? `${formatPercent((kpis.unitsOrdered / kpis.unitsSold) * 100)} of units sold`
            : 'No records in the current selection'
        }
      />

      <KpiCard
        label="Average inventory"
        value={formatDecimal(kpis.avgInventory, 1)}
        indicator={hasData ? <Sparkline values={inventorySeries} color="#6FBF8B" /> : null}
        description={
          hasData
            ? `Day-weighted average across ${formatInteger(kpis.tradingDays)} trading days`
            : 'No records in the current selection'
        }
      />

      <KpiCard
        label="Fulfillment rate"
        value={kpis.demand > 0 ? formatPercent(fulfillment) : '--'}
        description={
          hasData && kpis.demand > 0
            ? 'Units sold divided by demand across the selection'
            : 'No records in the current selection'
        }
        secondary={
          kpis.demand > 0 ? (
            <span className="meter" role="img" aria-label={`${formatPercent(fulfillment)} of demand fulfilled`}>
              <span className="meter__fill" style={{ width: `${Math.min(fulfillment, 100)}%` }} />
            </span>
          ) : null
        }
      />
    </div>
  )
}
