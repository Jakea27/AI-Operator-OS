import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { approvalActivity } from '@/src/data/mockBusinessMetrics'
import { ChartTooltip } from './ChartTooltip'
import { chartTheme } from './chartTheme'

export function ApprovalActivityChart() {
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={approvalActivity} margin={{ top: 6, right: 2, left: -28, bottom: 0 }}>
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
