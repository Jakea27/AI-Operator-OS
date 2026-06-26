import { useMemo } from 'react'
import { Network, ShieldCheck } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useMemoryStore } from '@/src/core/memory'
import { AIOperator, buildOperators, OperatorSharedContext, useOperatorStore } from '@/src/core/operators'
import { useOperatingStore } from '@/src/services/operatingStore'
import { OperatorCard } from './OperatorCard'

export function OperatorsPage() {
  const { data, metrics, storageAvailable } = useOperatingStore()
  const { memoryEntries } = useMemoryStore()
  const { data: operatorState } = useOperatorStore()
  const context: OperatorSharedContext = useMemo(() => ({
    operatingState: data,
    metrics,
    memories: memoryEntries,
    briefing: data.latestBriefing,
    storageAvailable,
  }), [data, metrics, memoryEntries, storageAvailable])
  const operators = useMemo(() => buildOperators(context, operatorState), [context, operatorState])

  return (
    <>
      <PageIntro
        eyebrow="AI Operator Framework"
        title="Specialized operators, one shared business context."
        description="AO-004.1 creates the reusable local-first operator framework. These are not chatbots yet; they are structured domain operators connected to the same Money, Memory, Briefing, and approval context."
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <SummaryCard label="Operators online" value={operators.length.toString()} detail="CTO, CFO, CMO, COO, Research" />
        <SummaryCard label="Shared context" value={memoryEntries.length.toString()} detail="Business Memory records available locally" />
        <SummaryCard label="Approval posture" value="CEO" detail="Consequential actions remain approval-gated" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {operators.map((operator: AIOperator) => (
          <OperatorCard key={operator.id} operator={operator} />
        ))}
      </div>

      <section className="panel mt-5 p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-xl border border-lime/20 bg-lime/10 p-2 text-lime"><Network size={18} /></span>
          <div>
            <h2 className="m-0 text-base font-semibold">Framework boundary</h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-muted">AO-004.1 defines shared models, registry, memory access, task queues, status, events, and recommendations. AI reasoning and external API connections are intentionally not implemented yet.</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime"><ShieldCheck size={12} /> Local-first</span>
        </div>
      </section>
    </>
  )
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <section className="panel p-5">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 font-display text-3xl font-semibold text-white">{value}</p>
      <p className="mb-0 mt-2 text-xs leading-5 text-muted">{detail}</p>
    </section>
  )
}
