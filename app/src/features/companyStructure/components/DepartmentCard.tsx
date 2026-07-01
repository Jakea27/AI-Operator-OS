import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DepartmentRecord } from '@/src/core/companyStructure'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

const statusClass: Record<DepartmentRecord['status'], string> = {
  Planning: 'border-amber-300/20 bg-amber-300/[0.08] text-amber-200',
  Ready: 'border-blue-300/20 bg-blue-400/[0.08] text-blue-200',
  Operating: 'border-lime/20 bg-lime/[0.08] text-lime',
  Paused: 'border-white/10 bg-white/[0.04] text-muted',
  Archived: 'border-red-300/20 bg-red-400/[0.08] text-red-200',
}

export function DepartmentCard({ department }: { department: DepartmentRecord }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{department.departmentId} · {department.businessCode}</p>
          <h3 className="m-0 font-display text-xl font-semibold text-white">{department.departmentName}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">{department.businessName}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${statusClass[department.status]}`}>
          {department.status}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Manager" value={department.manager?.name ?? 'No manager assigned'} />
        <Info label="Manager Health" value={department.manager?.health ?? 'Unknown'} />
        <Info label="Priority" value={department.manager?.currentPriority ?? 'No priority set'} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Info label="Projects" value="0" />
        <Info label="Operators" value="0" />
        <Info label="Queue Items" value="0" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>Updated {formatDate(department.updatedAt)}</span>
      </div>
      <Link to={`/company-structure/departments/${department.id}`} className="btn-secondary mt-5 inline-flex items-center gap-2">
        Open Department <ArrowRight size={14} />
      </Link>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
