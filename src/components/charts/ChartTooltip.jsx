export function ChartTooltip({ title, rows }) {
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__title">{title}</p>
      <ul className="chart-tooltip__list">
        {rows.map((row) => (
          <li key={row.label} className="chart-tooltip__row">
            <span className="chart-tooltip__dot" style={{ background: row.color }} aria-hidden="true" />
            <span className="chart-tooltip__label">{row.label}</span>
            <strong className="chart-tooltip__value">{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
