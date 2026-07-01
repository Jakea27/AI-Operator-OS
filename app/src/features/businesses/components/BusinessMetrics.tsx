import { BusinessMetrics as BusinessMetricsModel } from '@/src/core/businesses'

const metricItems: Array<{ label: string; key: keyof BusinessMetricsModel }> = [
  { label: 'Monthly Revenue', key: 'monthlyRevenue' },
  { label: 'Monthly Profit', key: 'monthlyProfit' },
  { label: 'CEO Time Required', key: 'ceoTimeRequired' },
  { label: 'Automation Level', key: 'automationLevel' },
]

export function BusinessMetrics({ metrics }: { metrics: BusinessMetricsModel }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metricItems.map((item) => (
        <div key={item.key} className="rounded-xl border border-line bg-ink/35 p-4">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p>
          <p className="m-0 mt-2 font-display text-xl font-semibold text-white">{metrics[item.key]}</p>
        </div>
      ))}
    </div>
  )
}

