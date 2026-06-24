import { currencyValue } from './chartTheme'

type TooltipEntry = {
  color?: string
  dataKey?: string
  name?: string
  value?: number | string
}

type ChartTooltipProps = {
  active?: boolean
  label?: string
  payload?: TooltipEntry[]
  valueType?: 'currency' | 'number'
}

export function ChartTooltip({
  active,
  label,
  payload,
  valueType = 'currency',
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-36 rounded-xl border border-line bg-[#0d1311]/95 p-3 shadow-2xl backdrop-blur">
      <p className="mb-2 mt-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 text-[#aeb8b3]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium text-white">
              {valueType === 'currency' && typeof entry.value === 'number'
                ? currencyValue(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
