import { FormEvent, useMemo, useState } from 'react'
import { GitBranch, Network, Route, ShieldCheck } from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { useMemoryStore } from '@/src/core/memory'
import {
  AIOperator,
  buildOperators,
  CoordinatorRequestType,
  OperatorSharedContext,
  OperatorTaskPriority,
  routeCoordinatorRequest,
  useExecutiveCoordinatorStore,
  useOperatorStore,
} from '@/src/core/operators'
import { useOperatingStore } from '@/src/services/operatingStore'
import { OperatorCard } from './OperatorCard'

export function OperatorsPage() {
  const { data, metrics, storageAvailable, addApproval } = useOperatingStore()
  const { memoryEntries } = useMemoryStore()
  const { data: operatorState } = useOperatorStore()
  const coordinator = useExecutiveCoordinatorStore()
  const [requestDraft, setRequestDraft] = useState({
    title: '',
    details: '',
    type: 'general' as CoordinatorRequestType,
    priority: 'Medium' as OperatorTaskPriority,
  })
  const [routingSummary, setRoutingSummary] = useState('')
  const context: OperatorSharedContext = useMemo(() => ({
    operatingState: data,
    metrics,
    memories: memoryEntries,
    briefing: data.latestBriefing,
    storageAvailable,
  }), [data, metrics, memoryEntries, storageAvailable])
  const operators = useMemo(() => buildOperators(context, operatorState), [context, operatorState])

  const submitRoute = (event: FormEvent) => {
    event.preventDefault()
    if (!requestDraft.title.trim()) return
    const decision = routeCoordinatorRequest({
      request: {
        title: requestDraft.title.trim(),
        details: requestDraft.details.trim(),
        type: requestDraft.type,
        priority: requestDraft.priority,
      },
      context,
      addApproval,
    })
    setRoutingSummary(decision.summary)
    setRequestDraft({ title: '', details: '', type: 'general', priority: 'Medium' })
  }

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

      <section className="panel mb-5 p-5">
        <div className="mb-5 flex items-start gap-3">
          <span className="rounded-xl border border-lime/20 bg-lime/10 p-2 text-lime"><Route size={18} /></span>
          <div>
            <p className="eyebrow mb-1">Executive Coordinator</p>
            <h2 className="m-0 text-lg font-semibold text-white">Route to operator</h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-muted">Internal deterministic routing only. The coordinator creates operator tasks and queues risky items for CEO review; it is not a visible operator.</p>
          </div>
        </div>
        <form onSubmit={submitRoute} className="grid grid-cols-6 gap-3">
          <input className="field col-span-2" placeholder="Request title" value={requestDraft.title} onChange={(event) => setRequestDraft({ ...requestDraft, title: event.target.value })} />
          <select className="field" value={requestDraft.type} onChange={(event) => setRequestDraft({ ...requestDraft, type: event.target.value as CoordinatorRequestType })}>
            <option value="general">general</option>
            <option value="architecture">architecture</option>
            <option value="finance">finance</option>
            <option value="marketing">marketing</option>
            <option value="operations">operations</option>
            <option value="research">research</option>
            <option value="development">development</option>
            <option value="memory">memory</option>
            <option value="approval">approval</option>
          </select>
          <select className="field" value={requestDraft.priority} onChange={(event) => setRequestDraft({ ...requestDraft, priority: event.target.value as OperatorTaskPriority })}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
          <button className="btn-primary col-span-2" type="submit">Route button</button>
          <textarea className="field col-span-6 min-h-24 resize-y" placeholder="Request details" value={requestDraft.details} onChange={(event) => setRequestDraft({ ...requestDraft, details: event.target.value })} />
        </form>
        {routingSummary && <p className="mt-4 rounded-xl border border-lime/15 bg-lime/[0.04] p-3 text-xs leading-5 text-[#c3cbc7]">{routingSummary}</p>}
      </section>

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

      <section className="panel mt-5 p-5">
        <div className="mb-5 flex items-center gap-2 text-lime"><GitBranch size={17} /><h2 className="m-0 text-lg font-semibold text-white">Coordinator Activity</h2></div>
        {coordinator.recentHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">No routed requests yet. Use Route to operator to create local operator tasks.</p>
        ) : (
          <div className="space-y-3">
            {coordinator.recentHistory.map((item) => (
              <article key={item.id} className="rounded-xl border border-line bg-ink/35 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow mb-1">{item.classifiedType}</p>
                    <h3 className="m-0 text-sm font-semibold text-white">{item.request.title}</h3>
                    <p className="mb-0 mt-2 text-xs leading-5 text-muted">{item.summary}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${item.risky ? 'border-orange-400/30 bg-orange-400/10 text-orange-300' : 'border-lime/30 bg-lime/10 text-lime'}`}>{item.risky ? 'Approval queued' : 'Draft routed'}</span>
                </div>
                <p className="mb-0 mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">Routed to {item.routes.map((route) => route.operatorId.toUpperCase()).join(', ')} • {new Date(item.createdAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
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
