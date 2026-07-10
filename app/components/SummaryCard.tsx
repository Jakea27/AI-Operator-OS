import { ReactNode } from 'react'

export function SummaryCard({
  label,
  value,
  helper = 'Local records',
  icon,
}: {
  label: string
  value: number | string
  helper?: string
  icon?: ReactNode
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">{label}</p>
          <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
          <p className="m-0 mt-1 text-xs text-muted">{helper}</p>
        </div>
        {icon ? <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-muted">{icon}</div> : null}
      </div>
    </div>
  )
}
