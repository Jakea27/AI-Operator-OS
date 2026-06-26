import { OperatorStatus as Status } from '@/src/core/operators'
import { statusClass } from './operatorPresentation'

export function OperatorStatus({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
