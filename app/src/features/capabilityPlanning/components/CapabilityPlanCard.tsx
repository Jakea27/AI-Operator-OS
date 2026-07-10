import { Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CapabilityPlanRecord } from '@/src/core/capabilityPlanning'

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export function CapabilityPlanCard({ plan }: { plan: CapabilityPlanRecord }) {
  return (
    <article className="rounded-xl border border-line bg-ink/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2">{plan.capabilityPlanId} · {plan.sourceQueueCode}</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{plan.workItemTitle}</h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            {plan.readinessStatus} · {plan.sourceBusinessCode} · {plan.sourceProjectCode}
          </p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
          <Cpu size={18} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Info label="Estimated Cost" value={formatCurrency(plan.estimatedCost)} />
        <Info label="Runtime" value={`${plan.estimatedRuntimeMinutes} min`} />
        <Info label="Capabilities" value={String(plan.requiredCapabilities.length)} />
        <Info label="Providers" value={String(plan.preferredProviders.length)} />
        <Info label="Missing" value={String(plan.missingRequirements.length)} />
        <Info label="Status" value={plan.readinessStatus} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/capability-planning/${plan.id}`} className="btn-primary">Open Plan</Link>
        <Link to={`/execution-queue/${plan.sourceQueueItemId}`} className="btn-secondary">Open Queue Item</Link>
      </div>
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-3">
      <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="m-0 mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
