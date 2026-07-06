import { ArrowLeft, Check, ClipboardList } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ExecutionQueueDetailPage() {
  const { queueItemId } = useParams()
  const executionQueue = useExecutionQueueStore()
  const queueItem = executionQueue.queueItems.find((item) => item.id === queueItemId || item.queueId === queueItemId)
  const [draft, setDraft] = useState<ExecutionQueueRecord | undefined>(queueItem)

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
