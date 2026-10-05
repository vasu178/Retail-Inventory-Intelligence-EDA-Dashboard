/** Tiny inline trend line: real monthly values, no axes, no dependencies. */
export function Sparkline({ values, width = 88, height = 30, color = '#7FB3FF' }) {
  const usable = (values || []).filter((value) => value !== null && Number.isFinite(value))
  if (usable.length < 2) return null

  const max = Math.max(...usable)
  const min = Math.min(...usable)
  const span = max - min || 1
  const stepX = width / (usable.length - 1)
  const points = usable.map((value, index) => [
    index * stepX,
    height - 5 - ((value - min) / span) * (height - 11),
  ])

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const last = points[points.length - 1]

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />
    </svg>
  )
}
