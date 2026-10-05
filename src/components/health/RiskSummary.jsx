import { ALL, STATUS_COLORS, STATUS_RULES } from '../../lib/constants.js'
import { formatDecimal, formatInteger, formatPercent } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'

export function RiskSummary({
  distribution,
  pairs,
  activeStatus,
  onSelectStatus,
  medianCover,
  reorderCount,
}) {
  const hasData = pairs.length > 0

  return (
    <Card
      title="Inventory Risk Summary"
      subtitle="How the current selection breaks down by days of cover"
      actions={
        activeStatus !== ALL ? (
          <button
            type="button"
            className="ghost-button ghost-button--small"
            onClick={() => onSelectStatus(ALL)}
          >
            Showing {activeStatus} · clear
          </button>
        ) : null
      }
    >
      {hasData ? (
        <>
          <ul className="summary-list">
            {distribution.map((entry) => {
              const selected = activeStatus === entry.status
              const dimmed = activeStatus !== ALL && !selected
              return (
                <li key={entry.status}>
                  <button
                    type="button"
                    className={`summary-row ${selected ? 'is-selected' : ''} ${dimmed ? 'is-dimmed' : ''}`}
                    aria-pressed={selected}
                    onClick={() => onSelectStatus(selected ? ALL : entry.status)}
                    title={`${entry.status}: ${formatInteger(entry.count)} pairs (${STATUS_RULES[entry.status]})`}
                  >
                    <span
                      className="status-dot"
                      style={{ background: STATUS_COLORS[entry.status] }}
                      aria-hidden="true"
                    />
                    <span className="summary-row__label">
                      {entry.status}
                      <span className="summary-row__rule">{STATUS_RULES[entry.status]}</span>
                    </span>
                    <span className="summary-row__value">{formatInteger(entry.count)}</span>
                    <span className="summary-row__share">{formatPercent(entry.share)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <dl className="facts">
            <div className="facts__item">
              <dt>Median days of cover</dt>
              <dd>{medianCover === null ? '—' : `${formatDecimal(medianCover, 2)} d`}</dd>
            </div>
            <div className="facts__item">
              <dt>Pairs with a suggested reorder</dt>
              <dd>
                {formatInteger(reorderCount)} of {formatInteger(pairs.length)}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <EmptyState />
      )}
    </Card>
  )
}
