import { ArrowLeft, ClipboardList, FileWarning, History, Link2, ScrollText } from 'lucide-react'
import { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { SectionHeader } from '@/components/SectionHeader'
import { StatusBadge, statusTone } from '@/components/StatusBadge'
import { auditCompleteness, costDelta, useExecutionStore } from '@/src/core/execution'

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

export function ExecutionDetailPage() {
  const { executionId } = useParams()
  const executionStore = useExecutionStore()
  const execution = executionStore.executions.find((record) => record.id === executionId || record.executionId === executionId)
  const readiness = execution ? executionStore.evaluateReadiness(execution.id) : undefined

  if (!execution) {
    return (
      <div className="space-y-6">
        <Link to="/executions" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Execution Dashboard
        </Link>
        <section className="panel">
          <EmptyState
            icon={FileWarning}
            title="Execution record not found"
            copy="The requested execution ID does not exist in the local Execution Store. The record may have been removed or the link may be stale."
            action={<Link to="/executions" className="btn-primary">Open Execution Dashboard</Link>}
          />
        </section>
      </div>
    )
  }

  const pauseResumeHistory = execution.transitionHistory.filter((item) => item.toStatus === 'Paused' || item.fromStatus === 'Paused')
  const requestLifecycleHistory = execution.requestLifecycle?.history ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link to="/executions" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Execution Dashboard
        </Link>
        <p className="eyebrow mb-2">Execution Detail · {execution.executionId}</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{execution.workItem.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">
              Read-only inspection of lifecycle, references, readiness, costs, logs, retries, failures, and result state. This page does not execute work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={execution.status} tone={statusTone(execution.status)} />
            {execution.status === 'Requires Human Intervention' ? <StatusBadge label="Human Intervention" tone="danger" /> : null}
            {execution.failures.length > 0 ? <StatusBadge label="Failure History" tone="danger" /> : null}
          </div>
        </div>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Identity</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Execution infrastructure record</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Info label="Execution ID" value={execution.executionId} />
          <Info label="Work Item" value={`${execution.workItem.workItemId} · ${execution.workItem.title}`} />
          <Info label="Source" value={execution.queueItem?.queueId ?? execution.executionRequest?.requestId ?? execution.sourceType} />
          <Info label="Created" value={formatDate(execution.createdAt)} />
          <Info label="Updated" value={formatDate(execution.updatedAt)} />
          <Info label="Execution Type" value={execution.executionType} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Section title="Lifecycle" eyebrow="State and timing">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Current State" value={execution.status} />
              <Info label="Request Lifecycle" value={execution.requestLifecycle?.status ?? 'Not established'} />
              <Info label="Prepared" value={formatDate(execution.timing.preparedAt)} />
              <Info label="Ready" value={formatDate(execution.timing.readyAt)} />
              <Info label="Started" value={formatDate(execution.timing.startedAt)} />
              <Info label="Paused" value={formatDate(execution.timing.pausedAt)} />
              <Info label="Completed" value={formatDate(execution.timing.completedAt)} />
              <Info label="Failed" value={formatDate(execution.timing.failedAt)} />
              <Info label="Cancelled" value={formatDate(execution.timing.cancelledAt)} />
            </div>
          </Section>

          <Section title="Readiness and Governance" eyebrow="Capability and approval">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Info label="Capability Plan" value={execution.capabilityPlan?.capabilityPlanId || 'Missing'} />
              <Info label="Capability Readiness" value={execution.capabilityPlan?.readinessStatus || 'Missing'} />
              <Info label="Approval Record" value={execution.approval?.approvalId || 'Missing'} />
              <Info label="Approval Decision" value={execution.approval?.decision || execution.approval?.status || 'Missing'} />
              <Info label="Approval Timestamp" value={formatDate(execution.approval?.decidedAt)} />
              <Info label="Human Intervention" value={execution.status === 'Requires Human Intervention' ? 'Required' : 'Not required'} />
              <Info label="Estimated Cost" value={formatMoney(execution.estimatedCost)} />
              <Info label="Actual Cost" value={formatMoney(execution.actualCost)} />
              <Info label="Cost Variance" value={formatMoney(costDelta(execution))} />
              <Info label="Audit Health" value={auditCompleteness(execution)} />
            </div>

            {readiness?.blockers.length ? (
              <div className="mt-4 rounded-xl border border-[#ffcc66]/25 bg-[#ffcc66]/10 p-4">
                <p className="m-0 text-sm font-semibold text-[#ffdc8f]">Readiness blockers</p>
                <ul className="mt-3 space-y-2 pl-4 text-sm leading-6 text-muted">
                  {readiness.blockers.map((blocker) => (
                    <li key={`${blocker.code}-${blocker.message}`}>{blocker.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="m-0 mt-4 text-sm leading-6 text-muted">
                No readiness blockers are currently reported. This does not start execution.
              </p>
            )}
          </Section>

          <Section title="Execution Configuration" eyebrow="References only">
            <div className="grid gap-4 lg:grid-cols-3">
              <ReferenceList title="Capabilities" items={execution.selectedCapabilities.map((item) => `${item.name} · ${item.category}`)} empty="No capabilities linked." />
              <ReferenceList title="Tools" items={execution.selectedTools.map((item) => `${item.name} · ${item.category}`)} empty="No tools linked." />
              <ReferenceList title="Providers" items={execution.selectedProviders.map((item) => `${item.name} · ${item.category}`)} empty="No provider linked." />
            </div>
          </Section>

          <Section title="History and Audit" eyebrow="Local records">
            <div className="grid gap-4 lg:grid-cols-2">
              <Timeline title="Transition History" items={execution.transitionHistory.map((item) => ({
                id: item.id,
                title: `${item.fromStatus} → ${item.toStatus}`,
                meta: `${item.actor} · ${formatDate(item.createdAt)}`,
                copy: item.reason,
              }))} emptyTitle="No lifecycle transitions" emptyCopy="This execution has not moved beyond its initial state." />
              <Timeline title="Execution Request Lifecycle" items={requestLifecycleHistory.map((item) => ({
                id: item.id,
                title: `${item.fromStatus ?? 'Created'} → ${item.toStatus}`,
                meta: `${item.actor} · ${formatDate(item.createdAt)}`,
                copy: item.reason,
              }))} emptyTitle="No request lifecycle" emptyCopy="No Execution Request lifecycle has been established for this record." />
              <Timeline title="Pause / Resume History" items={pauseResumeHistory.map((item) => ({
                id: item.id,
                title: `${item.fromStatus} → ${item.toStatus}`,
                meta: `${item.actor} · ${formatDate(item.createdAt)}`,
                copy: item.reason,
              }))} emptyTitle="No pause or resume history" emptyCopy="This execution has not been paused or resumed." />
              <Timeline title="Retry History" items={execution.retryHistory.map((item) => ({
                id: item.id,
                title: `${item.retryId} · ${item.status}`,
                meta: `Attempt ${item.attemptNumber} · ${formatDate(item.createdAt)}`,
                copy: item.resultSummary || item.reason,
              }))} emptyTitle="No retries" emptyCopy="No retry records have been captured." />
              <Timeline title="Failure History" items={execution.failures.map((item) => ({
                id: item.id,
                title: `${item.failureId} · ${item.severity}`,
                meta: formatDate(item.createdAt),
                copy: item.resolutionNotes || item.cause || item.message,
              }))} emptyTitle="No failures" emptyCopy="No failure records have been captured." />
              <Timeline title="Execution Logs" items={execution.logs.map((item) => ({
                id: item.id,
                title: `${item.logId} · ${item.level}`,
                meta: `${item.source} · ${formatDate(item.createdAt)}`,
                copy: item.message,
                metadata: {
                  category: item.category,
                  ...item.metadata,
                },
              }))} emptyTitle="No logs" emptyCopy="No execution logs have been captured yet." />
              <Timeline title="Event History" items={execution.events.map((item) => ({
                id: item.id,
                title: item.eventType,
                meta: `${item.source} · ${formatDate(item.createdAt)}`,
                copy: item.message,
                metadata: item.metadata,
              }))} emptyTitle="No events" emptyCopy="No execution events have been captured." />
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Relationships" eyebrow="Source records">
            <div className="space-y-3">
              <Relationship label="Work Item" value={`${execution.workItem.workItemId} · ${execution.workItem.title}`} to={`/work-items/${execution.workItem.workItemRecordId}`} />
              {execution.queueItem ? (
                <Relationship label="Execution Queue Item" value={execution.queueItem.queueId} to={`/execution-queue/${execution.queueItem.queueRecordId}`} />
              ) : null}
              {execution.workOrder ? (
                <Relationship label="Work Order" value={`${execution.workOrder.workOrderId} · ${execution.workOrder.blueprintDeliverableName}`} to={`/work-items/${execution.workItem.workItemRecordId}`} />
              ) : null}
              {execution.executionRequest ? (
                <Relationship label="Execution Request" value={`${execution.executionRequest.requestId} · ${execution.executionRequest.requestedCapability}`} />
              ) : null}
              <Relationship label="Capability Plan" value={execution.capabilityPlan?.capabilityPlanId || 'Missing'} to={execution.capabilityPlan?.capabilityPlanRecordId ? `/capability-planning/${execution.capabilityPlan.capabilityPlanRecordId}` : undefined} />
              <Relationship label="Approval Record" value={execution.approval?.approvalId || 'Missing'} to={execution.approval ? '/approval' : undefined} />
            </div>
          </Section>

          <Section title="Cost References" eyebrow="Attempt-level records">
            {execution.costRecords.length > 0 ? (
              <div className="space-y-3">
                {execution.costRecords.map((record) => (
                  <div key={record.id} className="rounded-xl border border-line bg-ink/35 p-3">
                    <p className="m-0 text-sm font-semibold text-white">{record.costRecordId} · {record.kind}</p>
                    <p className="m-0 mt-1 text-xs text-muted">{formatMoney(record.amount)} {record.currency} · {formatDate(record.createdAt)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge label={record.category} tone="neutral" />
                      <StatusBadge label={record.status} tone={record.status === 'Reconciled' ? 'good' : 'neutral'} />
                    </div>
                    <p className="m-0 mt-1 text-xs text-muted">Recorded by {record.recordedBy}</p>
                    {(record.providerId || record.toolId || record.approvalId) ? (
                      <p className="m-0 mt-1 text-xs text-muted">
                        {record.providerId ? `Provider ${record.providerId}` : ''}
                        {record.providerId && (record.toolId || record.approvalId) ? ' Â· ' : ''}
                        {record.toolId ? `Tool ${record.toolId}` : ''}
                        {record.toolId && record.approvalId ? ' Â· ' : ''}
                        {record.approvalId ? `Approval ${record.approvalId}` : ''}
                      </p>
                    ) : null}
                    <p className="m-0 mt-2 text-sm leading-6 text-muted">{record.notes || 'No cost note recorded.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={ScrollText} title="No cost records" copy="Estimated and actual cost records will appear here when recorded by the Execution Core." />
            )}
          </Section>

          <Section title="Result Reference" eyebrow="Outcome placeholder">
            {execution.result ? (
              <div className="rounded-xl border border-line bg-ink/35 p-4">
                <p className="m-0 text-sm font-semibold text-white">{execution.result.resultId} · {execution.result.status}</p>
                <p className="m-0 mt-2 text-sm leading-6 text-muted">{execution.result.summary}</p>
                <p className="m-0 mt-3 text-xs text-muted">Updated {formatDate(execution.result.updatedAt)}</p>
              </div>
            ) : (
              <EmptyState icon={ScrollText} title="No result yet" copy="No result has been recorded. Task 5 remains inspection-only and does not produce execution output." />
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <SectionHeader eyebrow={eyebrow} title={title} />
      {children}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value || 'Unassigned'}</p>
    </div>
  )
}

function Relationship({ label, value, to }: { label: string; value: string; to?: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value}</p>
      {to ? (
        <Link to={to} className="btn-secondary mt-3 inline-flex items-center gap-2">
          <Link2 size={13} /> Open
        </Link>
      ) : (
        <p className="m-0 mt-3 text-xs text-muted">Reference missing or no dedicated detail route exists.</p>
      )}
    </div>
  )
}

function ReferenceList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="m-0 text-sm font-semibold text-white">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 pl-4 text-sm leading-6 text-muted">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <p className="m-0 mt-3 text-sm leading-6 text-muted">{empty}</p>
      )}
    </div>
  )
}

function formatMetadata(metadata?: Record<string, string | number | boolean | null>) {
  if (!metadata) return []

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== '')
    .map(([key, value]) => `${key}: ${String(value)}`)
}

function Timeline({ title, items, emptyTitle, emptyCopy }: { title: string; items: Array<{ id: string; title: string; meta: string; copy: string; metadata?: Record<string, string | number | boolean | null> }>; emptyTitle: string; emptyCopy: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-4">
      <div className="mb-3 flex items-center gap-2">
        <History size={14} className="text-muted" />
        <p className="m-0 text-sm font-semibold text-white">{title}</p>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-line bg-panel/50 p-3">
              <p className="m-0 text-sm font-semibold text-white">{item.title}</p>
              <p className="m-0 mt-1 text-[11px] text-muted">{item.meta}</p>
              <p className="m-0 mt-2 text-sm leading-6 text-muted">{item.copy}</p>
              {formatMetadata(item.metadata).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formatMetadata(item.metadata).map((entry) => (
                    <span key={entry} className="rounded-full border border-line bg-ink/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {entry}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={History} title={emptyTitle} copy={emptyCopy} />
      )}
    </div>
  )
}
