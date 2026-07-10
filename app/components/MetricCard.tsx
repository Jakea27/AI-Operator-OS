import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react'

type MetricCardProps = {
  label: string
  value: string
  change: string
  positive?: boolean
  icon: LucideIcon
  accent?: boolean
}

export function MetricCard({
  label,
  value,
  change,
  positive = true,
  icon: Icon,
  accent = false,
}: MetricCardProps) {
  const Trend = positive ? TrendingUp : TrendingDown

  return (
    <section className={`panel p-5 ${accent ? 'bg-gradient-to-br from-lime/[0.12] to-panel' : ''}`}>
      <div className="flex items-start justify-between">
        <p className="eyebrow m-0">{label}</p>
        <div className={`rounded-lg p-2 ${accent ? 'bg-lime text-ink' : 'bg-white/[0.04] text-muted'}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className="mb-3 mt-5 font-display text-[28px] font-semibold tracking-tight text-white">{value}</p>
      <div className={`flex items-center gap-1 text-[11px] ${positive ? 'text-mint' : 'text-[#ff9e8f]'}`}>
        <Trend size={13} />
        <span>{change}</span>
      </div>
    </section>
  )
}
