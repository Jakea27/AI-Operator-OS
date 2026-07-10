import { useState } from 'react'
import { ExecutionQueueRecord } from '@/src/core/executionQueue'

type CapabilityPlanFormProps = {
  queueItem: ExecutionQueueRecord
  onCancel: () => void
  onCreate: () => void
}

export function CapabilityPlanForm({ queueItem, onCancel, onCreate }: CapabilityPlanFormProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  return (
    <section className="rounded-xl border border-line bg-ink/35 p-4">
      <p className="eyebrow mb-2">Create Capability Plan</p>
      <h3 className="m-0 font-display text-lg font-semibold text-white">{queueItem.queueId} · {queueItem.workItemTitle}</h3>
      <p className="m-0 mt-2 text-sm leading-6 text-muted">
        This creates an infrastructure planning record only. It does not execute work, install tools, call providers, or create Approval Queue records.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Business" value={`${queueItem.businessCode} · ${queueItem.businessName}`} />
        <Info label="Project" value={`${queueItem.projectCode} · ${queueItem.projectName}`} />
        <Info label="Work Item" value={`${queueItem.sourceWorkItemId} · ${queueItem.workItemTitle}`} />
        <Info label="Execution Type" value={queueItem.executionType} />
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-panel/60 p-4">
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1" />
        <span className="text-sm leading-6 text-[#dce7df]">
          I understand this is planning only. Infrastructure approval and execution will be handled in future approved sprints.
        </span>
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onCreate} disabled={!acknowledged} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
          Create Capability Plan
        </button>
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
