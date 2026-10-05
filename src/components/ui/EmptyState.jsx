export function EmptyState({
  title = 'No inventory records found.',
  hint = 'Try changing your filters.',
  compact = false,
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`} role="status">
      <span className="empty-state__mark" aria-hidden="true" />
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__hint">{hint}</p>
    </div>
  )
}
