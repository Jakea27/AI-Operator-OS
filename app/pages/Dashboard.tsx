import {
  AlertTriangle,
  Banknote,
  BriefcaseBusiness,
  Check,
  Clock3,
  Cpu,
  DollarSign,
  FileText,
  Lightbulb,
  ListChecks,
  Map,
  Network,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { KeyboardEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useBusinessStore } from '@/src/core/businesses'
import { useCapabilityPlanningStore } from '@/src/core/capabilityPlanning'
import { useMemoryStore } from '@/src/core/memory'
import { useMoneyStore } from '@/src/core/money'
import { getRegisteredOperators, useOperatorStore } from '@/src/core/operators'
import { useProjectStore } from '@/src/core/projects'
import { useRoadmapStore } from '@/src/core/roadmap'
import { useWorkItemStore } from '@/src/core/workItems'
import { useExecutionQueueStore } from '@/src/core/executionQueue'
import { Approval, getApprovalDecisionLabel, getApprovalStats, useApprovalStore } from '@/src/features/approval'
import { generateDailyBriefing } from '@/src/services/briefing/briefingEngine'
import { formatCurrency, useOperatingStore } from '@/src/services/operatingStore'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

type AttentionAction = {
  id: string
  severity: Severity
  title: string
  why: string
  blocked: string
  to: string
}

type ActivityItem = {
  id: string
  title: string
  meta: string
  createdAt: string
  to: string
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
}

function greeting(ownerName: string) {
  const hour = new Date().getHours()
  const period = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'
  return `${period}${ownerName ? `, ${ownerName}` : ''}`
}

function severityWeight(severity: Severity) {
  return {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  }[severity]
}

export function Dashboard() {
  const {
    data,
    storageAvailable,
    saveDailyBriefing,
  } = useOperatingStore()
  const money = useMoneyStore()
  const approvalQueue = useApprovalStore()
  const executionQueue = useExecutionQueueStore()
  const capabilityPlanning = useCapabilityPlanningStore()
  const businessStore = useBusinessStore()
  const projectStore = useProjectStore()
  const workItemStore = useWorkItemStore()
  const memoryStore = useMemoryStore()
  const roadmap = useRoadmapStore()
  const operatorStore = useOperatorStore()

  const approvalStats = getApprovalStats(approvalQueue.approvals)
  const pendingApprovals = approvalQueue.approvals.filter((approval) => approval.status === 'Pending')
  const deferredApprovals = approvalQueue.approvals.filter((approval) => approval.status === 'Deferred')
  const activeQueueItems = executionQueue.queueItems.filter((item) => !['Completed', 'Archived'].includes(item.queueStatus))
  const blockedQueueItems = executionQueue.queueItems.filter((item) => item.queueStatus === 'Blocked')
  const readyQueueItems = executionQueue.queueItems.filter((item) => item.queueStatus === 'Ready')
  const incompletePlans = capabilityPlanning.capabilityPlans.filter((plan) =>
    ['Draft', 'Incomplete', 'Blocked'].includes(plan.readinessStatus) || plan.missingRequirements.length > 0
  )
  const blockedPlans = capabilityPlanning.capabilityPlans.filter((plan) => plan.readinessStatus === 'Blocked')
  const activeBusinesses = businessStore.businesses.filter((business) => business.status !== 'Archived')
  const activeProjects = projectStore.projects.filter((project) => ['Planning', 'Active', 'On Hold'].includes(project.status))
  const blockedWorkItems = workItemStore.workItems.filter((item) => item.status === 'Blocked')
  const waitingWorkItems = workItemStore.workItems.filter((item) => ['Planning', 'Ready', 'In Progress', 'Review'].includes(item.status))
  const dueWorkItems = workItemStore.workItems
    .filter((item) => item.dueDate && !['Completed', 'Archived'].includes(item.status))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4)
  const operatorTasks = Object.values(operatorStore.data.tasks).flat()
  const registeredOperators = getRegisteredOperators()
  const nonIdleOperators = registeredOperators.filter((operator) => operator.currentStatus !== 'Idle').length

  const briefingIsCurrent = data.latestBriefing?.sourceFingerprint === generateDailyBriefing({
    state: data,
    memories: memoryStore.memoryEntries,
    storageAvailable,
  }).sourceFingerprint

  const actions = buildAttentionActions({
    pendingApprovals,
    blockedQueueItems,
    blockedPlans,
    incompletePlans,
    blockedWorkItems,
  })

  const recentActivity = buildRecentActivity({
    approvals: approvalQueue.approvals,
    capabilityPlans: capabilityPlanning.capabilityPlans,
    queueItems: executionQueue.queueItems,
    workItems: workItemStore.workItems,
    projects: projectStore.projects,
    businesses: businessStore.businesses,
    memories: memoryStore.memoryEntries,
  })

  const alerts = buildAlerts({
    deferredApprovals,
    incompletePlans,
    blockedQueueItems,
    dueWorkItems,
  })

  function runBriefing() {
    saveDailyBriefing(generateDailyBriefing({
      state: data,
      memories: memoryStore.memoryEntries,
      storageAvailable,
      now: new Date(),
    }))
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden border-lime/20 bg-gradient-to-br from-lime/[0.08] via-panel to-ink p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow mb-2">Command Center · {todayLabel()}</p>
            <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">
              {greeting(data.settings.ownerName || 'Jake')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aeb8b3]">
              What requires your attention right now? The Command Center summarizes local operating records and routes you to the module that owns the work.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <StatusPill label="System Status" value={storageAvailable ? 'Local systems operational' : 'Storage unavailable'} tone={storageAvailable ? 'good' : 'warning'} />
            <StatusPill
              label="Daily Briefing"
              value={data.latestBriefing ? (briefingIsCurrent ? 'Current' : 'Refresh recommended') : 'Not generated yet'}
              tone={briefingIsCurrent ? 'good' : 'neutral'}
            />
            <button onClick={runBriefing} className="btn-primary flex items-center justify-center gap-2 sm:col-span-2">
              <Sparkles size={15} /> Run Daily Briefing
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="CEO Required Actions" eyebrow="Human judgment needed">
          {actions.length > 0 ? (
            <div className="space-y-3">
              {actions.slice(0, 6).map((action) => (
                <NavigationCard key={action.id} to={action.to} ariaLabel={`Review ${action.title}`}>
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={action.severity} />
                    <div className="min-w-0 flex-1">
                      <h4 className="m-0 text-sm font-semibold text-white">{action.title}</h4>
                      <p className="m-0 mt-2 text-xs leading-5 text-[#aeb8b3]">{action.why}</p>
                      <p className="m-0 mt-2 text-[11px] font-medium text-muted">Waiting on: {action.blocked}</p>
                    </div>
                  </div>
                </NavigationCard>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No CEO action is required right now." copy="This does not mean all business work is complete. It means no tracked local record currently requires human judgment." />
          )}
        </Section>

        <Section title="CEO Snapshot" eyebrow="Executive summary">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            <SummaryNavCard label="Pending Approvals" value={String(approvalStats.pending)} detail="Waiting on CEO decision" to="/approval" icon={<ShieldAlert size={18} />} />
            <SummaryNavCard label="Revenue" value={formatCurrency(money.metrics.currentMonthRevenue)} detail="Current month" to="/money" icon={<Banknote size={18} />} />
            <SummaryNavCard label="Profit" value={formatCurrency(money.metrics.profit)} detail={`${money.metrics.profitMargin.toFixed(1)}% margin`} to="/money" icon={<DollarSign size={18} />} />
            <SummaryNavCard label="Execution Queue" value={String(activeQueueItems.length)} detail="Active queue records" to="/execution-queue" icon={<ListChecks size={18} />} />
            <SummaryNavCard label="Capability Plans" value={String(capabilityPlanning.capabilityPlans.length)} detail={`${incompletePlans.length} need readiness work`} to="/capability-planning" icon={<Cpu size={18} />} />
            <SummaryNavCard label="Businesses" value={String(activeBusinesses.length)} detail="Active business records" to="/businesses" icon={<BriefcaseBusiness size={18} />} />
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Daily Briefing" eyebrow="Data-driven summary">
          <div className="space-y-3 text-sm leading-6 text-[#c3cbc7]">
            <p className="m-0">{approvalStats.pending} approval{approvalStats.pending === 1 ? '' : 's'} currently require CEO review.</p>
            <p className="m-0">{activeQueueItems.length} execution queue item{activeQueueItems.length === 1 ? '' : 's'} remain active; {blockedQueueItems.length} are blocked.</p>
            <p className="m-0">{incompletePlans.length} capability plan{incompletePlans.length === 1 ? '' : 's'} need infrastructure readiness work.</p>
            <p className="m-0">{activeBusinesses.length} active business record{activeBusinesses.length === 1 ? '' : 's'} are tracked locally.</p>
            <p className="m-0">Revenue is {formatCurrency(money.metrics.currentMonthRevenue)} and profit is {formatCurrency(money.metrics.profit)} for the current month.</p>
          </div>
          <div className="mt-4 border-t border-line pt-4 text-xs text-muted">
            {data.latestBriefing
              ? `Last generated ${new Date(data.latestBriefing.generatedAt).toLocaleString()}`
              : 'No saved briefing yet. Use Run Daily Briefing to save a local briefing snapshot.'}
          </div>
        </Section>

        <Section title="Awaiting AI / System Work" eyebrow="No autonomous execution yet">
          <div className="grid gap-3 sm:grid-cols-2">
            <SystemWorkItem label="Ready for future execution" value={readyQueueItems.length} copy="Queue items marked Ready." />
            <SystemWorkItem label="Waiting on infrastructure" value={incompletePlans.length} copy="Capability plans still missing requirements." />
            <SystemWorkItem label="Waiting on approval" value={approvalStats.pending} copy="Approval Queue records awaiting CEO decision." />
            <SystemWorkItem label="Autonomous AI running" value={0} copy="No autonomous AI work is running yet." />
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Section title="Quick Actions" eyebrow="Start a workflow">
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton to="/opportunities" icon={<Lightbulb size={16} />} label="New Opportunity" helper="Open the Opportunity Pipeline creation workflow." />
            <ActionButton to="/businesses" icon={<BriefcaseBusiness size={16} />} label="New Business" helper="Open the Business Manager creation workflow." />
            <ActionButton to="/work-items" icon={<ListChecks size={16} />} label="New Work Item" helper="Open the Work Items creation workflow." />
            <button onClick={runBriefing} className="rounded-xl border border-lime/30 bg-lime/10 p-4 text-left transition hover:border-lime/60 hover:bg-lime/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime/70">
              <span className="flex items-center gap-2 text-sm font-semibold text-lime"><Sparkles size={16} /> Run Daily Briefing</span>
              <span className="mt-2 block text-xs leading-5 text-[#aeb8b3]">Save a fresh local briefing snapshot.</span>
            </button>
          </div>
        </Section>

        <Section title="Operations Health" eyebrow="System modules">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryNavCard label="Operators" value={String(registeredOperators.length)} detail={`${nonIdleOperators} active/waiting states`} to="/operators" icon={<Network size={18} />} />
            <SummaryNavCard label="Projects" value={String(activeProjects.length)} detail="Planning, active, or on hold" to="/projects" icon={<FileText size={18} />} />
            <SummaryNavCard label="Memory" value={String(memoryStore.memoryEntries.filter((entry) => !entry.archived).length)} detail="Active memory entries" to="/memory" icon={<Sparkles size={18} />} />
            <SummaryNavCard label="Roadmap" value={String(roadmap.backlogCount)} detail="Open roadmap backlog" to="/roadmap" icon={<Map size={18} />} />
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Section title="Recent Activity" eyebrow="Latest local changes">
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <NavigationCard key={item.id} to={item.to} ariaLabel={`Open ${item.title}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="m-0 mt-1 text-xs text-muted">{item.meta}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted">{formatShortDate(item.createdAt)}</span>
                  </div>
                </NavigationCard>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No recent activity yet." copy="Local record updates will appear here as the operating system is used." />
          )}
        </Section>

        <Section title="Alerts / Upcoming Work" eyebrow="Exceptions and time-sensitive records">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <NavigationCard key={alert.id} to={alert.to} ariaLabel={`Open alert ${alert.title}`}>
                  <div className="flex gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ffcc66]" />
                    <div>
                      <p className="m-0 text-sm font-semibold text-white">{alert.title}</p>
                      <p className="m-0 mt-1 text-xs leading-5 text-muted">{alert.why}</p>
                    </div>
                  </div>
                </NavigationCard>
              ))}
            </div>
          ) : (
            <EmptyPanel title="No urgent alerts." copy="No tracked local records currently indicate an urgent exception." />
          )}
        </Section>
      </div>
    </div>
  )
}

function buildAttentionActions({
  pendingApprovals,
  blockedQueueItems,
  blockedPlans,
  incompletePlans,
  blockedWorkItems,
}: {
  pendingApprovals: Approval[]
  blockedQueueItems: ReturnType<typeof useExecutionQueueStore>['queueItems']
  blockedPlans: ReturnType<typeof useCapabilityPlanningStore>['capabilityPlans']
  incompletePlans: ReturnType<typeof useCapabilityPlanningStore>['capabilityPlans']
  blockedWorkItems: ReturnType<typeof useWorkItemStore>['workItems']
}): AttentionAction[] {
  return [
    ...pendingApprovals.map((approval) => ({
      id: `approval-${approval.id}`,
      severity: approval.priority === 'Critical' ? 'Critical' as const : approval.priority === 'High' ? 'High' as const : 'Medium' as const,
      title: approval.title,
      why: 'This approval requires a human CEO decision before the related work should proceed.',
      blocked: approval.sourceQueueCode ? `${approval.sourceQueueCode} or related approval workflow` : 'Approval Queue decision',
      to: '/approval',
    })),
    ...blockedQueueItems.map((item) => ({
      id: `queue-${item.id}`,
      severity: 'High' as const,
      title: `${item.queueId}: ${item.workItemTitle}`,
      why: 'This queue item is blocked and cannot progress toward future execution.',
      blocked: 'Execution Queue',
      to: `/execution-queue/${item.id}`,
    })),
    ...blockedPlans.map((plan) => ({
      id: `blocked-plan-${plan.id}`,
      severity: 'High' as const,
      title: `${plan.capabilityPlanId}: capability plan blocked`,
      why: 'Infrastructure planning is blocked before future execution can be considered.',
      blocked: plan.sourceQueueCode,
      to: `/capability-planning/${plan.id}`,
    })),
    ...incompletePlans
      .filter((plan) => plan.readinessStatus !== 'Blocked')
      .map((plan) => ({
        id: `plan-${plan.id}`,
        severity: plan.missingRequirements.length >= 4 ? 'Medium' as const : 'Low' as const,
        title: `${plan.capabilityPlanId}: ${plan.missingRequirements.length} readiness item${plan.missingRequirements.length === 1 ? '' : 's'} missing`,
        why: 'Capability requirements must be clear before future infrastructure approval.',
        blocked: plan.sourceQueueCode,
        to: `/capability-planning/${plan.id}`,
      })),
    ...blockedWorkItems.map((item) => ({
      id: `work-${item.id}`,
      severity: item.priority === 'Critical' ? 'Critical' as const : item.priority === 'High' ? 'High' as const : 'Medium' as const,
      title: `${item.workItemId}: ${item.title}`,
      why: 'This Work Item is marked blocked and needs a decision or missing context.',
      blocked: item.projectCode,
      to: `/work-items/${item.id}`,
    })),
  ].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
}

function buildRecentActivity({
  approvals,
  capabilityPlans,
  queueItems,
  workItems,
  projects,
  businesses,
  memories,
}: {
  approvals: Approval[]
  capabilityPlans: ReturnType<typeof useCapabilityPlanningStore>['capabilityPlans']
  queueItems: ReturnType<typeof useExecutionQueueStore>['queueItems']
  workItems: ReturnType<typeof useWorkItemStore>['workItems']
  projects: ReturnType<typeof useProjectStore>['projects']
  businesses: ReturnType<typeof useBusinessStore>['businesses']
  memories: ReturnType<typeof useMemoryStore>['memoryEntries']
}): ActivityItem[] {
  return [
    ...approvals.map((approval) => ({
      id: `approval-${approval.id}`,
      title: approval.title,
      meta: `Approval · ${approval.status} · ${getApprovalDecisionLabel(approval)}`,
      createdAt: approval.updated,
      to: '/approval',
    })),
    ...capabilityPlans.map((plan) => ({
      id: `capability-${plan.id}`,
      title: `${plan.capabilityPlanId}: ${plan.workItemTitle}`,
      meta: `Capability Planning · ${plan.readinessStatus}`,
      createdAt: plan.updatedAt,
      to: `/capability-planning/${plan.id}`,
    })),
    ...queueItems.map((item) => ({
      id: `queue-${item.id}`,
      title: `${item.queueId}: ${item.workItemTitle}`,
      meta: `Execution Queue · ${item.queueStatus}`,
      createdAt: item.updatedAt,
      to: `/execution-queue/${item.id}`,
    })),
    ...workItems.map((item) => ({
      id: `work-${item.id}`,
      title: `${item.workItemId}: ${item.title}`,
      meta: `Work Item · ${item.status}`,
      createdAt: item.updatedAt,
      to: `/work-items/${item.id}`,
    })),
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      title: `${project.projectId}: ${project.name}`,
      meta: `Project · ${project.status}`,
      createdAt: project.updatedAt,
      to: `/projects/${project.id}`,
    })),
    ...businesses.map((business) => ({
      id: `business-${business.id}`,
      title: `${business.businessId}: ${business.name}`,
      meta: `Business · ${business.status}`,
      createdAt: business.updatedAt,
      to: `/businesses/${business.id}`,
    })),
    ...memories.map((memory) => ({
      id: `memory-${memory.id}`,
      title: memory.title,
      meta: `Memory · ${memory.type}`,
      createdAt: memory.updatedAt,
      to: '/memory',
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
}

function buildAlerts({
  deferredApprovals,
  incompletePlans,
  blockedQueueItems,
  dueWorkItems,
}: {
  deferredApprovals: Approval[]
  incompletePlans: ReturnType<typeof useCapabilityPlanningStore>['capabilityPlans']
  blockedQueueItems: ReturnType<typeof useExecutionQueueStore>['queueItems']
  dueWorkItems: ReturnType<typeof useWorkItemStore>['workItems']
}): AttentionAction[] {
  return [
    ...blockedQueueItems.map((item) => ({
      id: `alert-queue-${item.id}`,
      severity: 'High' as const,
      title: `${item.queueId} is blocked`,
      why: item.workItemTitle,
      blocked: 'Execution Queue',
      to: `/execution-queue/${item.id}`,
    })),
    ...deferredApprovals.map((approval) => ({
      id: `alert-approval-${approval.id}`,
      severity: 'Medium' as const,
      title: `Deferred approval: ${approval.title}`,
      why: 'Deferred decisions may need future CEO review.',
      blocked: 'Approval Queue',
      to: '/approval',
    })),
    ...incompletePlans.slice(0, 4).map((plan) => ({
      id: `alert-plan-${plan.id}`,
      severity: 'Medium' as const,
      title: `${plan.capabilityPlanId} is not ready`,
      why: `${plan.missingRequirements.length} infrastructure requirement${plan.missingRequirements.length === 1 ? '' : 's'} missing.`,
      blocked: plan.sourceQueueCode,
      to: `/capability-planning/${plan.id}`,
    })),
    ...dueWorkItems.map((item) => ({
      id: `alert-due-${item.id}`,
      severity: 'Low' as const,
      title: `${item.workItemId} due ${item.dueDate}`,
      why: item.title,
      blocked: item.projectCode,
      to: `/work-items/${item.id}`,
    })),
  ].slice(0, 6)
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h3 className="m-0 font-display text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function NavigationCard({ to, ariaLabel, children }: { to: string; ariaLabel: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      onKeyDown={(event: KeyboardEvent<HTMLAnchorElement>) => {
        if (event.key === ' ') {
          event.preventDefault()
          event.currentTarget.click()
        }
      }}
      className="block cursor-pointer rounded-xl border border-line bg-ink/35 p-4 transition hover:border-lime/35 hover:bg-white/[0.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime/70"
    >
      {children}
    </Link>
  )
}

function SummaryNavCard({ label, value, detail, to, icon }: { label: string; value: string; detail: string; to: string; icon: ReactNode }) {
  return (
    <NavigationCard to={to} ariaLabel={`Open ${label} in ${destinationName(to)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">{label}</p>
          <p className="m-0 font-display text-2xl font-semibold text-white">{value}</p>
          <p className="m-0 mt-1 text-xs leading-5 text-muted">{detail}</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">{icon}</div>
      </div>
    </NavigationCard>
  )
}

function ActionButton({ to, icon, label, helper }: { to: string; icon: ReactNode; label: string; helper: string }) {
  return (
    <Link to={to} className="rounded-xl border border-lime/30 bg-lime/10 p-4 transition hover:border-lime/60 hover:bg-lime/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime/70">
      <span className="flex items-center gap-2 text-sm font-semibold text-lime">{icon}{label}</span>
      <span className="mt-2 block text-xs leading-5 text-[#aeb8b3]">{helper}</span>
    </Link>
  )
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = {
    Critical: 'border-red-400/30 bg-red-400/10 text-red-200',
    High: 'border-[#ff9e8f]/30 bg-[#ff9e8f]/10 text-[#ffb8ad]',
    Medium: 'border-[#ffcc66]/30 bg-[#ffcc66]/10 text-[#ffdc8f]',
    Low: 'border-lime/30 bg-lime/10 text-lime',
  }[severity]
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${styles}`}>{severity}</span>
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warning' | 'neutral' }) {
  const dot = tone === 'good' ? 'bg-lime shadow-[0_0_10px_#c8f560]' : tone === 'warning' ? 'bg-[#ff9e8f]' : 'bg-[#ffcc66]'
  return (
    <div className="rounded-xl border border-line bg-ink/45 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 flex items-center gap-2 text-sm font-semibold text-white"><span className={`h-2 w-2 rounded-full ${dot}`} />{value}</p>
    </div>
  )
}

function SystemWorkItem({ label, value, copy }: { label: string; value: number; copy: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="m-0 mt-2 text-xs leading-5 text-muted">{copy}</p>
    </div>
  )
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-lime/10 text-lime">
        <Check size={16} />
      </div>
      <h4 className="m-0 text-sm font-semibold text-white">{title}</h4>
      <p className="m-0 mt-2 text-xs leading-5 text-muted">{copy}</p>
    </div>
  )
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

function destinationName(to: string) {
  if (to === '/approval') return 'Approval Queue'
  if (to === '/money') return 'Money'
  if (to === '/execution-queue') return 'Execution Queue'
  if (to === '/capability-planning') return 'Capability Planning'
  if (to === '/businesses') return 'Businesses'
  return 'module'
}
