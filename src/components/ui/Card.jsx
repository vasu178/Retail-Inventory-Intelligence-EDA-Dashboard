/** Rounded dark surface used by every dashboard block. */
export function Card({ title, subtitle, actions, children, className = '', bodyClassName = '', ...rest }) {
  return (
    <section className={`card ${className}`} {...rest}>
      {(title || actions) && (
        <header className="card__header">
          <div className="card__heading">
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </header>
      )}
      <div className={`card__body ${bodyClassName}`}>{children}</div>
    </section>
  )
}
