import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { chartTheme, currencyTick } from './chartTheme'

type BusinessPoint = { business: string; revenue: number }

export function RevenueByBusinessChart({ data }: { data: BusinessPoint[] }) {
  if (data.length === 0) {
    return <div className="grid h-64 place-items-center text-center text-xs text-muted">No revenue recorded this month.</div>
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 10, left: 14, bottom: 0 }}
        >
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 5" horizontal={false} />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            tickFormatter={currencyTick}
          />
          <YAxis
            type="category"
            dataKey="business"
            width={92}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#aeb8b3', fontSize: 10 }}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.025)' }} content={<ChartTooltip />} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill={chartTheme.lime}
            radius={[0, 7, 7, 0]}
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
