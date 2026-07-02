import { ArrowLeft, Check, ListChecks } from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useWorkforceOperatorStore } from '@/src/core/operators'
import {
  WorkItemPriority,
  WorkItemRecord,
  WorkItemStatus,
  workItemPriorities,
  workItemStatuses,
  useWorkItemStore,
} from '@/src/core/workItems'

function formatDate(value: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function WorkItemDetailPage() {
  const { workItemId } = useParams()
  const workItemStore = useWorkItemStore()
  const operatorStore = useWorkforceOperatorStore()
  const workItem = workItemStore.workItems.find((item) => item.id === workItemId || item.workItemId === workItemId)
  const [draft, setDraft] = useState<WorkItemRecord | undefined>(workItem)

  useEffect(() => {
    setDraft(workItem)
  }, [workItem])

  const eligibleOperators = useMemo(
    () => operatorStore.operators.filter((operator) => operator.departmentId === draft?.departmentId && operator.status !== 'Archived'),
    [operatorStore.operators, draft?.departmentId],
  )

  if (!workItem || !draft) {
    return <Navigate to="/work-items" replace />
  }

  function selectOperator(operatorRecordId: string) {
    const operator = eligibleOperators.find((item) => item.id === operatorRecordId)
    setDraft((current) => current ? {
      ...current,
      assignedOperatorId: operator?.id,
      assignedOperatorCode: operator?.operatorId,
      assignedOperatorName: operator?.name ?? 'Unassigned',
    } : current)
  }

  function save(workItemRecord: WorkItemRecord, draftRecord: WorkItemRecord) {
    workItemStore.updateWorkItem(workItemRecord.id, {
      title: draftRecord.title,
      description: draftRecord.description,
      status: draftRecord.status,
      priority: draftRecord.priority,
      assignedOperatorId: draftRecord.assignedOperatorId,
      assignedOperatorCode: draftRecord.assignedOperatorCode,
      assignedOperatorName: draftRecord.assignedOperatorName,
      estimatedHours: draftRecord.estimatedHours,
      dueDate: draftRecord.dueDate,
      notes: draftRecord.notes,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/work-items" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={15} /> Back to Work Items
        </Link>
        <p className="eyebrow mb-2">Work Item Detail · {workItem.workItemId}</p>
        <h2 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">{workItem.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8f9b95]">{workItem.description}</p>
      </div>

      <section className="panel border-lime/20 bg-gradient-to-br from-lime/[0.07] to-white/[0.025] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime/10 text-lime">
            <ListChecks size={18} />
          </div>
          <div>
            <p className="eyebrow mb-1">Executive Summary</p>
            <h3 className="m-0 font-display text-xl font-semibold text-white">Work Item record</h3>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <Info label="Work Item ID" value={workItem.workItemId} />
          <Info label="Project" value={workItem.projectCode} />
          <Info label="Business" value={workItem.businessCode} />
          <Info label="Department" value={workItem.departmentName} />
          <Info label="Manager" value={workItem.assignedManagerName} />
          <Info label="Operator" value={workItem.assignedOperatorName} />
          <Info label="Status" value={workItem.status} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Section title="Editable Fields" eyebrow="Work Item identity">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Title</span>
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="field" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Description</span>
                <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="field min-h-[100px]" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Status</span>
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as WorkItemStatus })} className="field">
                  {workItemStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as WorkItemPriority })} className="field">
                  {workItemPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Assigned Operator</span>
                <select value={draft.assignedOperatorId ?? ''} onChange={(event) => selectOperator(event.target.value)} className="field">
                  <option value="">Unassigned</option>
                  {eligibleOperators.map((operator) => (
                    <option key={operator.id} value={operator.id}>{operator.operatorId} · {operator.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Estimated Hours</span>
                <input type="number" min={0} step={0.5} value={draft.estimatedHours} onChange={(event) => setDraft({ ...draft, estimatedHours: Number(event.target.value) })} className="field" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Due Date</span>
                <input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} className="field" />
              </label>
              <Info label="Created" value={formatDate(workItem.createdAt)} />
              <Info label="Updated" value={formatDate(workItem.updatedAt)} />
            </div>
          </Section>

          <Section title="Notes" eyebrow="Placeholder Notes">
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="field min-h-[120px]" />
            <button onClick={() => save(workItem, draft)} className="btn-primary mt-4">Save Work Item</button>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Context" eyebrow="Project and ownership">
            <div className="grid gap-3">
              <Info label="Project" value={`${workItem.projectCode} · ${workItem.projectName}`} />
              <Info label="Business" value={`${workItem.businessCode} · ${workItem.businessName}`} />
              <Info label="Department" value={`${workItem.departmentCode} · ${workItem.departmentName}`} />
              <Info label="Manager" value={workItem.assignedManagerName} />
              <Info label="Operator" value={workItem.assignedOperatorName} />
            </div>
          </Section>

          <Section title="Timeline" eyebrow="Local history">
            <div className="space-y-3">
              {workItem.timeline.map((item) => (
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

          <Section title="Placeholder Metrics" eyebrow="Future measurement">
            <Placeholder text={workItem.placeholderMetrics} />
          </Section>

          <Section title="Placeholder Notes" eyebrow="Future execution context">
            <Placeholder text={workItem.placeholderNotes} />
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
