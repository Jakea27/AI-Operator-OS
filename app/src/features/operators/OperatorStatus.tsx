import { OperatorStatus as Status } from '@/src/core/operators'

const statusClass: Record<Status, string> = {
  Idle: 'border-white/10 bg-white/[0.05] text-[#b8c2bd]',
  Thinking: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Waiting: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  Blocked: 'border-red-400/30 bg-red-400/10 text-red-300',
  'Needs Approval': 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  Completed: 'border-lime/30 bg-lime/10 text-lime',
}

export function OperatorStatus({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
