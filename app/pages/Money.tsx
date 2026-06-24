import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import { useOperatorData } from '@/hooks/useOperatorData'
import {
  ChartShell,
  ExpenseBreakdownChart,
  RevenueByBusinessChart,
  TrendLineChart,
} from '@/src/components/charts'
import { revenueTrend } from '@/src/data/mockBusinessMetrics'

const transactions = [
  ['Enterprise subscription', 'Revenue', '+$4,800', 'Today'],
  ['Cloud infrastructure', 'Software', '-$640', 'Yesterday'],
  ['Growth plan', 'Revenue', '+$1,200', 'Jun 22'],
  ['Design contractor', 'People', '-$950', 'Jun 21'],
]

const fmt = (n: number) => `$${n.toLocaleString()}`

export function Money() {
  const { data } = useOperatorData()
  const profit = data.monthlyRevenue - data.monthlyCost

  return (
    <>
      <PageIntro
        eyebrow="Financial command"
        title="Know where every dollar goes."
        description="Revenue, costs, margin, and cash signals in one calm, decision-ready view."
        action={<button className="btn-secondary">Export report</button>}
      />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Monthly Revenue" value={fmt(data.monthlyRevenue)} change="+14.2% vs plan" icon={DollarSign} accent />
        <MetricCard label="Operating Cost" value={fmt(data.monthlyCost)} change="6.1% under budget" icon={CreditCard} />
        <MetricCard label="Net Profit" value={fmt(profit)} change="73.6% margin" icon={Wallet} />
        <MetricCard label="Cash Reserve" value="$124,800" change="7.4 months runway" icon={PiggyBank} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <ChartShell
          eyebrow="Revenue Trend"
          title="Six month performance"
          meta="Jan — Jun 2026"
          className="col-span-8"
        >
          <TrendLineChart
            data={revenueTrend}
            dataKey="revenue"
            label="Revenue"
            xKey="month"
            gradientId="moneyRevenue"
          />
        </ChartShell>
        <ChartShell
          eyebrow="Expense Breakdown"
          title="Monthly allocation"
          className="col-span-4"
        >
          <ExpenseBreakdownChart />
        </ChartShell>
        <ChartShell
          eyebrow="Profit Trend"
          title="Operating leverage"
          meta="73.6% margin"
          className="col-span-6"
        >
          <TrendLineChart
            data={revenueTrend}
            dataKey="profit"
            label="Profit"
            xKey="month"
            color="#80e5bd"
            gradientId="moneyProfit"
          />
        </ChartShell>
        <ChartShell
          eyebrow="Revenue by Business"
          title="Portfolio contribution"
          meta="$48.6k total"
          className="col-span-6"
        >
          <RevenueByBusinessChart />
        </ChartShell>

        <section className="panel col-span-12 overflow-hidden">
          <div className="border-b border-line px-6 py-5">
            <p className="eyebrow mb-1">Ledger</p>
            <h3 className="m-0 text-lg font-semibold">Recent activity</h3>
          </div>
          {transactions.map(([name, category, amount, date]) => {
            const positive = amount.startsWith('+')
            return (
              <div key={name} className="flex items-center border-b border-line px-6 py-4 last:border-0">
                <div className={`mr-4 rounded-lg p-2 ${positive ? 'bg-mint/10 text-mint' : 'bg-white/[0.04] text-muted'}`}>
                  {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="flex-1">
                  <p className="m-0 text-sm font-medium">{name}</p>
                  <p className="mb-0 mt-1 text-xs text-muted">{category}</p>
                </div>
                <span className={`mr-8 text-sm font-medium ${positive ? 'text-mint' : 'text-white'}`}>{amount}</span>
                <span className="w-16 text-right text-xs text-muted">{date}</span>
              </div>
            )
          })}
        </section>
      </div>
    </>
  )
}
