import { ALL, STATUS_COLORS } from '../../lib/constants.js'
import { formatInteger, formatPercent } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'

export function StatusDistribution({ distribution, activeStatus, onSelectStatus, totalPairs }) {
  const hasData = totalPairs > 0

  return (
    <Card
      title="Inventory Status Distribution"
      subtitle="Product–store pairs by days of cover"
      actions={
        activeStatus !== ALL ? (
          <button type="button" className="ghost-button ghost-button--small" onClick={() => onSelectStatus(ALL)}>
            Clear status
          </button>
        ) : null
      }
    >
      {hasData ? (
        <ul className="status-list">
          {distribution.map((entry) => {
            const color = STATUS_COLORS[entry.status]
            const selected = activeStatus === entry.status
            const dimmed = activeStatus !== ALL && !selected
            return (
              <li key={entry.status} className={`status-row ${dimmed ? 'is-dimmed' : ''}`}>
                <button
                  type="button"
                  className={`status-row__button ${selected ? 'is-selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelectStatus(selected ? ALL : entry.status)}
                  title={`${entry.status}: ${formatInteger(entry.count)} of ${formatInteger(totalPairs)} pairs`}
                >
                  <span className="status-row__head">
                    <span className="status-dot" style={{ background: color }} aria-hidden="true" />
                    <span className="status-row__label">{entry.status}</span>
                    <span className="status-row__count">{formatInteger(entry.count)}</span>
                    <span className="status-row__share">{formatPercent(entry.share)}</span>
                  </span>
                  <span className="status-row__track">
                    <span
                      className="status-row__fill"
                      style={{ width: `${entry.share}%`, background: color }}
                    />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState />
      )}
    </Card>
  )
}
