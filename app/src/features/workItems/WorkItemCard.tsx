import { ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WorkItemRecord } from '@/src/core/workItems'

export function WorkItemCard({ workItem }: { workItem: WorkItemRecord }) {
  return (
    <article className="record-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{workItem.workItemId} · {workItem.projectCode}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{workItem.title}</h3>
          <p className="m-0 mt-2 line-clamp-2 text-sm leading-6 text-muted">{workItem.description}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
          <ListChecks size={18} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Info label="Status" value={workItem.status} />
        <Info label="Priority" value={workItem.priority} />
        <Info label="Department" value={workItem.departmentName} />
        <Info label="Assigned Operator" value={workItem.assignedOperatorName} />
        <Info label="Due Date" value={workItem.dueDate || 'Not set'} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/work-items/${workItem.id}`} className="btn-primary">Open Work Item</Link>
        <Link to={`/projects/${workItem.projectId}`} className="btn-secondary">Open Project</Link>
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
