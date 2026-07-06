import { useState } from 'react'
import {
  ExecutionQueueInput,
  ExecutionQueuePriority,
  ExecutionQueueStatus,
  ExecutionType,
  executionQueuePriorities,
  executionQueueStatuses,
  executionTypes,
} from '@/src/core/executionQueue'
import { WorkItemRecord } from '@/src/core/workItems'

type ExecutionQueueFormProps = {
  workItem: WorkItemRecord
  onCancel: () => void
  onCreate: (input: ExecutionQueueInput) => void
}

export function ExecutionQueueForm({ workItem, onCancel, onCreate }: ExecutionQueueFormProps) {
  const [queueStatus, setQueueStatus] = useState<ExecutionQueueStatus>('Queued')
  const [priority, setPriority] = useState<ExecutionQueuePriority>(workItem.priority)
  const [executionType, setExecutionType] = useState<ExecutionType>('Manual')
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [notes, setNotes] = useState('')

  function submit() {
    onCreate({
      sourceWorkItemRecordId: workItem.id,
      sourceWorkItemId: workItem.workItemId,
      workItemTitle: workItem.title,
      businessId: workItem.businessId,
      businessCode: workItem.businessCode,
      businessName: workItem.businessName,
      projectId: workItem.projectId,
      projectCode: workItem.projectCode,
      projectName: workItem.projectName,
      departmentId: workItem.departmentId,
      departmentCode: workItem.departmentCode,
      departmentName: workItem.departmentName,
      managerId: workItem.assignedManagerId,
      managerName: workItem.assignedManagerName,
      operatorId: workItem.assignedOperatorId,
      operatorCode: workItem.assignedOperatorCode,
      operatorName: workItem.assignedOperatorName,
      queueStatus,
      priority,
      executionType,
      requiresApproval,
      notes,
    })
  }

  return (
    <section className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="eyebrow mb-2">Add to Execution Queue</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{workItem.workItemId} · {workItem.title}</h3>
      <p className="m-0 mt-2 text-sm leading-6 text-muted">
        This creates a queue record only. It does not execute work or submit an approval.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Info label="Business" value={`${workItem.businessCode} · ${workItem.businessName}`} />
        <Info label="Project" value={`${workItem.projectCode} · ${workItem.projectName}`} />
        <Info label="Department" value={`${workItem.departmentCode} · ${workItem.departmentName}`} />
        <Info label="Operator" value={workItem.assignedOperatorName} />
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Queue Status</span>
          <select value={queueStatus} onChange={(event) => setQueueStatus(event.target.value as ExecutionQueueStatus)} className="field">
            {executionQueueStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as ExecutionQueuePriority)} className="field">
            {executionQueuePriorities.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Execution Type</span>
          <select value={executionType} onChange={(event) => setExecutionType(event.target.value as ExecutionType)} className="field">
            {executionTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-line bg-panel/60 p-4">
          <input type="checkbox" checked={requiresApproval} onChange={(event) => setRequiresApproval(event.target.checked)} />
          <span className="text-sm font-semibold text-white">Requires Approval</span>
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="field min-h-[92px]" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={submit} className="btn-primary">Create Queue Item</button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-4">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
