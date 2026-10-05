import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatInteger } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'

const BAR = '#5E9BF5'

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <ChartTooltip
      title={point.label}
      rows={[
        { label: 'Units sold', value: formatInteger(point.unitsSold), color: BAR },
        { label: 'Demand', value: formatInteger(point.demand), color: '#7FB3FF' },
        { label: 'Product–store pairs', value: formatInteger(point.pairCount), color: '#667085' },
      ]}
    />
  )
}

export function CategorySalesChart({ categories }) {
  const hasData = categories.length > 0

  return (
    <Card
      title="Sales by Category"
      subtitle="Units sold per category, highest first"
      className="card--chart"
    >
      {hasData ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={268}>
            <BarChart data={categories} margin={{ top: 10, right: 6, bottom: 0, left: -14 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.055)" strokeDasharray="3 6" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#667085', fontSize: 11 }}
                dy={6}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: '#667085', fontSize: 11 }}
                tickFormatter={formatCompact}
              />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="unitsSold" fill={BAR} radius={[6, 6, 2, 2]} maxBarSize={46} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState />
      )}
    </Card>
  )
}
