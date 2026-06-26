import { ArrowUpRight, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AIOperator, getLastRecommendation } from '@/src/core/operators'
import { Approval, getApprovalDecisionLabel, getOperatorApprovalStats } from '@/src/features/approval'
import { OperatorStatus } from './OperatorStatus'
import { operatorIcon } from './operatorPresentation'

export function OperatorCard({ operator, approvals = [] }: { operator: AIOperator; approvals?: Approval[] }) {
  const stats = getOperatorApprovalStats(approvals, operator.name as Approval['operator'])
  return (
    <article className="panel flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-line bg-ink/40 text-2xl">{operatorIcon(operator.id)}</span>
          <div>
            <p className="eyebrow mb-2">{operator.role}</p>
            <h2 className="m-0 text-xl font-semibold text-white">{operator.name}</h2>
          </div>
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

      <div className={`mt-4 rounded-xl border p-4 ${stats.needsAttention ? 'border-[#ffcc66]/25 bg-[#ffcc66]/[0.045]' : 'border-line bg-ink/30'}`}>
        <p className="eyebrow mb-2">Approval Context</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <MiniStat label="Pending approvals" value={stats.pending} />
          <MiniStat label="Approved" value={stats.approved} />
          <MiniStat label="Rejected" value={stats.rejected} />
        </div>
        <p className="mb-0 mt-3 text-xs leading-5 text-muted">Last CEO decision: {getApprovalDecisionLabel(stats.lastDecision)}</p>
        <p className={`mb-0 mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${stats.needsAttention ? 'text-[#ffcc66]' : 'text-muted'}`}>Needs CEO attention: {stats.needsAttention ? 'Yes' : 'No'}</p>
      </div>

      <Link to={`/operators/${operator.id}`} className="btn-secondary mt-5 flex items-center justify-center gap-2">
        Open operator <ArrowUpRight size={14} />
      </Link>
    </article>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.025] p-2">
      <p className="m-0 text-sm font-semibold text-white">{value}</p>
      <p className="mb-0 mt-1 text-[9px] leading-4 text-muted">{label}</p>
    </div>
  )
}
