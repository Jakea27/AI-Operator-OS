import { ArrowUpRight, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AIOperator, getLastRecommendation } from '@/src/core/operators'
import { OperatorStatus } from './OperatorStatus'

export function OperatorCard({ operator }: { operator: AIOperator }) {
  return (
    <article className="panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{operator.role}</p>
          <h2 className="m-0 text-xl font-semibold text-white">{operator.name}</h2>
        </div>
        <OperatorStatus status={operator.currentStatus} />
      </div>

      <p className="mt-4 text-sm leading-6 text-[#c3cbc7]">{operator.mission}</p>

      <div className="mt-2 rounded-xl border border-line bg-ink/30 p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          <ListChecks size={13} />
          Current task
        </div>
        <p className="m-0 text-sm font-medium text-white">{operator.currentTask?.title ?? 'No active task'}</p>
        {operator.currentTask && <p className="mb-0 mt-1 line-clamp-2 text-xs leading-5 text-muted">{operator.currentTask.description}</p>}
      </div>

      <div className="mt-4 flex-1">
        <p className="eyebrow mb-2">Last recommendation</p>
        <p className="m-0 line-clamp-3 text-xs leading-5 text-muted">{getLastRecommendation(operator)}</p>
      </div>

      <Link to={`/operators/${operator.id}`} className="btn-secondary mt-5 flex items-center justify-center gap-2">
        Open operator <ArrowUpRight size={14} />
      </Link>
    </article>
  )
}
