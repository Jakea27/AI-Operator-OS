import { useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2, MinusCircle, ReceiptText } from 'lucide-react'
import { expenseCategories } from '@/src/data/financeCategories'
import { formatCurrency } from '@/src/services/operatingStore'
import type {
  MoneyActivityItem,
  MoneyBudgetProgress,
  MoneyBudgetSummary,
  MoneyCategoryBreakdownItem,
  MoneyHealthSummary,
  MoneyMetrics,
  RecurringCostItem,
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
    ? 'text-mint bg-mint/10 border-mint/25'
    : health.status === 'Stable'
      ? 'text-[#ffcc66] bg-[#ffcc66]/10 border-[#ffcc66]/25'
      : 'text-[#ff9e8f] bg-[#ff9e8f]/10 border-[#ff9e8f]/25'
  const panelTone = health.status === 'Healthy'
    ? 'border-mint/25 bg-gradient-to-r from-mint/[0.08] to-panel'
    : health.status === 'Stable'
      ? 'border-[#ffcc66]/25 bg-gradient-to-r from-[#ffcc66]/[0.08] to-panel'
      : 'border-[#ff9e8f]/25 bg-gradient-to-r from-[#ff9e8f]/[0.08] to-panel'
  const Icon = health.status === 'Healthy' ? CheckCircle2 : health.status === 'Stable' ? MinusCircle : AlertTriangle
  const recommendation =
    health.status === 'Healthy'
      ? 'Financial health is strong. Keep recurring costs controlled while reinvesting carefully into the highest-return work.'
      : health.status === 'Stable'
        ? 'The business is profitable, but margin is under 30%. Review recurring costs before increasing spend.'
        : 'Profit is zero or negative. Reduce recurring commitments or increase revenue before adding new costs.'

  return (
    <section className={`panel p-6 ${panelTone}`}>
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="eyebrow mb-2">Financial Health</p>
          <h3 className="m-0 font-display text-2xl font-semibold">Current status: {health.status}</h3>
          <p className="mb-0 mt-2 max-w-2xl text-xs leading-5 text-muted">
            This status is calculated from net profit and profit margin using the shared local Money store.
          </p>
        </div>
        <span className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${tone}`}>
          <Icon size={18} /> {health.status}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        <CostStat label="Net Profit" value={formatCurrency(health.netProfit)} tone={health.netProfit > 0 ? 'mint' : 'rose'} />
        <CostStat label="Profit Margin" value={`${health.profitMargin.toFixed(1)}%`} tone={health.profitMargin >= 30 ? 'mint' : health.profitMargin > 0 ? 'amber' : 'rose'} />
        <CostStat label="Recurring Monthly Cost" value={formatCurrency(health.recurringCostTotal)} tone="amber" />
      </div>
      <p className="mb-0 mt-4 text-xs leading-5 text-muted">
        Healthy means positive profit with at least 30% margin. Stable means profitable below 30%. Warning means profit is zero or negative.
      </p>
      <div className={`mt-4 rounded-2xl border p-4 text-sm leading-6 ${tone}`}>
        <span className="font-semibold">Recommendation: </span>{recommendation}
      </div>
    </section>
  )
}

export function MonthlyFinancialSummary({ summary }: { summary: MoneyBudgetSummary }) {
  return (
    <section className="panel p-6">
      <p className="eyebrow mb-2">Monthly Summary</p>
      <h3 className="m-0 text-xl font-semibold">Budget control</h3>
      <div className="mt-5 grid grid-cols-4 gap-3">
        <CostStat label="Total Monthly Budget" value={formatCurrency(summary.totalBudget)} tone="neutral" />
        <CostStat label="Total Spent This Month" value={formatCurrency(summary.totalSpent)} tone="rose" />
        <CostStat label="Remaining Budget" value={formatCurrency(summary.remainingBudget)} tone={summary.remainingBudget > 0 ? 'mint' : 'rose'} />
        <CostStat label="Recurring Monthly Cost Total" value={formatCurrency(summary.recurringMonthlyCostTotal)} tone="amber" />
      </div>
    </section>
  )
}

export function BudgetManager({
  budgets,
  onSaveBudget,
  onDeleteBudget,
}: {
  budgets: MoneyBudgetProgress[]
  onSaveBudget: (category: string, amount: number) => void
  onDeleteBudget: (category: string) => void
}) {
  const [category, setCategory] = useState<string>(expenseCategories[0])
  const [amount, setAmount] = useState('')
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return
    onSaveBudget(category, parsedAmount)
    setAmount('')
  }

  const saveExistingBudget = (budget: MoneyBudgetProgress) => {
    const draft = draftAmounts[budget.category] ?? String(budget.amount)
    const parsedAmount = Number(draft)
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return
    onSaveBudget(budget.category, parsedAmount)
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-line px-6 py-5">
        <p className="eyebrow mb-2">Budget Management</p>
        <h3 className="m-0 text-xl font-semibold">Monthly category budgets</h3>
        <p className="mb-0 mt-2 text-xs text-muted">Edit budget amounts directly here. Changes save locally through the shared Money store.</p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-[1fr_160px_auto] gap-3 border-b border-line px-6 py-4">
        <label className="text-xs text-muted">
          Category
          <select className="field mt-2" value={category} onChange={(event) => setCategory(event.target.value)}>
            {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">
          Budget
          <input className="field mt-2" min="0" step="1" type="number" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">Save Budget</button>
        </div>
      </form>
      {budgets.length === 0 ? (
        <p className="m-0 px-6 py-8 text-sm text-muted">No category budgets yet. Set a monthly budget for Software, Marketing, AI Services, Office, or any expense category you track.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
          {budgets.map((budget) => (
            <div key={budget.id} className="rounded-2xl border border-line bg-ink/35 p-4">
              <div className="mb-3 grid grid-cols-1 items-start gap-3 2xl:grid-cols-[1fr_180px]">
                <div>
                  <p className="m-0 text-sm font-semibold text-white">{budget.category}</p>
                  <p className="mb-0 mt-1 text-xs text-muted">
                    {formatCurrency(budget.spent)} spent of {formatCurrency(budget.amount)} · {formatCurrency(budget.remaining)} remaining
                  </p>
                </div>
                <label className="text-xs text-muted">
                  Budget amount
                  <input
                    className="field mt-2"
                    min="0"
                    step="1"
                    type="number"
                    value={draftAmounts[budget.category] ?? String(budget.amount)}
                    onBlur={() => saveExistingBudget(budget)}
                    onChange={(event) => setDraftAmounts({ ...draftAmounts, [budget.category]: event.target.value })}
                  />
                </label>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <BudgetStatusBadge status={budget.status} />
                <button type="button" onClick={() => saveExistingBudget(budget)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-white">Save</button>
                <button type="button" onClick={() => onDeleteBudget(budget.category)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:border-[#ff9e8f]/50 hover:text-[#ff9e8f]">Remove</button>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={`h-full rounded-full ${budget.status === 'Over Budget' ? 'bg-[#ff9e8f]' : budget.status === 'Watch' ? 'bg-[#ffcc66]' : 'bg-mint'}`} style={{ width: `${Math.min(100, budget.percentageUsed)}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 2xl:grid-cols-4">
                <MiniStat label="Budget amount" value={formatCurrency(budget.amount)} />
                <MiniStat label="Amount spent" value={formatCurrency(budget.spent)} />
                <MiniStat label="Remaining" value={formatCurrency(budget.remaining)} />
                <MiniStat label="Percent used" value={`${budget.percentageUsed.toFixed(1)}%`} />
              </div>
              <p className="mb-0 mt-2 text-[11px] text-muted">Percent used: {budget.percentageUsed.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function RecurringCostManager({
  recurringCosts,
  monthlyTotal,
}: {
  recurringCosts: RecurringCostItem[]
  monthlyTotal: number
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <p className="eyebrow mb-2">Recurring Costs</p>
          <h3 className="m-0 text-xl font-semibold">Monthly operating commitments</h3>
        </div>
        <span className="rounded-full bg-[#ffcc66]/10 px-3 py-1.5 text-xs font-semibold text-[#ffcc66]">{formatCurrency(monthlyTotal)} / month</span>
      </div>
      {recurringCosts.length === 0 ? (
        <p className="m-0 px-6 py-8 text-sm text-muted">No recurring costs recorded yet.</p>
      ) : (
        <div className="divide-y divide-line">
          {recurringCosts.map((cost) => (
            <div key={cost.id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-4">
              <div>
                <p className="m-0 text-sm font-semibold text-white">{cost.name}</p>
                <p className="mb-0 mt-1 text-xs text-muted">{cost.category} · Next billing {cost.nextBillingDate ? new Date(`${cost.nextBillingDate}T12:00:00`).toLocaleDateString() : 'not available'}</p>
              </div>
              <div className="text-right">
                <p className="eyebrow mb-1">Monthly amount</p>
                <p className="m-0 text-sm font-semibold text-[#ffcc66]">{formatCurrency(cost.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function BudgetStatusBadge({ status }: { status: MoneyBudgetProgress['status'] }) {
  const className = status === 'Healthy'
    ? 'bg-mint/10 text-mint border-mint/20'
    : status === 'Watch'
      ? 'bg-[#ffcc66]/10 text-[#ffcc66] border-[#ffcc66]/20'
      : 'bg-[#ff9e8f]/10 text-[#ff9e8f] border-[#ff9e8f]/20'

  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${className}`}>{status}</span>
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="m-0 text-xs font-semibold text-white">{value}</p>
    </div>
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
