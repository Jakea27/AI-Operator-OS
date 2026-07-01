import { Check, Circle } from 'lucide-react'
import { BusinessStatus, businessStatuses, getBusinessLifecycleProgress, getBusinessStatusIndex } from '@/src/core/businesses'

export function BusinessLifecycle({ status }: { status: BusinessStatus }) {
  const activeIndex = getBusinessStatusIndex(status)

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Business Lifecycle</p>
          <h3 className="m-0 font-display text-lg font-semibold text-white">{status}</h3>
        </div>
        <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
          {getBusinessLifecycleProgress(status)}% progressed
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-mint to-lime" style={{ width: `${getBusinessLifecycleProgress(status)}%` }} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        {businessStatuses.map((item, index) => {
          const isComplete = index < activeIndex
          const isCurrent = index === activeIndex
          return (
            <div
              key={item}
              className={`rounded-xl border p-3 ${
                isCurrent
                  ? 'border-lime/60 bg-lime/[0.12] text-white shadow-[0_0_24px_rgba(200,245,96,0.08)]'
                  : isComplete
                    ? 'border-mint/30 bg-mint/[0.07] text-[#dce7df]'
                    : 'border-line bg-white/[0.02] text-muted opacity-75'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Stage {index + 1}</span>
                {isComplete ? <Check size={13} className="text-mint" /> : <Circle size={10} className={isCurrent ? 'text-lime' : 'text-muted'} />}
              </div>
              <p className="m-0 text-xs font-medium leading-5">{item}</p>
              {isCurrent ? <p className="m-0 mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-lime">Current</p> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

