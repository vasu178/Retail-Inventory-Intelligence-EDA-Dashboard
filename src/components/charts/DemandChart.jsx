import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatInteger } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { SegmentedControl } from '../ui/SegmentedControl.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'

const ACCENT = '#7FB3FF'

function DemandTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <ChartTooltip
      title={point.fullLabel}
      rows={[
        { label: 'Demand', value: formatInteger(point.demand), color: ACCENT },
        { label: 'Units sold', value: formatInteger(point.unitsSold), color: '#6FBF8B' },
        { label: 'Trading days', value: formatInteger(point.days), color: '#667085' },
      ]}
    />
  )
}

export function DemandChart({ series, grain, onGrainChange }) {
  const hasData = series.length > 0

  return (
    <Card
      title="Monthly Demand"
      subtitle={grain === 'month' ? 'Total demand over time' : 'Total demand by calendar month'}
      className="card--chart"
      actions={
        <SegmentedControl
          ariaLabel="Demand chart grouping"
          value={grain}
          onChange={onGrainChange}
          options={[
            { value: 'month', label: 'By month' },
            { value: 'calendarMonth', label: 'By calendar month' },
          ]}
        />
      }
    >
      {hasData ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={268}>
            <LineChart data={series} margin={{ top: 10, right: 6, bottom: 0, left: -14 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.055)" strokeDasharray="3 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#667085', fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={26}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: '#667085', fontSize: 11 }}
                tickFormatter={formatCompact}
              />
              <Tooltip
                content={<DemandTooltip />}
                cursor={{ stroke: 'rgba(255,255,255,0.16)', strokeDasharray: '3 4' }}
              />
              <Line
                type="monotone"
                dataKey="demand"
                stroke={ACCENT}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: ACCENT, stroke: '#0B0D10', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState />
      )}
    </Card>
  )
}
