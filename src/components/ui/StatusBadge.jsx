import { STATUS_COLORS } from '../../lib/constants.js'
import { withAlpha } from '../../lib/color.js'

export function StatusBadge({ status, size = 'default' }) {
  const color = STATUS_COLORS[status] || '#8A93A0'
  return (
    <span
      className={`badge ${size === 'small' ? 'badge--small' : ''}`}
      style={{ '--badge-color': color, '--badge-tint': withAlpha(color, 0.14), '--badge-border': withAlpha(color, 0.24) }}
    >
      {status}
    </span>
  )
}
