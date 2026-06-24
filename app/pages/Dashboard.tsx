import {
  ArrowRight,
  Banknote,
  Check,
  CircleDollarSign,
  Clock3,
  Coins,
  Gauge,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import { EmptyState } from '@/components/EmptyState'
import { useOperatorData } from '@/hooks/useOperatorData'

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export function Dashboard() {
  const { data, resolveApproval } = useOperatorData()
  const profit = data.monthlyRevenue - data.monthlyCost

  return (
    <>
      <PageIntro
        eyebrow="Wednesday, June 24"
        title="Good morning, Operator."
        description="Your business is healthy. Revenue is ahead of plan and three decisions need your attention."
        action={<button className="btn-primary flex items-center gap-2"><Sparkles size={15} /> Run daily briefing</button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Revenue Today" value={money(data.revenueToday)} change="+18.4% vs yesterday" icon={CircleDollarSign} accent />
        <MetricCard label="Monthly Revenue" value={money(data.monthlyRevenue)} change="+14.2% vs plan" icon={Banknote} />
        <MetricCard label="Monthly Cost" value={money(data.monthlyCost)} change="6.1% under budget" icon={Coins} />
        <MetricCard label="Profit" value={money(profit)} change={`${Math.round((profit / data.monthlyRevenue) * 100)}% margin`} icon={Gauge} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <section className="panel col-span-7 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow mb-2">CEO Report</p>
              <h3 className="m-0 font-display text-xl font-semibold">Today’s executive signal</h3>
            </div>
            <div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Sparkles size={18} /></div>
          </div>
          <p className="my-6 text-[15px] leading-7 text-[#c3cbc7]">{data.ceoReport}</p>
          <div className="flex items-center gap-2 border-t border-line pt-4 text-xs font-medium text-lime">
            Open full CEO report <ArrowRight size={14} />
          </div>
        </section>

        <section className="panel col-span-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow mb-2">Current Sprint</p>
              <h3 className="m-0 font-display text-xl font-semibold">Foundation & launch</h3>
            </div>
            <span className="rounded-full bg-mint/10 px-3 py-1 text-[11px] font-medium text-mint">On track</span>
          </div>
          <div className="my-7 flex items-end justify-between">
            <div>
              <p className="m-0 font-display text-4xl font-semibold">{data.sprintProgress}%</p>
              <p className="mb-0 mt-1 text-xs text-muted">18 of 25 tasks complete</p>
            </div>
            <Target size={32} className="text-line" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${data.sprintProgress}%` }} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted"><Clock3 size={13} /> 4 days remaining</div>
        </section>

        <section className="panel col-span-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <p className="eyebrow mb-1">Approval Queue</p>
              <h3 className="m-0 font-display text-lg font-semibold">Decisions waiting for you</h3>
            </div>
            <span className="rounded-full bg-[#ffcc66]/10 px-3 py-1 text-[11px] font-medium text-[#ffcc66]">
              {data.approvals.length} pending
            </span>
          </div>
          {data.approvals.length === 0 ? (
            <EmptyState icon={Check} title="Queue cleared" copy="Every pending decision has been resolved. Nicely done." />
          ) : (
            <div>
              {data.approvals.map((approval) => (
                <div key={approval.id} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-0">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-muted">
                    <CircleDollarSign size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-medium text-white">{approval.title}</p>
                    <p className="mb-0 mt-1 text-xs text-muted">{approval.category}{approval.amount ? ` · ${approval.amount}` : ''}</p>
                  </div>
                  <button onClick={() => resolveApproval(approval.id)} className="rounded-lg border border-line p-2 text-muted transition hover:border-[#ff8b7b]/50 hover:text-[#ff8b7b]" aria-label="Reject">
                    <X size={15} />
                  </button>
                  <button onClick={() => resolveApproval(approval.id)} className="flex items-center gap-2 rounded-lg bg-lime px-3 py-2 text-xs font-semibold text-ink">
                    <Check size={14} /> Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
