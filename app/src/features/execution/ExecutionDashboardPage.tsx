import { AlertTriangle, CircleDollarSign, ClipboardList, Clock, ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PageIntro } from '@/components/PageIntro'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge, statusTone } from '@/components/StatusBadge'
import { SummaryCard } from '@/components/SummaryCard'
import {
  ExecutionRecord,
  ExecutionStatus,
  auditCompleteness,
  costDelta,
  executionStatuses,
  useExecutionStore,
} from '@/src/core/execution'

type ApprovalFilter = 'All' | 'Missing' | 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested' | 'Deferred' | 'Archived'
type ReadinessFilter = 'All' | 'Capability Ready' | 'Capability Missing' | 'Approval Ready' | 'Approval Missing'
type BooleanFilter = 'All' | 'Yes' | 'No'
type SortMode = 'Updated' | 'Oldest Waiting' | 'Retry Count' | 'Estimated Cost' | 'Actual Cost'

function formatDate(value?: string) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function isHumanIntervention(execution: ExecutionRecord) {
  return execution.status === 'Requires Human Intervention'
}

function isFailed(execution: ExecutionRecord) {
  return execution.status === 'Failed' || execution.failures.length > 0
}

function isCompleted(execution: ExecutionRecord) {
  return execution.status === 'Completed'
}

function isLongRunningOrPaused(execution: ExecutionRecord) {
  if (execution.status === 'Paused') return true
  if (execution.status !== 'Running' || !execution.timing.startedAt) return false

  const startedAt = new Date(execution.timing.startedAt).getTime()
  if (!Number.isFinite(startedAt)) return false

  return Date.now() - startedAt > 1000 * 60 * 60 * 24
}

function approvalStatus(execution: ExecutionRecord) {
  return execution.approval?.status || 'Missing'
}

function capabilityReady(execution: ExecutionRecord) {
  return execution.capabilityPlan?.readinessStatus === 'Approved'
}

function waitingOnCEO(execution: ExecutionRecord) {
  return execution.status === 'Awaiting Approval' || approvalStatus(execution) === 'Pending'
}

function sortExecutions(executions: ExecutionRecord[], sort: SortMode) {
  return [...executions].sort((a, b) => {
    if (sort === 'Oldest Waiting') {
      const waitingA = ['Awaiting Capability Review', 'Awaiting Approval', 'Requires Human Intervention'].includes(a.status)
      const waitingB = ['Awaiting Capability Review', 'Awaiting Approval', 'Requires Human Intervention'].includes(b.status)
      if (waitingA !== waitingB) return waitingA ? -1 : 1
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    }

    if (sort === 'Retry Count') return b.retryHistory.length - a.retryHistory.length
    if (sort === 'Estimated Cost') return b.estimatedCost - a.estimatedCost
    if (sort === 'Actual Cost') return b.actualCost - a.actualCost

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

export function ExecutionDashboardPage() {
  const { executions } = useExecutionStore()
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'All'>('All')
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>('All')
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('All')
  const [failedFilter, setFailedFilter] = useState<BooleanFilter>('All')
  const [humanFilter, setHumanFilter] = useState<BooleanFilter>('All')
  const [completedFilter, setCompletedFilter] = useState<BooleanFilter>('All')
  const [sort, setSort] = useState<SortMode>('Updated')

  const stats = useMemo(() => ({
    total: executions.length,
    awaitingCEO: executions.filter(waitingOnCEO).length,
    failed: executions.filter(isFailed).length,
    longRunning: executions.filter(isLongRunningOrPaused).length,
    recentCompletions: executions.filter((execution) => {
      if (!execution.timing.completedAt) return false
      const completedAt = new Date(execution.timing.completedAt).getTime()
      return Number.isFinite(completedAt) && Date.now() - completedAt < 1000 * 60 * 60 * 24 * 7
    }).length,
    estimatedCost: executions.reduce((total, execution) => total + execution.estimatedCost, 0),
    actualCost: executions.reduce((total, execution) => total + execution.actualCost, 0),
    costVariance: executions.reduce((total, execution) => total + costDelta(execution), 0),
    auditComplete: executions.filter((execution) => auditCompleteness(execution) === 'Complete').length,
  }), [executions])

  const filteredExecutions = useMemo(() => {
    const filtered = executions.filter((execution) => {
      if (statusFilter !== 'All' && execution.status !== statusFilter) return false
      if (approvalFilter !== 'All' && approvalStatus(execution) !== approvalFilter) return false
      if (readinessFilter === 'Capability Ready' && !capabilityReady(execution)) return false
      if (readinessFilter === 'Capability Missing' && execution.capabilityPlan) return false
      if (readinessFilter === 'Approval Ready' && approvalStatus(execution) !== 'Approved') return false
      if (readinessFilter === 'Approval Missing' && execution.approval) return false
      if (failedFilter !== 'All' && (isFailed(execution) ? 'Yes' : 'No') !== failedFilter) return false
      if (humanFilter !== 'All' && (isHumanIntervention(execution) ? 'Yes' : 'No') !== humanFilter) return false
      if (completedFilter !== 'All' && (isCompleted(execution) ? 'Yes' : 'No') !== completedFilter) return false
      return true
    })

    return sortExecutions(filtered, sort)
  }, [approvalFilter, completedFilter, executions, failedFilter, humanFilter, readinessFilter, sort, statusFilter])

  return (
    <div className="space-y-7">
      <PageIntro
        eyebrow="Sprint 012"
        title="Execution Dashboard"
        description="Inspect local Execution Core records, lifecycle state, readiness, costs, logs, retries, failures, and source relationships. This workspace is read-only and does not execute work."
        action={<Link to="/execution-queue" className="btn-secondary">Open Execution Queue</Link>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Executions" value={stats.total} helper="Execution Core records" />
        {executionStatuses.map((status) => (
          <SummaryCard key={status} label={status} value={executions.filter((execution) => execution.status === status).length} helper="Lifecycle state" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <SummaryCard label="CEO Action" value={stats.awaitingCEO} helper="Awaiting approval" icon={<ClipboardList size={16} />} />
        <SummaryCard label="Failed" value={stats.failed} helper="Failed or has failures" icon={<AlertTriangle size={16} />} />
        <SummaryCard label="Long / Paused" value={stats.longRunning} helper="Running over 24h or paused" icon={<Clock size={16} />} />
        <SummaryCard label="Recent Completions" value={stats.recentCompletions} helper="Completed in 7 days" />
        <SummaryCard label="Estimated Cost" value={formatMoney(stats.estimatedCost)} helper="Execution estimates" icon={<CircleDollarSign size={16} />} />
        <SummaryCard label="Actual Cost" value={formatMoney(stats.actualCost)} helper="Recorded actuals" icon={<CircleDollarSign size={16} />} />
        <SummaryCard label="Cost Variance" value={formatMoney(stats.costVariance)} helper="Actual minus estimate" icon={<CircleDollarSign size={16} />} />
        <SummaryCard label="Audit Complete" value={stats.auditComplete} helper="Costs, logs, events" />
      </div>

      <section className="panel p-5">
        <SectionHeader
          eyebrow="Local filters"
          title="Execution Records"
          description="Filter and inspect persisted execution records without changing lifecycle state."
          action={<ListFilter size={18} className="text-muted" />}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Select label="Lifecycle" value={statusFilter} onChange={(value) => setStatusFilter(value as ExecutionStatus | 'All')} options={['All', ...executionStatuses]} />
          <Select label="Approval" value={approvalFilter} onChange={(value) => setApprovalFilter(value as ApprovalFilter)} options={['All', 'Missing', 'Pending', 'Approved', 'Rejected', 'Changes Requested', 'Deferred', 'Archived']} />
          <Select label="Readiness" value={readinessFilter} onChange={(value) => setReadinessFilter(value as ReadinessFilter)} options={['All', 'Capability Ready', 'Capability Missing', 'Approval Ready', 'Approval Missing']} />
          <Select label="Failed" value={failedFilter} onChange={(value) => setFailedFilter(value as BooleanFilter)} options={['All', 'Yes', 'No']} />
          <Select label="Human Review" value={humanFilter} onChange={(value) => setHumanFilter(value as BooleanFilter)} options={['All', 'Yes', 'No']} />
          <Select label="Completed" value={completedFilter} onChange={(value) => setCompletedFilter(value as BooleanFilter)} options={['All', 'Yes', 'No']} />
          <Select label="Sort" value={sort} onChange={(value) => setSort(value as SortMode)} options={['Updated', 'Oldest Waiting', 'Retry Count', 'Estimated Cost', 'Actual Cost']} />
        </div>

        <div className="mt-5">
          {executions.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No execution records yet"
              copy="Create an Execution Record from an Execution Queue detail page. Execution records are infrastructure only and do not run work."
              action={<Link to="/execution-queue" className="btn-primary">Open Execution Queue</Link>}
            />
          ) : filteredExecutions.length === 0 ? (
            <EmptyState
              icon={ListFilter}
              title="No executions match these filters"
              copy="Adjust lifecycle, readiness, approval, failure, or sorting filters to inspect a different slice of local execution records."
            />
          ) : (
            <div className="grid gap-4">
              {filteredExecutions.map((execution) => (
                <ExecutionListCard key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function ExecutionListCard({ execution }: { execution: ExecutionRecord }) {
  return (
    <article className="record-card">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{execution.executionId} · {execution.queueItem.queueId}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{execution.workItem.title}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            {execution.workItem.workItemId} · {execution.projectCode} · {execution.businessCode}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={execution.status} tone={statusTone(execution.status)} />
          {isHumanIntervention(execution) ? <StatusBadge label="Human Intervention" tone="danger" /> : null}
          {isFailed(execution) ? <StatusBadge label="Failure" tone="danger" /> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Info label="Capability Plan" value={execution.capabilityPlan?.capabilityPlanId || 'Missing'} />
        <Info label="Approval" value={approvalStatus(execution)} />
        <Info label="Retry Count" value={String(execution.retryHistory.length)} />
        <Info label="Estimated Cost" value={formatMoney(execution.estimatedCost)} />
        <Info label="Actual Cost" value={formatMoney(execution.actualCost)} />
        <Info label="Cost Variance" value={formatMoney(costDelta(execution))} />
        <Info label="Audit Health" value={auditCompleteness(execution)} />
        <Info label="Updated" value={formatDate(execution.updatedAt)} />
        <Info label="Provider" value={execution.selectedProviders[0]?.name || 'Not assigned'} />
        <Info label="Tools" value={execution.selectedTools.length ? `${execution.selectedTools.length} linked` : 'Not assigned'} />
        <Info label="Created" value={formatDate(execution.createdAt)} />
        <Info label="Result" value={execution.resultRef || 'No result'} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/executions/${execution.id}`} className="btn-primary">Open Execution</Link>
        <Link to={`/execution-queue/${execution.queueItem.queueRecordId}`} className="btn-secondary">Open Queue Item</Link>
        <Link to={`/work-items/${execution.workItem.workItemRecordId}`} className="btn-secondary">Open Work Item</Link>
      </div>
    </article>
  )
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 truncate text-sm font-semibold text-white">{value || 'Unassigned'}</p>
    </div>
  )
}
