import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WorkforceOperatorRecord } from '@/src/core/operators'

export function WorkforceOperatorCard({ operator }: { operator: WorkforceOperatorRecord }) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{operator.operatorId} · {operator.businessCode}</p>
          <h3 className="m-0 font-display text-xl font-semibold text-white">{operator.name}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">{operator.role}</p>
        </div>
        <span className="rounded-full border border-lime/20 bg-lime/[0.08] px-3 py-1 text-[11px] font-semibold text-lime">
          {operator.status}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Department" value={operator.departmentName} />
        <Info label="Manager" value={operator.assignedManagerName} />
        <Info label="Health" value={operator.health} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Info label="Primary Skill" value={operator.primarySkill} />
        <Info label="Assignment" value={operator.currentAssignment} />
      </div>
      <Link to={`/operators/${operator.id}`} className="btn-secondary mt-5 inline-flex items-center gap-2">
        Open Operator <ArrowRight size={14} />
      </Link>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink/35 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 line-clamp-2 text-sm font-semibold text-white">{value || 'Not set'}</p>
    </div>
  )
}

