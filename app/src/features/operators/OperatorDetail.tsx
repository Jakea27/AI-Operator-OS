import { Brain, BriefcaseBusiness, History, ShieldCheck, Sparkles, Wrench, X } from 'lucide-react'
import { AIOperator, OperatorSharedContext, getOperatorSnapshot } from '@/src/core/operators'
import { OperatorTaskQueue } from './OperatorTaskQueue'
import { OperatorStatus } from './OperatorStatus'

export function OperatorDetail({
  operator,
  context,
  onClose,
}: {
  operator: AIOperator
  context: OperatorSharedContext
  onClose: () => void
}) {
  const snapshot = getOperatorSnapshot(operator, context)

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <OperatorStatus status={snapshot.operator.currentStatus} />
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300">{operator.approvalLevel}</span>
          </div>
          <h2 className="m-0 font-display text-2xl font-semibold">{operator.name}</h2>
          <p className="mb-0 mt-2 text-sm leading-6 text-[#c3cbc7]">{operator.mission}</p>
        </div>
        <button onClick={onClose} className="rounded-lg border border-line p-2 text-muted hover:text-white" aria-label="Close operator detail"><X size={16} /></button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <InfoPanel icon={BriefcaseBusiness} title="Responsibilities" items={operator.responsibilities} />
        <InfoPanel icon={Wrench} title="Available Tools" items={operator.availableTools} />
        <InfoPanel icon={ShieldCheck} title="Memory Access" items={[operator.memoryAccess.notes, ...operator.memoryAccess.preferredCategories.map((category) => `Category: ${category}`)]} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <section className="rounded-2xl border border-line bg-ink/25 p-5">
          <div className="mb-4 flex items-center gap-2 text-lime"><Sparkles size={15} /><p className="eyebrow m-0">Task Queue</p></div>
          <OperatorTaskQueue tasks={snapshot.openTasks} />
        </section>

        <section className="rounded-2xl border border-line bg-ink/25 p-5">
          <div className="mb-4 flex items-center gap-2 text-lime"><Brain size={15} /><p className="eyebrow m-0">Shared Business Context</p></div>
          <p className="text-xs leading-5 text-muted">{snapshot.memorySummary}</p>
          <div className="mt-4 space-y-3">
            {snapshot.relevantMemory.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">No matching memory entries yet. Add decisions, rules, SOPs, or research notes in Business Memory to enrich this operator.</p>
            ) : snapshot.relevantMemory.map((memory) => (
              <article key={memory.id} className="rounded-xl border border-line bg-white/[0.025] p-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">{memory.type}</span>
                <h4 className="m-0 mt-1 text-sm font-semibold text-white">{memory.title}</h4>
                <p className="mb-0 mt-1 line-clamp-2 text-xs leading-5 text-muted">{memory.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-ink/25 p-5">
        <div className="mb-4 flex items-center gap-2 text-lime"><History size={15} /><p className="eyebrow m-0">Recommendation History</p></div>
        {operator.recommendationHistory.length === 0 ? (
          <p className="m-0 text-xs leading-5 text-muted">No recommendations yet. AO-004.1 creates the framework only; reasoning will be added later.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {operator.recommendationHistory.map((recommendation) => (
              <article key={recommendation.id} className="rounded-xl border border-line bg-white/[0.025] p-4">
                <h4 className="m-0 text-sm font-semibold text-white">{recommendation.summary}</h4>
                <p className="mb-0 mt-2 text-xs leading-5 text-muted">{recommendation.rationale}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function InfoPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof BriefcaseBusiness
  title: string
  items: string[]
}) {
  return (
    <section className="rounded-2xl border border-line bg-ink/25 p-5">
      <div className="mb-3 flex items-center gap-2 text-lime"><Icon size={15} /><p className="eyebrow m-0">{title}</p></div>
      <ul className="m-0 space-y-2 p-0">
        {items.map((item) => <li key={item} className="list-none text-xs leading-5 text-muted">{item}</li>)}
      </ul>
    </section>
  )
}
