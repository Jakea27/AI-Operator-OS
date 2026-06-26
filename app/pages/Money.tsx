import { useState } from 'react'
import {
  CircleDollarSign,
  CreditCard,
  Percent,
  Plus,
  Wallet,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import {
  CostBreakdown,
  CostOverview,
  FinancialHealthCard,
  RecentFinancialActivity,
} from '@/src/components/money/MoneyDashboardSections'
import {
  ChartShell,
  ExpenseBreakdownChart,
  RevenueByBusinessChart,
  TrendLineChart,
} from '@/src/components/charts'
import { FinancialEntryForm } from '@/src/components/operating/FinancialEntryForm'
import { FinancialHistoryTable } from '@/src/components/operating/FinancialHistoryTable'
import {
  buildExpenseBreakdown,
  buildMonthlyTrend,
  buildRevenueByBusiness,
} from '@/src/data/operatingMetrics'
import { useMoneyStore } from '@/src/core/money'
import {
  ExpenseEntry,
  formatCurrency,
  RevenueEntry,
  useOperatingStore,
} from '@/src/services/operatingStore'

type EditorState =
  | { mode: 'revenue'; entry?: RevenueEntry }
  | { mode: 'expense'; entry?: ExpenseEntry }
  | null

export function Money() {
  const {
    data,
    deleteRevenue,
    deleteExpense,
  } = useOperatingStore()
  const money = useMoneyStore()
  const [editor, setEditor] = useState<EditorState>(null)
  const trend = buildMonthlyTrend(data)
  const expenses = buildExpenseBreakdown(data)
  const revenueByBusiness = buildRevenueByBusiness(data)

  const confirmDeleteRevenue = (entry: RevenueEntry) => {
    if (window.confirm(`Delete the ${formatCurrency(entry.amount)} revenue entry?`)) {
      deleteRevenue(entry.id)
    }
  }

  const confirmDeleteExpense = (entry: ExpenseEntry) => {
    if (window.confirm(`Delete the ${formatCurrency(entry.amount)} expense entry?`)) {
      deleteExpense(entry.id)
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="Money Department"
        title="Local-first accounting, in one place."
        description="Revenue, expenses, calculations, and financial health all use the same persisted records that power the Dashboard."
        action={
          <div className="flex gap-2">
            <button onClick={() => setEditor({ mode: 'revenue' })} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add Revenue</button>
            <button onClick={() => setEditor({ mode: 'expense' })} className="btn-secondary flex items-center gap-2"><Plus size={15} /> Add Expense</button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Monthly Revenue" value={formatCurrency(money.metrics.currentMonthRevenue)} change="Current calendar month" icon={CircleDollarSign} accent />
        <MetricCard label="Monthly Expenses" value={formatCurrency(money.metrics.currentMonthCosts)} change="Recurring + one-time" icon={CreditCard} positive={money.metrics.currentMonthCosts === 0} />
        <MetricCard label="Monthly Profit" value={formatCurrency(money.metrics.profit)} change="Revenue minus expenses" icon={Wallet} positive={money.metrics.profit >= 0} />
        <MetricCard label="Profit Margin" value={`${money.metrics.profitMargin.toFixed(1)}%`} change="Profit ÷ revenue" icon={Percent} positive={money.metrics.profitMargin >= 0} />
      </div>

      <div className="mt-4 space-y-4">
        {editor?.mode === 'revenue' && (
          <FinancialEntryForm mode="revenue" entry={editor.entry} onClose={() => setEditor(null)} />
        )}
        {editor?.mode === 'expense' && (
          <FinancialEntryForm mode="expense" entry={editor.entry} onClose={() => setEditor(null)} />
        )}

        {data.revenueEntries.length === 0 && data.expenseEntries.length === 0 && !editor && (
          <section id="manual-entry" className="panel scroll-mt-24 p-8 text-center">
            <p className="eyebrow mb-2 text-lime">No financial records</p>
            <h3 className="m-0 text-lg font-semibold">Start the Money Department with a real entry</h3>
            <p className="mx-auto mb-5 mt-2 max-w-xl text-xs leading-5 text-muted">Nothing is preloaded. Add revenue or an expense and every calculation, chart, history table, and Dashboard widget will update immediately.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => setEditor({ mode: 'revenue' })} className="btn-primary">Add Revenue</button>
              <button onClick={() => setEditor({ mode: 'expense' })} className="btn-secondary">Add Expense</button>
            </div>
          </section>
        )}

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">
            <CostOverview metrics={money.metrics} />
          </div>
          <div className="col-span-5">
            <FinancialHealthCard health={money.health} />
          </div>
          <div className="col-span-5">
            <CostBreakdown breakdown={money.categoryBreakdown} />
          </div>
          <div className="col-span-7">
            <RecentFinancialActivity activity={money.recentActivity} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <ChartShell eyebrow="Revenue Trend" title="Six month revenue" meta="Local records" className="col-span-6">
            <TrendLineChart data={trend} dataKey="revenue" label="Revenue" xKey="month" gradientId="moneyRevenue" />
          </ChartShell>
          <ChartShell eyebrow="Expense Trend" title="Six month expenses" meta="Local records" className="col-span-6">
            <TrendLineChart data={trend} dataKey="expense" label="Expenses" xKey="month" color="#ff9e8f" gradientId="moneyExpense" />
          </ChartShell>
          <ChartShell eyebrow="Profit Trend" title="Six month profit" meta={`${money.metrics.profitMargin.toFixed(1)}% margin`} className="col-span-6">
            <TrendLineChart data={trend} dataKey="profit" label="Profit" xKey="month" color="#80e5bd" gradientId="moneyProfit" />
          </ChartShell>
          <ChartShell eyebrow="Revenue by Business" title="Current month contribution" meta={formatCurrency(money.metrics.currentMonthRevenue)} className="col-span-6">
            <RevenueByBusinessChart data={revenueByBusiness} />
          </ChartShell>
          <ChartShell eyebrow="Expense by Category" title="Current month allocation" meta={formatCurrency(money.metrics.currentMonthCosts)} className="col-span-6">
            <ExpenseBreakdownChart data={expenses} />
          </ChartShell>
          <section className="panel col-span-6 flex flex-col justify-center p-6">
            <p className="eyebrow mb-2">Accounting Status</p>
            <h3 className="m-0 text-xl font-semibold">{data.revenueEntries.length + data.expenseEntries.length} total records</h3>
            <p className="mb-0 mt-3 text-xs leading-6 text-muted">All financial data is stored locally. This month includes {formatCurrency(money.metrics.monthlyRecurringCosts)} recurring costs and {formatCurrency(money.metrics.oneTimeCosts)} one-time costs.</p>
          </section>
        </div>

        <FinancialHistoryTable
          mode="revenue"
          entries={data.revenueEntries}
          onEdit={(entry) => setEditor({ mode: 'revenue', entry })}
          onDelete={confirmDeleteRevenue}
        />
        <FinancialHistoryTable
          mode="expense"
          entries={data.expenseEntries}
          onEdit={(entry) => setEditor({ mode: 'expense', entry })}
          onDelete={confirmDeleteExpense}
        />
      </div>
    </>
  )
}
