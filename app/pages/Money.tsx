import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PiggyBank, Wallet } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import { useOperatorData } from '@/hooks/useOperatorData'

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
      <PageIntro eyebrow="Financial command" title="Know where every dollar goes." description="Revenue, costs, margin, and cash signals in one calm, decision-ready view." action={<button className="btn-secondary">Export report</button>} />
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Monthly Revenue" value={fmt(data.monthlyRevenue)} change="+14.2% vs plan" icon={DollarSign} accent />
        <MetricCard label="Operating Cost" value={fmt(data.monthlyCost)} change="6.1% under budget" icon={CreditCard} />
        <MetricCard label="Net Profit" value={fmt(profit)} change="73.6% margin" icon={Wallet} />
        <MetricCard label="Cash Reserve" value="$124,800" change="7.4 months runway" icon={PiggyBank} />
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4">
        <section className="panel col-span-8 p-6">
          <div className="flex items-center justify-between"><div><p className="eyebrow mb-1">Revenue Trend</p><h3 className="m-0 text-lg font-semibold">Six month performance</h3></div><span className="text-xs text-muted">Jan — Jun 2026</span></div>
          <div className="mt-8 flex h-52 items-end gap-4">
            {[42, 51, 48, 68, 77, 92].map((height, index) => (
              <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="relative rounded-t-lg bg-gradient-to-t from-mint/20 to-lime transition hover:brightness-110" style={{ height: `${height}%` }} />
                <span className="text-center text-[10px] text-muted">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel col-span-4 p-6">
          <p className="eyebrow mb-1">Cost Mix</p><h3 className="m-0 text-lg font-semibold">Monthly allocation</h3>
          <div className="my-7 grid place-items-center">
            <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background: 'conic-gradient(#c8f560 0 42%, #80e5bd 42% 68%, #40584f 68% 86%, #26332e 86%)' }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-panel text-center"><div><p className="m-0 text-xl font-semibold">$12.8k</p><p className="m-0 text-[10px] text-muted">total costs</p></div></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px] text-muted">{['People 42%', 'Software 26%', 'Growth 18%', 'Other 14%'].map((item, i) => <div key={item} className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-lime' : i === 1 ? 'bg-mint' : i === 2 ? 'bg-[#40584f]' : 'bg-[#26332e]'}`} />{item}</div>)}</div>
        </section>
        <section className="panel col-span-12 overflow-hidden">
          <div className="border-b border-line px-6 py-5"><p className="eyebrow mb-1">Ledger</p><h3 className="m-0 text-lg font-semibold">Recent activity</h3></div>
          {transactions.map(([name, category, amount, date]) => {
            const positive = amount.startsWith('+')
            return <div key={name} className="flex items-center border-b border-line px-6 py-4 last:border-0"><div className={`mr-4 rounded-lg p-2 ${positive ? 'bg-mint/10 text-mint' : 'bg-white/[0.04] text-muted'}`}>{positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div><div className="flex-1"><p className="m-0 text-sm font-medium">{name}</p><p className="mb-0 mt-1 text-xs text-muted">{category}</p></div><span className={`mr-8 text-sm font-medium ${positive ? 'text-mint' : 'text-white'}`}>{amount}</span><span className="w-16 text-right text-xs text-muted">{date}</span></div>
          })}
        </section>
      </div>
    </>
  )
}
