import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { CapabilityPlanRecord } from '@/src/core/capabilityPlanning'

export function CapabilityReadinessSummary({ plan }: { plan: CapabilityPlanRecord }) {
  const ready = plan.missingRequirements.length === 0

  return (
    <section className={`rounded-xl border p-4 ${ready ? 'border-lime/30 bg-lime/[0.06]' : 'border-amber-400/25 bg-amber-400/[0.06]'}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ready ? 'bg-lime/10 text-lime' : 'bg-amber-400/10 text-amber-300'}`}>
          {ready ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div>
          <p className="eyebrow mb-1">Readiness Review</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">
            {ready ? 'Infrastructure plan is complete.' : `${plan.missingRequirements.length} requirement${plan.missingRequirements.length === 1 ? '' : 's'} missing.`}
          </h3>
          <p className="m-0 mt-2 text-sm leading-6 text-muted">
            This review checks planning completeness only. It does not approve infrastructure or execute work.
          </p>
        </div>
      </div>

      {plan.missingRequirements.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {plan.missingRequirements.map((item) => (
            <span key={item} className="rounded-full border border-amber-400/25 bg-amber-400/[0.08] px-3 py-1 text-xs font-semibold text-amber-200">
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
