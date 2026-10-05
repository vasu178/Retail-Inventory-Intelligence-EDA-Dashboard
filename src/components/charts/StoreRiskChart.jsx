import { STATUS, STATUS_COLORS } from '../../lib/constants.js'
import { formatDecimal, formatInteger } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'

export function StoreRiskChart({ storeRisk }) {
  const hasData = storeRisk.length > 0

  if (!hasData) {
    return (
      <Card title="Inventory Risk by Store" subtitle="Critical and low stock pairs per store">
        <EmptyState />
      </Card>
    )
  }

  const widest = Math.max(...storeRisk.map((row) => row.totalPairs), 1)
  const riskiest = [...storeRisk].sort(
    (a, b) => b.riskCount - a.riskCount || b.critical - a.critical,
  )[0]
  const totalPairs = storeRisk.reduce((total, row) => total + row.totalPairs, 0)
  const totalRisk = storeRisk.reduce((total, row) => total + row.riskCount, 0)

  return (
    <Card
      title="Inventory Risk by Store"
      subtitle="Critical and low stock pairs per store"
      actions={
        <span className="legend">
          <span className="legend__item">
            <span className="status-dot" style={{ background: STATUS_COLORS[STATUS.CRITICAL] }} />
            Critical
          </span>
          <span className="legend__item">
            <span className="status-dot" style={{ background: STATUS_COLORS[STATUS.LOW_STOCK] }} />
            Low stock
          </span>
        </span>
      }
    >
      <div className="risk-list">
        <div className="risk-list__head" aria-hidden="true">
          <span>Store</span>
          <span>Risk mix</span>
          <span className="risk-list__num">Crit.</span>
          <span className="risk-list__num">Low</span>
          <span className="risk-list__num">Avg cover</span>
        </div>
        {storeRisk.map((row) => (
          <div
            key={row.label}
            className={`risk-row ${row.label === riskiest.label ? 'is-riskiest' : ''}`}
          >
            <span className="risk-row__store">{row.label}</span>
            <span
              className="risk-row__track"
              title={`${formatInteger(row.riskCount)} of ${formatInteger(row.totalPairs)} pairs at risk`}
            >
              <span
                className="risk-row__segment"
                style={{ width: `${(row.critical / widest) * 100}%`, background: STATUS_COLORS[STATUS.CRITICAL] }}
              />
              <span
                className="risk-row__segment"
                style={{ width: `${(row.lowStock / widest) * 100}%`, background: STATUS_COLORS[STATUS.LOW_STOCK] }}
              />
            </span>
            <span className="risk-row__num" data-label="Critical">
              {formatInteger(row.critical)}
            </span>
            <span className="risk-row__num" data-label="Low stock">
              {formatInteger(row.lowStock)}
            </span>
            <span className="risk-row__num" data-label="Avg cover">
              {formatDecimal(row.avgDaysOfInventory, 2)} d
            </span>
          </div>
        ))}
      </div>
      <p className="card__note">
        Risk count is Critical + Low Stock. {formatInteger(totalRisk)} of {formatInteger(totalPairs)}{' '}
        product–store pairs are below 7 days of cover in the current selection.
      </p>
    </Card>
  )
}
