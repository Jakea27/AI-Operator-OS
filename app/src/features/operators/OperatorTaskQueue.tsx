import { CheckCircle2, Circle, Clock, ShieldAlert } from 'lucide-react'
import { OperatorTask } from '@/src/core/operators'

const taskIcon = {
  queued: Circle,
  active: Clock,
  waiting: Clock,
  blocked: ShieldAlert,
  done: CheckCircle2,
}

export function OperatorTaskQueue({ tasks }: { tasks: OperatorTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">
        No queued tasks yet. Future operator actions will appear here before execution or approval.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const Icon = taskIcon[task.status]
        return (
          <article key={task.id} className="rounded-xl border border-line bg-ink/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Icon size={15} className={task.requiresApproval ? 'mt-0.5 text-orange-300' : 'mt-0.5 text-lime'} />
                <div>
                  <h4 className="m-0 text-sm font-semibold text-white">{task.title}</h4>
                  <p className="mb-0 mt-1 text-xs leading-5 text-muted">{task.description}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-muted">{task.status}</span>
            </div>
            {task.requiresApproval && <p className="mb-0 mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300">CEO approval required before action</p>}
          </article>
        )
      })}
    </div>
  )
}
