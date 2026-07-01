import { Check, Circle } from 'lucide-react'
import { getLifecycleProgress, getStageIndex, opportunityStages } from '@/src/core/opportunities'
import { OpportunityStage } from '@/src/core/opportunities'

export function OpportunityLifecycle({ stage }: { stage: OpportunityStage }) {
  const activeIndex = getStageIndex(stage)

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Lifecycle</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{stage}</h3>
        </div>
        <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
          {getLifecycleProgress(stage)}% progressed
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${getLifecycleProgress(stage)}%` }} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-9">
        {opportunityStages.map((item, index) => {
          const isComplete = index < activeIndex
          const isCurrent = index === activeIndex
          return (
            <div
              key={item}
              className={`rounded-xl border p-3 ${
                isCurrent
                  ? 'border-lime/50 bg-lime/[0.08] text-white shadow-[0_0_0_1px_rgba(200,245,96,0.05)]'
                  : isComplete
                    ? 'border-mint/25 bg-mint/[0.05] text-[#dce7df]'
                    : 'border-line bg-white/[0.025] text-muted'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Step {index + 1}</span>
                {isComplete ? <Check size={13} className="text-mint" /> : <Circle size={10} className={isCurrent ? 'text-lime' : 'text-muted'} />}
              </div>
              <p className="m-0 text-xs font-medium leading-5">{item}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

