import { AlertTriangle, CheckCircle2, MinusCircle, ReceiptText } from 'lucide-react'
import { formatCurrency } from '@/src/services/operatingStore'
import type {
  MoneyActivityItem,
  MoneyCategoryBreakdownItem,
  MoneyHealthSummary,
  MoneyMetrics,
} from '@/src/core/money'

export function CostOverview({ metrics }: { metrics: MoneyMetrics }) {
  return (
    <section className="panel p-6">
      <p className="eyebrow mb-2">Cost Overview</p>
      <h3 className="m-0 text-xl font-semibold">Current month costs</h3>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <CostStat label="Recurring Monthly Costs" value={formatCurrency(metrics.monthlyRecurringCosts)} tone="amber" />
        <CostStat label="One-Time Costs" value={formatCurrency(metrics.oneTimeCosts)} tone="rose" />
        <CostStat label="Total Monthly Costs" value={formatCurrency(metrics.currentMonthCosts)} tone="neutral" />
      </div>
    </section>
  )
}

export function CostBreakdown({ breakdown }: { breakdown: MoneyCategoryBreakdownItem[] }) {
  return (
    <section className="panel p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2">Cost Breakdown</p>
          <h3 className="m-0 text-xl font-semibold">Expenses by category</h3>
        </div>
        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-muted">{breakdown.length} categories</span>
      </div>
      {breakdown.length === 0 ? (
        <p className="m-0 rounded-2xl border border-dashed border-line bg-ink/30 p-5 text-sm text-muted">
          No expenses recorded this month. Add a cost entry to see category totals here.
        </p>
      ) : (
        <div className="space-y-3">
          {breakdown.map((item) => (
            <div key={item.category} className="flex items-center justify-between rounded-2xl border border-line bg-ink/35 p-4">
              <div>
                <p className="m-0 text-sm font-semibold text-white">{item.category}</p>
                <p className="mb-0 mt-1 text-xs text-muted">{item.count} {item.count === 1 ? 'entry' : 'entries'}</p>
              </div>
              <p className="m-0 text-sm font-semibold text-[#ffb09f]">{formatCurrency(item.total)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function RecentFinancialActivity({ activity }: { activity: MoneyActivityItem[] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-line px-6 py-5">
        <p className="eyebrow mb-2">Recent Activity</p>
        <h3 className="m-0 text-xl font-semibold">Latest revenue and cost records</h3>
      </div>
      {activity.length === 0 ? (
        <p className="m-0 px-6 py-8 text-sm text-muted">No financial activity yet. Add revenue or a cost to start the local ledger.</p>
      ) : (
        <div className="divide-y divide-line">
          {activity.map((item) => (
            <div key={`${item.recordType}-${item.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.recordType === 'revenue' ? 'bg-mint/10 text-mint' : 'bg-[#ff9e8f]/10 text-[#ff9e8f]'}`}>
                <ReceiptText size={17} />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-white">{item.category}</p>
                <p className="mb-0 mt-1 truncate text-xs text-muted">{item.description}</p>
                <p className="mb-0 mt-1 text-[11px] text-muted">{new Date(`${item.date}T12:00:00`).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${item.recordType === 'revenue' ? 'bg-mint/10 text-mint' : 'bg-[#ff9e8f]/10 text-[#ff9e8f]'}`}>
                  {item.recordType === 'revenue' ? 'Revenue' : 'Cost'}
                </span>
                <p className={`mb-0 mt-2 text-sm font-semibold ${item.recordType === 'revenue' ? 'text-mint' : 'text-[#ffb09f]'}`}>
                  {item.recordType === 'revenue' ? '+' : '-'}{formatCurrency(item.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function FinancialHealthCard({ health }: { health: MoneyHealthSummary }) {
  const tone = health.status === 'Healthy'
    ? 'text-mint bg-mint/10 border-mint/20'
    : health.status === 'Stable'
      ? 'text-[#ffcc66] bg-[#ffcc66]/10 border-[#ffcc66]/20'
      : 'text-[#ff9e8f] bg-[#ff9e8f]/10 border-[#ff9e8f]/20'
  const Icon = health.status === 'Healthy' ? CheckCircle2 : health.status === 'Stable' ? MinusCircle : AlertTriangle

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Financial Health</p>
          <h3 className="m-0 text-xl font-semibold">Monthly operating signal</h3>
        </div>
        <span className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
          <Icon size={14} /> {health.status}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <CostStat label="Net Profit" value={formatCurrency(health.netProfit)} tone={health.netProfit > 0 ? 'mint' : 'rose'} />
        <CostStat label="Recurring Cost Total" value={formatCurrency(health.recurringCostTotal)} tone="amber" />
        <CostStat label="Profit Margin" value={`${health.profitMargin.toFixed(1)}%`} tone={health.profitMargin >= 30 ? 'mint' : health.profitMargin > 0 ? 'amber' : 'rose'} />
      </div>
      <p className="mb-0 mt-4 text-xs leading-5 text-muted">
        Healthy means positive profit with at least 30% margin. Stable means profitable below 30%. Warning means profit is zero or negative.
      </p>
    </section>
  )
}

function CostStat({ label, value, tone }: { label: string; value: string; tone: 'mint' | 'amber' | 'rose' | 'neutral' }) {
  const toneClass = {
    mint: 'text-mint',
    amber: 'text-[#ffcc66]',
    rose: 'text-[#ffb09f]',
    neutral: 'text-white',
  }[tone]

  return (
    <div className="rounded-2xl border border-line bg-ink/35 p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className={`m-0 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}
