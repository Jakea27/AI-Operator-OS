import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { chartTheme, currencyTick } from './chartTheme'

type TrendPoint = Record<string, string | number>

type TrendLineChartProps = {
  data: TrendPoint[]
  dataKey: string
  label: string
  xKey: string
  color?: string
  gradientId: string
}

export function TrendLineChart({
  data,
  dataKey,
  label,
  xKey,
  color = chartTheme.lime,
  gradientId,
}: TrendLineChartProps) {
  const hasData = data.some((point) => Number(point[dataKey]) !== 0)
  if (!hasData) {
    return <div className="grid h-64 place-items-center text-center text-xs text-muted">No financial activity recorded for this period.</div>
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="90%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey={xKey}
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.text, fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            tickFormatter={currencyTick}
          />
          <Tooltip
            cursor={{ stroke: chartTheme.grid, strokeDasharray: '3 3' }}
            content={<ChartTooltip />}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 5, fill: color, stroke: chartTheme.ink, strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
