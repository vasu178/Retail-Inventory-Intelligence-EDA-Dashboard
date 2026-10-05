export function SectionHeading({ id, title, subtitle, as: Heading = 'h2' }) {
  return (
    <div className="section-head" id={id}>
      <Heading className="section-head__title">{title}</Heading>
      {subtitle && <p className="section-head__subtitle">{subtitle}</p>}
    </div>
  )
}
