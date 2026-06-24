import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import { ChartShell, ExpenseBreakdownChart, RevenueByBusinessChart, TrendLineChart } from '@/src/components/charts'
import { FinancialEntryForms } from '@/src/components/operating/FinancialEntryForms'
import { buildExpenseBreakdown, buildMonthlyTrend, buildRevenueByBusiness } from '@/src/data/operatingMetrics'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'

export function Money() {
  const { data, metrics } = useOperatingStore()
  const trend = buildMonthlyTrend(data)
  const expenses = buildExpenseBreakdown(data)
  const revenueByBusiness = buildRevenueByBusiness(data)
  const allTimeRevenue = data.revenueEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const allTimeExpenses = data.expenseEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const ledger = [
    ...data.revenueEntries.map((entry) => ({
      id: entry.id,
      name: entry.description,
      category: entry.business,
      amount: entry.amount,
      date: entry.date,
      positive: true,
    })),
    ...data.expenseEntries.map((entry) => ({
      id: entry.id,
      name: entry.description,
      category: entry.category,
      amount: entry.amount,
      date: entry.date,
      positive: false,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <PageIntro
        eyebrow="Financial command"
        title="Know where every dollar goes."
        description="All values and charts are calculated from revenue and expense records stored locally on this device."
      />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Monthly Revenue" value={formatCurrency(metrics.monthlyRevenue)} change="Current month entries" icon={DollarSign} accent />
        <MetricCard label="Operating Cost" value={formatCurrency(metrics.monthlyCost)} change="Current month entries" icon={CreditCard} positive={metrics.monthlyCost === 0} />
        <MetricCard label="Net Profit" value={formatCurrency(metrics.profit)} change={`${metrics.profitMargin.toFixed(1)}% margin`} icon={Wallet} positive={metrics.profit >= 0} />
        <MetricCard label="All-time Balance" value={formatCurrency(allTimeRevenue - allTimeExpenses)} change="All recorded activity" icon={PiggyBank} positive={allTimeRevenue >= allTimeExpenses} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <FinancialEntryForms />
        <ChartShell eyebrow="Revenue Trend" title="Six month performance" meta="Local records" className="col-span-8">
          <TrendLineChart data={trend} dataKey="revenue" label="Revenue" xKey="month" gradientId="moneyRevenue" />
        </ChartShell>
        <ChartShell eyebrow="Expense Breakdown" title="Current month allocation" className="col-span-4">
          <ExpenseBreakdownChart data={expenses} />
        </ChartShell>
        <ChartShell eyebrow="Profit Trend" title="Operating leverage" meta={`${metrics.profitMargin.toFixed(1)}% margin`} className="col-span-6">
          <TrendLineChart data={trend} dataKey="profit" label="Profit" xKey="month" color="#80e5bd" gradientId="moneyProfit" />
        </ChartShell>
        <ChartShell eyebrow="Revenue by Business" title="Current month contribution" meta={formatCurrency(metrics.monthlyRevenue)} className="col-span-6">
          <RevenueByBusinessChart data={revenueByBusiness} />
        </ChartShell>

        <section className="panel col-span-12 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><p className="eyebrow mb-1">Ledger</p><h3 className="m-0 text-lg font-semibold">Recorded activity</h3></div>
          {ledger.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-muted">No financial entries yet. Add revenue or an expense above.</div>
          ) : ledger.map((entry) => (
            <div key={entry.id} className="flex items-center border-b border-line px-6 py-4 last:border-0">
              <div className={`mr-4 rounded-lg p-2 ${entry.positive ? 'bg-mint/10 text-mint' : 'bg-white/[0.04] text-muted'}`}>{entry.positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div>
              <div className="flex-1"><p className="m-0 text-sm font-medium">{entry.name}</p><p className="mb-0 mt-1 text-xs text-muted">{entry.category}</p></div>
              <span className={`mr-8 text-sm font-medium ${entry.positive ? 'text-mint' : 'text-white'}`}>{entry.positive ? '+' : '-'}{formatCurrency(entry.amount)}</span>
              <span className="w-24 text-right text-xs text-muted">{new Date(`${entry.date}T12:00:00`).toLocaleDateString()}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  )
}
