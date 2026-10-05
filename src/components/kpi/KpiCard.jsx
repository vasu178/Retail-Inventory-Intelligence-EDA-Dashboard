export function KpiCard({ label, value, description, indicator, secondary }) {
  return (
    <article className="kpi">
      <div className="kpi__top">
        <span className="kpi__label">{label}</span>
      </div>
      <div className="kpi__reading">
        <p className="kpi__value">{value}</p>
        {indicator && <span className="kpi__indicator">{indicator}</span>}
      </div>
      {secondary && <div className="kpi__secondary">{secondary}</div>}
      {description && <p className="kpi__description">{description}</p>}
    </article>
  )
}
