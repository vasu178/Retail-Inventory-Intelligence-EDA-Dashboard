import { POLICY, STATUS_ORDER, STATUS_RULES, THRESHOLDS } from '../lib/constants.js'

export function MethodNotes({ meta }) {
  const { assumptions } = meta

  return (
    <details className="method">
      <summary className="method__summary">Method &amp; assumptions</summary>
      <div className="method__body">
        <div className="method__column">
          <h3 className="method__title">Inventory status bands</h3>
          <ul className="method__list">
            {STATUS_ORDER.map((status) => (
              <li key={status}>
                <strong>{status}</strong> — {STATUS_RULES[status]}
              </li>
            ))}
          </ul>
          <p className="method__note">
            These bands are project-defined thresholds for this portfolio dataset, not universal
            industry standards. Days of inventory = average inventory ÷ average daily demand.
          </p>
        </div>

        <div className="method__column">
          <h3 className="method__title">Replenishment illustration</h3>
          <ul className="method__list">
            <li>
              Lead time <strong>{assumptions.leadTimeDays} days</strong>, safety stock{' '}
              <strong>{assumptions.safetyStockDays} days of demand</strong>
            </li>
            <li>
              Reorder point = average daily demand × {assumptions.leadTimeDays} +{' '}
              {assumptions.safetyStockDays} days of safety stock
            </li>
            <li>Suggested reorder qty = max(reorder point − average inventory, 0)</li>
          </ul>
          <p className="method__note">
            Ordering output is an illustrative portfolio calculation, not a real purchasing
            recommendation. Average inventory is the day-weighted mean of daily inventory levels.
          </p>
        </div>

        <div className="method__column">
          <h3 className="method__title">Definitions</h3>
          <ul className="method__list">
            <li>Fulfilment rate = total units sold ÷ total demand</li>
            <li>
              Status bands: below {THRESHOLDS.criticalBelow} / below {THRESHOLDS.lowBelow} / up to{' '}
              {THRESHOLDS.healthyMax} / above {THRESHOLDS.healthyMax} days
            </li>
            <li>
              Replenishment policy: {POLICY.leadTimeDays} day lead time + {POLICY.safetyStockDays}{' '}
              days safety stock
            </li>
          </ul>
          <p className="method__note">
            Average daily demand is total demand ÷ trading days in the selected window, so status
            bands follow the period filter.
          </p>
        </div>
      </div>
    </details>
  )
}
