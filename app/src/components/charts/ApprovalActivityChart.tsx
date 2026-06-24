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
import { chartTheme } from './chartTheme'

type ApprovalPoint = { day: string; approved: number; rejected: number }

export function ApprovalActivityChart({ data }: { data: ApprovalPoint[] }) {
  const hasData = data.some((point) => point.approved > 0 || point.rejected > 0)
  if (!hasData) {
    return <div className="grid h-56 place-items-center text-center text-xs text-muted">No approval decisions recorded this week.</div>
  }

  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 2, left: -28, bottom: 0 }}>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.text, fontSize: 10 }}
            dy={8}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.text, fontSize: 10 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.025)' }}
            content={<ChartTooltip valueType="number" />}
          />
          <Bar dataKey="approved" name="Approved" stackId="activity" fill={chartTheme.mint} radius={[0, 0, 3, 3]} />
          <Bar dataKey="rejected" name="Rejected" stackId="activity" fill={chartTheme.coral} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
