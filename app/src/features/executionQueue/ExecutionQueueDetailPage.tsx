import { ArrowLeft, Check, ClipboardList, Cpu, ShieldCheck } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useCapabilityPlanningStore } from '@/src/core/capabilityPlanning'
import { useExecutionStore } from '@/src/core/execution'
import {
  ExecutionQueuePriority,
  ExecutionQueueRecord,
  ExecutionQueueStatus,
  ExecutionType,
  executionQueuePriorities,
  executionQueueStatuses,
  executionTypes,
  useExecutionQueueStore,
} from '@/src/core/executionQueue'
import { CapabilityPlanForm } from '@/src/features/capabilityPlanning/components/CapabilityPlanForm'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatOptionalDate(value?: string) {
  return value ? formatDate(value) : 'Not recorded'
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export function ExecutionQueueDetailPage() {
  const { queueItemId } = useParams()
  const executionQueue = useExecutionQueueStore()
  const capabilityPlanning = useCapabilityPlanningStore()
  const executionCore = useExecutionStore()
  const queueItem = executionQueue.queueItems.find((item) => item.id === queueItemId || item.queueId === queueItemId)
  const capabilityPlan = queueItem ? capabilityPlanning.capabilityPlans.find((plan) => plan.sourceQueueItemId === queueItem.id) : undefined
  const execution = queueItem ? executionCore.executions.find((record) => record.queueItem?.queueRecordId === queueItem.id) : undefined
  const readiness = execution ? executionCore.evaluateReadiness(execution.id) : undefined
  const [draft, setDraft] = useState<ExecutionQueueRecord | undefined>(queueItem)
  const [showCapabilityPlanForm, setShowCapabilityPlanForm] = useState(false)

  useEffect(() => {
    setDraft(queueItem)
  }, [queueItem])

  if (!queueItem || !draft) {
    return <Navigate to="/execution-queue" replace />
  }

  function save(queueRecord: ExecutionQueueRecord, draftRecord: ExecutionQueueRecord) {
    executionQueue.updateQueueItem(queueRecord.id, {
      queueStatus: draftRecord.queueStatus,
      priority: draftRecord.priority,
      executionType: draftRecord.executionType,
      requiresApproval: draftRecord.requiresApproval,
      notes: draftRecord.notes,
    })
  }

  function createCapabilityPlan(queueRecord: ExecutionQueueRecord) {
    const plan = capabilityPlanning.createCapabilityPlanFromQueueItem(queueRecord)
    setShowCapabilityPlanForm(false)
    return plan
  }

  function createExecutionRecord(queueRecord: ExecutionQueueRecord) {
    executionCore.createExecutionFromQueueItem(queueRecord)
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/execution-queue" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Execution Queue
        </Link>
        <p className="eyebrow mb-2">Execution Queue Detail · {queueItem.queueId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{queueItem.workItemTitle}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">
          Queue record created from {queueItem.sourceWorkItemId}. This record does not execute work.
        </p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Future execution preparation record</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Queue ID" value={queueItem.queueId} />
          <Info label="Source Work Item" value={queueItem.sourceWorkItemId} />
          <Info label="Status" value={queueItem.queueStatus} />
          <Info label="Priority" value={queueItem.priority} />
          <Info label="Execution Type" value={queueItem.executionType} />
          <Info label="Approval" value={queueItem.requiresApproval ? 'Required' : 'Not required'} />
          <Info label="Updated" value={formatDate(queueItem.updatedAt)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Queue Controls" eyebrow="Editable record">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
                <select value={draft.queueStatus} onChange={(event) => setDraft({ ...draft, queueStatus: event.target.value as ExecutionQueueStatus })} className="field">
                  {executionQueueStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as ExecutionQueuePriority })} className="field">
                  {executionQueuePriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Execution Type</span>
                <select value={draft.executionType} onChange={(event) => setDraft({ ...draft, executionType: event.target.value as ExecutionType })} className="field">
                  {executionTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-line bg-ink/35 p-4">
                <input type="checkbox" checked={draft.requiresApproval} onChange={(event) => setDraft({ ...draft, requiresApproval: event.target.checked })} />
                <span className="text-sm font-semibold text-white">Requires Approval</span>
              </label>
            </div>
          </Section>

          <Section title="Notes" eyebrow="Queue context">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={() => save(queueItem, draft)} className="btn-primary mt-4">Save Queue Item</button>
          </Section>

          <Section title="Capability Requirements" eyebrow="Sprint 009 infrastructure planning">
            {capabilityPlan ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <Info label="Readiness" value={capabilityPlan.readinessStatus} />
                  <Info label="Estimated Cost" value={new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(capabilityPlan.estimatedCost)} />
                  <Info label="Runtime" value={`${capabilityPlan.estimatedRuntimeMinutes} min`} />
                  <Info label="Missing" value={String(capabilityPlan.missingRequirements.length)} />
                </div>
                <p className="m-0 text-sm leading-6 text-muted">
                  Capability planning identifies required providers, tools, permissions, operators, cost, and runtime. It does not execute work.
                </p>
                <Link to={`/capability-planning/${capabilityPlan.id}`} className="btn-primary inline-flex items-center gap-2">
                  <Cpu size={14} /> Open Capability Plan
                </Link>
              </div>
            ) : showCapabilityPlanForm ? (
              <CapabilityPlanForm
                queueItem={queueItem}
                onCancel={() => setShowCapabilityPlanForm(false)}
                onCreate={() => createCapabilityPlan(queueItem)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
                <p className="m-0 text-sm leading-6 text-[#aeb8b3]">
                  No Capability Plan exists for this queue item yet. Create one to plan infrastructure requirements before any future execution is considered.
                </p>
                <button onClick={() => setShowCapabilityPlanForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Cpu size={14} /> Create Capability Plan
                </button>
              </div>
            )}
          </Section>

          <Section title="Execution Record" eyebrow="Sprint 012 infrastructure detail">
            {execution ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Info label="Execution ID" value={execution.executionId} />
                  <Info label="Lifecycle State" value={execution.status} />
                  <Info label="Retry Count" value={String(execution.retryHistory.length)} />
                  <Info label="Capability Plan" value={execution.capabilityPlan?.capabilityPlanId || 'Not linked'} />
                  <Info label="Approval" value={execution.approval?.approvalId || 'Not linked'} />
                  <Info label="Estimated Cost" value={formatMoney(execution.estimatedCost)} />
                  <Info label="Actual Cost" value={formatMoney(execution.actualCost)} />
                  <Info label="Failures" value={String(execution.failures.length)} />
                  <Info label="Logs" value={String(execution.logs.length)} />
                  <Info label="Created" value={formatDate(execution.createdAt)} />
                  <Info label="Updated" value={formatDate(execution.updatedAt)} />
                  <Info label="Ready" value={formatOptionalDate(execution.timing.readyAt)} />
                  <Info label="Started" value={formatOptionalDate(execution.timing.startedAt)} />
                  <Info label="Completed" value={formatOptionalDate(execution.timing.completedAt)} />
                  <Info label="Failed" value={formatOptionalDate(execution.timing.failedAt)} />
                  <Info label="Result Reference" value={execution.resultRef || 'Not recorded'} />
                </div>

                {readiness ? (
                  <div className="rounded-xl border border-line bg-ink/35 p-4">
                    <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Readiness Check</p>
                    <p className="m-0 mt-2 text-sm font-semibold text-white">
                      Capability {readiness.capabilityReady ? 'ready' : 'not ready'} · Approval {readiness.approvalReady ? 'ready' : 'not ready'}
                    </p>
                    {readiness.blockers.length > 0 ? (
                      <ul className="mt-3 space-y-2 pl-4 text-sm leading-6 text-muted">
                        {readiness.blockers.map((blocker) => (
                          <li key={`${blocker.code}-${blocker.message}`}>{blocker.message}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 mt-3 text-sm leading-6 text-muted">
                        Capability and approval requirements are satisfied. This still does not execute work.
                      </p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Link to={`/executions/${execution.id}`} className="btn-primary inline-flex items-center gap-2">
                    <ShieldCheck size={14} /> Open Execution Detail
                  </Link>
                  <Link to="/executions" className="btn-secondary">
                    Open Execution Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
                <p className="m-0 text-sm leading-6 text-[#aeb8b3]">
                  No Execution Record exists for this queue item yet. Create one to track lifecycle state, references, retry history, failures, costs, logs, and future result references without executing work.
                </p>
                <button onClick={() => createExecutionRecord(queueItem)} className="btn-primary mt-4 inline-flex items-center gap-2">
                  <ShieldCheck size={14} /> Create Execution Record
                </button>
              </div>
            )}
          </Section>

          <Section title="Placeholder Result" eyebrow="No execution yet">
            <Placeholder text={queueItem.placeholderResult} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Source Work Item" eyebrow="Origin record">
            <div className="space-y-3">
              <Info label="Work Item" value={`${queueItem.sourceWorkItemId} · ${queueItem.workItemTitle}`} />
              <Link to={`/work-items/${queueItem.sourceWorkItemRecordId}`} className="btn-primary inline-flex">Open Work Item</Link>
            </div>
          </Section>

          <Section title="Context" eyebrow="Business ownership">
            <div className="grid gap-3">
              <Info label="Business" value={`${queueItem.businessCode} · ${queueItem.businessName}`} />
              <Info label="Project" value={`${queueItem.projectCode} · ${queueItem.projectName}`} />
              <Info label="Department" value={`${queueItem.departmentCode} · ${queueItem.departmentName}`} />
              <Info label="Manager" value={queueItem.managerName} />
              <Info label="Operator" value={queueItem.operatorName} />
            </div>
          </Section>

          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {queueItem.timeline.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-line bg-ink/35 p-3">
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-mint text-ink">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">{item.message}</p>
                    <p className="m-0 mt-1 text-[11px] text-muted">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
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

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-4">
      <p className="m-0 text-sm leading-6 text-[#aeb8b3]">{text}</p>
    </div>
  )
}
