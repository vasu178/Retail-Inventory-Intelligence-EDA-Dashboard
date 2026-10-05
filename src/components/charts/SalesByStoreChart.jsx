import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatDecimal, formatInteger, formatPercent } from '../../lib/format.js'
import { Card } from '../ui/Card.jsx'
import { EmptyState } from '../ui/EmptyState.jsx'
import { ChartTooltip } from './ChartTooltip.jsx'

const BAR = '#5E9BF5'

function StoreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <ChartTooltip
      title={`Store ${point.label}`}
      rows={[
        { label: 'Units sold', value: formatInteger(point.unitsSold), color: BAR },
        { label: 'Demand', value: formatInteger(point.demand), color: '#7FB3FF' },
        { label: 'Average inventory', value: formatDecimal(point.avgInventory, 1), color: '#6FBF8B' },
        { label: 'Fulfillment', value: formatPercent(point.fulfillmentRate), color: '#667085' },
      ]}
    />
  )
}

export function SalesByStoreChart({ stores }) {
  const hasData = stores.length > 0

  return (
    <Card title="Sales by Store" subtitle="Units sold per store, highest first" className="card--chart">
      {hasData ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={252}>
            <BarChart data={stores} margin={{ top: 10, right: 6, bottom: 0, left: -14 }}>
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
              <Tooltip content={<StoreTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="unitsSold" fill={BAR} radius={[6, 6, 2, 2]} maxBarSize={38} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState />
      )}
    </Card>
  )
}
