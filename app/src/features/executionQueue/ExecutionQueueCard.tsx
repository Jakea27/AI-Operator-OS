import { ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ExecutionQueueRecord } from '@/src/core/executionQueue'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function ExecutionQueueCard({ queueItem }: { queueItem: ExecutionQueueRecord }) {
  return (
    <article className="record-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{queueItem.queueId} · {queueItem.sourceWorkItemId}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{queueItem.workItemTitle}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            {queueItem.executionType} · {queueItem.requiresApproval ? 'Requires approval' : 'No approval required yet'}
          </p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
          <ClipboardList size={18} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Info label="Status" value={queueItem.queueStatus} />
        <Info label="Priority" value={queueItem.priority} />
        <Info label="Business" value={queueItem.businessCode} />
        <Info label="Project" value={queueItem.projectCode} />
        <Info label="Updated" value={formatDate(queueItem.updatedAt)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/execution-queue/${queueItem.id}`} className="btn-primary">Open Queue Item</Link>
        <Link to={`/work-items/${queueItem.sourceWorkItemRecordId}`} className="btn-secondary">Open Work Item</Link>
      </div>
    </article>
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
