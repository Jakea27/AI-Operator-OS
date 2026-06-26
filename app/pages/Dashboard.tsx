import {
  Banknote,
  Check,
  CircleDollarSign,
  Clock3,
  Coins,
  Gauge,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { MetricCard } from '@/components/MetricCard'
import { PageIntro } from '@/components/PageIntro'
import { ApprovalActivityChart, ChartShell, TrendLineChart } from '@/src/components/charts'
import { getLatestMemoryByType, getMemoryHealth, useMemoryStore } from '@/src/core/memory'
import { useMoneyStore } from '@/src/core/money'
import { useRoadmapStore } from '@/src/core/roadmap'
import { buildApprovalActivity, buildMonthlyTrend } from '@/src/data/operatingMetrics'
import { getApprovalDecisionLabel, getApprovalStats, useApprovalStore } from '@/src/features/approval'
import { generateDailyBriefing } from '@/src/services/briefing/briefingEngine'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'

export function Dashboard() {
  const {
    data,
    metrics,
    storageAvailable,
    saveDailyBriefing,
  } = useOperatingStore()
  const { memoryEntries } = useMemoryStore()
  const money = useMoneyStore()
  const roadmap = useRoadmapStore()
  const approvalQueue = useApprovalStore()
  const approvalStats = getApprovalStats(approvalQueue.approvals)
  const approvalWidgetTitle = approvalStats.pending > 0
    ? `${approvalStats.pending} pending CEO decision${approvalStats.pending === 1 ? '' : 's'}`
    : 'No pending CEO decisions'
  const approvalWidgetSubtitle = getDashboardApprovalSubtitle(approvalQueue.approvals.length, approvalStats.latestDecision)
  const pendingSharedApprovals = approvalQueue.approvals.filter((approval) => approval.status === 'Pending')
  const liveBriefing = generateDailyBriefing({ state: data, memories: memoryEntries, storageAvailable })
  const briefingIsCurrent = data.latestBriefing?.sourceFingerprint === liveBriefing.sourceFingerprint
  const briefing = briefingIsCurrent && data.latestBriefing ? data.latestBriefing : liveBriefing
  const trend = buildMonthlyTrend(data)
  const approvalActivity = buildApprovalActivity(data)
  const activeProject = data.projects.find((project) => project.status === 'active')
  const hasOperatingData =
    data.revenueEntries.length > 0 ||
    data.expenseEntries.length > 0 ||
    data.approvals.length > 0 ||
    data.projects.length > 0 ||
    data.tasks.length > 0 ||
    memoryEntries.length > 0 ||
    approvalQueue.approvals.length > 0
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const runBriefing = () => {
    saveDailyBriefing(generateDailyBriefing({ state: data, memories: memoryEntries, storageAvailable, now: new Date() }))
  }

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
        action={
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs ${storageAvailable ? 'text-mint' : 'text-[#ff9e8f]'}`}><span className={`h-2 w-2 rounded-full ${storageAvailable ? 'bg-mint' : 'bg-[#ff9e8f]'}`} />{storageAvailable ? 'Local data healthy' : 'Storage unavailable'}</div>
            <button onClick={runBriefing} className="btn-primary flex items-center gap-2"><Sparkles size={15} /> Run daily briefing</button>
          </div>
        }
      />

      {!hasOperatingData && (
        <section className="panel mb-4 flex items-center justify-between gap-6 border-lime/25 bg-gradient-to-r from-lime/[0.08] to-panel p-5">
          <div>
            <p className="eyebrow mb-1 text-lime">Empty local workspace</p>
            <h3 className="m-0 text-base font-semibold">Add your first operating record</h3>
            <p className="mb-0 mt-1 text-xs text-muted">The dashboard intentionally starts at $0. Revenue and expense entries immediately update these metrics and the Money charts.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link to="/money#manual-entry" className="btn-primary">Add revenue</Link>
            <Link to="/money#manual-entry" className="btn-secondary">Add expense</Link>
          </div>
        </section>
      )}

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Revenue Today" value={formatCurrency(money.metrics.revenueToday)} change="From today’s entries" icon={CircleDollarSign} accent />
        <MetricCard label="Monthly Revenue" value={formatCurrency(money.metrics.currentMonthRevenue)} change="Current calendar month" icon={Banknote} />
        <MetricCard label="Monthly Cost" value={formatCurrency(money.metrics.currentMonthCosts)} change="Current calendar month" icon={Coins} positive={money.metrics.currentMonthCosts === 0} />
        <MetricCard label="Profit" value={formatCurrency(money.metrics.profit)} change={`${money.metrics.profitMargin.toFixed(1)}% margin`} icon={Gauge} positive={money.metrics.profit >= 0} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <ChartShell eyebrow="Revenue Trend" title="Six month operating history" meta="Local records" className="col-span-8">
          <TrendLineChart data={trend} dataKey="revenue" label="Revenue" xKey="month" gradientId="dashboardRevenue" />
        </ChartShell>
        <ChartShell eyebrow="Approval Activity" title="Decisions this week" meta={`${approvalStats.pending} pending`} className="col-span-4">
          <ApprovalActivityChart data={approvalActivity} />
        </ChartShell>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        <section className={`panel col-span-12 flex items-center justify-between gap-6 p-5 ${approvalStats.pending > 0 ? 'border-[#ffcc66]/25 bg-[#ffcc66]/[0.045]' : 'border-lime/20 bg-lime/[0.035]'}`}>
          <div className="flex items-start gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${approvalStats.pending > 0 ? 'bg-[#ffcc66]/10 text-[#ffcc66]' : 'bg-lime/10 text-lime'}`}><ShieldAlert size={19} /></div>
            <div>
              <p className="eyebrow mb-1">{approvalStats.pending > 0 ? 'CEO decisions waiting' : 'Approval status'}</p>
              <h3 className="m-0 text-lg font-semibold text-white">{approvalWidgetTitle}</h3>
              <p className="mb-0 mt-2 text-xs leading-5 text-muted">{approvalWidgetSubtitle}</p>
            </div>
          </div>
          <Link to="/approval" className={approvalStats.pending > 0 ? 'btn-primary' : 'btn-secondary'}>Open Approval Queue</Link>
        </section>

        <BusinessMemoryWidget memories={memoryEntries} />

        <section className="panel col-span-7 p-6">
          <div className="flex items-center justify-between">
            <div><p className="eyebrow mb-2">CEO Daily Briefing</p><h3 className="m-0 font-display text-xl font-semibold">{briefing.greeting}</h3></div>
            <div className="rounded-xl bg-lime/10 p-2.5 text-lime"><Sparkles size={18} /></div>
          </div>
          <p className="my-5 text-[15px] leading-7 text-[#c3cbc7]">{briefing.executiveSignal}</p>
          <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
            <div>
              <p className="eyebrow mb-2">Top priorities</p>
              <ul className="m-0 space-y-1.5 pl-4 text-xs leading-5 text-[#aeb8b3]">
                {briefing.topPriorities.slice(0, 3).map((priority) => <li key={priority}>{priority}</li>)}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-2">Recommendation</p>
              <p className="m-0 text-xs leading-5 text-[#aeb8b3]">{briefing.recommendations[0]}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-[11px] text-muted">
            <span>{data.latestBriefing ? `Last generated ${new Date(data.latestBriefing.generatedAt).toLocaleString()}` : 'Not yet saved'}</span>
            {!briefingIsCurrent && data.latestBriefing && <span className="font-medium text-[#ffcc66]">Operating data changed — refresh recommended</span>}
          </div>
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
          <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="flex items-center gap-2"><Clock3 size={13} /> Updated when task status changes</span>
            <Link to="/roadmap" className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 font-semibold text-lime">{roadmap.backlogCount} roadmap backlog</Link>
          </div>
        </section>

        <section className="panel col-span-12 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div><p className="eyebrow mb-1">Approval Queue</p><h3 className="m-0 font-display text-lg font-semibold">Decisions waiting for you</h3></div>
            <span className="rounded-full bg-[#ffcc66]/10 px-3 py-1 text-[11px] font-medium text-[#ffcc66]">{approvalStats.pending} pending</span>
          </div>
          <div className="grid grid-cols-6 gap-3 border-b border-line px-6 py-4">
            <ApprovalMetric label="Pending Approvals" value={approvalStats.pending} />
            <ApprovalMetric label="Approved Today" value={approvalStats.approvedToday} />
            <ApprovalMetric label="Rejected Today" value={approvalStats.rejectedToday} />
            <ApprovalMetric label="Deferred Approvals" value={approvalStats.deferred} />
            <ApprovalMetric label="Waiting on CEO" value={approvalStats.waitingOnCEO} />
            <div className="rounded-xl border border-line bg-ink/35 p-3">
              <p className="eyebrow mb-1">Latest Approval Decision</p>
              <p className="m-0 text-xs font-semibold leading-5 text-white">{getApprovalDecisionLabel(approvalStats.latestDecision)}</p>
            </div>
          </div>
          {pendingSharedApprovals.length === 0 ? (
            <EmptyState icon={Check} title="No CEO decisions pending" copy="Operator recommendations that need CEO review will appear in the Approval Queue." />
          ) : (
            <div>
              {pendingSharedApprovals.slice(0, 4).map((approval) => (
                <div key={approval.id} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-0">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-muted"><CircleDollarSign size={17} /></div>
                  <div className="min-w-0 flex-1"><p className="m-0 text-sm font-medium text-white">{approval.title}</p><p className="mb-0 mt-1 text-xs text-muted">{approval.operator} · {approval.department} · {approval.risk} risk</p></div>
                  <Link to="/approval" className="btn-secondary">Review</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function ApprovalMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="m-0 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

function getDashboardApprovalSubtitle(totalApprovals: number, latestDecision?: Parameters<typeof getApprovalDecisionLabel>[0]) {
  if (latestDecision) return `Last completed decision: ${getApprovalDecisionLabel(latestDecision)}`
  if (totalApprovals > 0) return 'Awaiting CEO review.'
  return 'No CEO decisions recorded yet.'
}

function BusinessMemoryWidget({ memories }: { memories: import('@/src/core/memory').MemoryEntry[] }) {
  const pinnedBusinessRules = memories
    .filter((entry) => entry.type === 'Business Rule' && entry.pinned && !entry.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  const latestDecision = getLatestMemoryByType(memories, 'Decision')
  const latestArchitecture = getLatestMemoryByType(memories, 'Architecture')
  const latestSprint = getLatestMemoryByType(memories, 'Sprint')
  const latestIdea = getLatestMemoryByType(memories, 'Idea')
  const health = getMemoryHealth(memories)
  const groups = [
    ['Pinned Rules', pinnedBusinessRules],
    ['Latest Decision', latestDecision ? [latestDecision] : []],
    ['Latest Architecture', latestArchitecture ? [latestArchitecture] : []],
    ['Latest Sprint', latestSprint ? [latestSprint] : []],
    ['Latest Idea', latestIdea ? [latestIdea] : []],
  ] as const
  return (
    <section className="panel col-span-12 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="eyebrow mb-1">Business Memory</p><h3 className="m-0 text-lg font-semibold">What the operating system remembers</h3></div>
        <Link to="/memory" className="btn-secondary">Open memory</Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {groups.map(([label, entries]) => (
          <div key={label} className="rounded-xl border border-line bg-ink/40 p-4">
            <p className="eyebrow mb-3">{label}</p>
            {entries.length === 0 ? <p className="m-0 text-xs text-muted">No entries yet.</p> : entries.map((entry) => <p key={entry.id} className="mb-2 text-xs leading-5 text-[#aeb8b3] last:mb-0">{entry.relatedIssue && <span className="mr-1 text-mint">{entry.relatedIssue}</span>}{entry.title}</p>)}
          </div>
        ))}
        <div className="rounded-xl border border-lime/20 bg-lime/[0.04] p-4">
          <p className="eyebrow mb-3 text-lime">Memory Health</p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(health).map(([label, value]) => (
              <div key={label} className="rounded-lg bg-ink/45 p-2 text-center">
                <p className="m-0 text-lg font-semibold text-white">{value}</p>
                <p className="mb-0 mt-1 text-[9px] capitalize text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
