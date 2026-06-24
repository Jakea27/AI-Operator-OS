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
import { ApprovalActivityChart, ChartShell, TrendLineChart } from '@/src/components/charts'
import { ApprovalEntryForm } from '@/src/components/operating/ApprovalEntryForm'
import { buildApprovalActivity, buildMonthlyTrend } from '@/src/data/operatingMetrics'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'

export function Dashboard() {
  const {
    data,
    metrics,
    ceoReport,
    storageAvailable,
    resolveApproval,
  } = useOperatingStore()
  const trend = buildMonthlyTrend(data)
  const approvalActivity = buildApprovalActivity(data)
  const pendingApprovals = data.approvals.filter((approval) => approval.status === 'pending')
  const activeProject = data.projects.find((project) => project.status === 'active')
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <PageIntro
        eyebrow={currentDate}
        title={`Good morning${data.settings.ownerName ? `, ${data.settings.ownerName}` : ''}.`}
        description={
          storageAvailable
            ? 'Your command center is calculated from operating records stored locally on this device.'
            : 'Local storage is unavailable. Changes may not persist after this session.'
        }
        action={<div className={`flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs ${storageAvailable ? 'text-mint' : 'text-[#ff9e8f]'}`}><span className={`h-2 w-2 rounded-full ${storageAvailable ? 'bg-mint' : 'bg-[#ff9e8f]'}`} />{storageAvailable ? 'Local data healthy' : 'Storage unavailable'}</div>}
      />

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Revenue Today" value={formatCurrency(metrics.revenueToday)} change="From today’s entries" icon={CircleDollarSign} accent />
        <MetricCard label="Monthly Revenue" value={formatCurrency(metrics.monthlyRevenue)} change="Current calendar month" icon={Banknote} />
        <MetricCard label="Monthly Cost" value={formatCurrency(metrics.monthlyCost)} change="Current calendar month" icon={Coins} positive={metrics.monthlyCost === 0} />
        <MetricCard label="Profit" value={formatCurrency(metrics.profit)} change={`${metrics.profitMargin.toFixed(1)}% margin`} icon={Gauge} positive={metrics.profit >= 0} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <ChartShell eyebrow="Revenue Trend" title="Six month operating history" meta="Local records" className="col-span-8">
          <TrendLineChart data={trend} dataKey="revenue" label="Revenue" xKey="month" gradientId="dashboardRevenue" />
        </ChartShell>
        <ChartShell eyebrow="Approval Activity" title="Decisions this week" meta={`${pendingApprovals.length} pending`} className="col-span-4">
          <ApprovalActivityChart data={approvalActivity} />
        </ChartShell>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <section className="panel col-span-7 p-6">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow mb-2">CEO Report</p><h3 className="m-0 font-display text-xl font-semibold">Current executive signal</h3></div>
            <div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Sparkles size={18} /></div>
          </div>
          <p className="my-6 text-[15px] leading-7 text-[#c3cbc7]">{ceoReport}</p>
          <div className="flex items-center gap-2 border-t border-line pt-4 text-xs font-medium text-lime">Calculated from local operating data <ArrowRight size={14} /></div>
        </section>

        <section className="panel col-span-5 p-6">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow mb-2">Current Sprint</p><h3 className="m-0 font-display text-xl font-semibold">{activeProject?.name ?? 'No active project'}</h3></div>
            <span className="rounded-full bg-mint/10 px-3 py-1 text-[11px] font-medium text-mint">{metrics.sprintTotal > 0 ? 'Tracking' : 'Empty'}</span>
          </div>
          <div className="my-7 flex items-end justify-between">
            <div><p className="m-0 font-display text-4xl font-semibold">{metrics.sprintProgress}%</p><p className="mb-0 mt-1 text-xs text-muted">{metrics.sprintCompleted} of {metrics.sprintTotal} sprint tasks complete</p></div>
            <Target size={32} className="text-line" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${metrics.sprintProgress}%` }} /></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted"><Clock3 size={13} /> Updated when task status changes</div>
        </section>

        <section className="panel col-span-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div><p className="eyebrow mb-1">Approval Queue</p><h3 className="m-0 font-display text-lg font-semibold">Decisions waiting for you</h3></div>
            <span className="rounded-full bg-[#ffcc66]/10 px-3 py-1 text-[11px] font-medium text-[#ffcc66]">{metrics.pendingApprovalCount} pending</span>
          </div>
          <ApprovalEntryForm />
          {pendingApprovals.length === 0 ? (
            <EmptyState icon={Check} title="Queue cleared" copy="No pending approvals. Add one above when a decision needs CEO review." />
          ) : (
            <div>
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-0">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-muted"><CircleDollarSign size={17} /></div>
                  <div className="min-w-0 flex-1"><p className="m-0 text-sm font-medium text-white">{approval.title}</p><p className="mb-0 mt-1 text-xs text-muted">{approval.category}{approval.amount ? ` · ${formatCurrency(approval.amount)}` : ''}</p></div>
                  <button onClick={() => resolveApproval(approval.id, 'rejected')} className="rounded-lg border border-line p-2 text-muted transition hover:border-[#ff8b7b]/50 hover:text-[#ff8b7b]" aria-label="Reject"><X size={15} /></button>
                  <button onClick={() => resolveApproval(approval.id, 'approved')} className="flex items-center gap-2 rounded-lg bg-lime px-3 py-2 text-xs font-semibold text-ink"><Check size={14} /> Approve</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
