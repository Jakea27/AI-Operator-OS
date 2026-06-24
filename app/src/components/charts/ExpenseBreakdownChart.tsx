import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { currencyValue } from './chartTheme'

type ExpensePoint = { name: string; value: number; color: string }

export function ExpenseBreakdownChart({ data }: { data: ExpensePoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) {
    return <div className="grid h-64 place-items-center text-center text-xs text-muted">No expenses recorded this month.</div>
  }

  return (
    <div>
      <div className="relative h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="m-0 font-display text-xl font-semibold text-white">{currencyValue(total)}</p>
            <p className="m-0 text-[10px] text-muted">total costs</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-2 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="text-[#b7c0bb]">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
