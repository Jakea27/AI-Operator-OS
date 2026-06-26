import { FormEvent, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  ClipboardCheck,
  FilePlus2,
  History,
  Lightbulb,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { memoryStore, useMemoryStore } from '@/src/core/memory'
import {
  getOperatorContextCounts,
  getOperatorDetail,
  OperatorId,
  OperatorRecommendationStatus,
  OperatorSharedContext,
  OperatorTaskPriority,
  useOperatorStore,
} from '@/src/core/operators'
import { useOperatingStore } from '@/src/services/operatingStore'
import { OperatorTaskQueue } from './OperatorTaskQueue'
import { OperatorStatus } from './OperatorStatus'

const operatorIds: OperatorId[] = ['cto', 'cfo', 'cmo', 'coo', 'research']

export function OperatorDetail() {
  const { operatorId } = useParams()
  const id = operatorId as OperatorId
  const { data, metrics, storageAvailable } = useOperatingStore()
  const { memoryEntries } = useMemoryStore()
  const operatorStore = useOperatorStore()
  const [analysis, setAnalysis] = useState('')
  const [note, setNote] = useState('')
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    priority: 'Medium' as OperatorTaskPriority,
    relatedIssue: '',
  })

  const context: OperatorSharedContext = useMemo(() => ({
    operatingState: data,
    metrics,
    memories: memoryEntries,
    briefing: data.latestBriefing,
    storageAvailable,
  }), [data, metrics, memoryEntries, storageAvailable])
  const snapshot = operatorIds.includes(id)
    ? getOperatorDetail(id, context, operatorStore.data)
    : null

  if (!snapshot) return <Navigate to="/operators" replace />

  const operator = snapshot.operator
  const counts = getOperatorContextCounts(context)
  const recommendations = operator.recommendationHistory

  const addTask = (event: FormEvent) => {
    event.preventDefault()
    if (!taskDraft.title.trim()) return
    operatorStore.addTask(operator.id, {
      title: taskDraft.title.trim(),
      description: taskDraft.description.trim() || 'Operator-created local task.',
      priority: taskDraft.priority,
      relatedIssue: taskDraft.relatedIssue.trim().toUpperCase(),
    })
    setTaskDraft({ title: '', description: '', priority: 'Medium', relatedIssue: '' })
  }

  const runAnalysis = () => {
    setAnalysis(buildLocalAnalysis(operator.id, context))
  }

  const generateRecommendation = () => {
    const recommendation = buildLocalRecommendation(operator.id, context)
    operatorStore.addRecommendation(operator.id, recommendation)
    setAnalysis(recommendation.summary)
  }

  const saveNoteToMemory = () => {
    const content = note.trim() || buildLocalAnalysis(operator.id, context)
    const entry = memoryStore.add({
      title: `${operator.name} workspace note`,
      type: operator.id === 'cto' ? 'Architecture' : 'Knowledge',
      category: operator.id === 'cto' ? 'Development' : 'Operations',
      tags: ['operator', operator.id],
      summary: content.slice(0, 220),
      details: content,
      author: operator.name,
      relatedIssue: 'AO-004.2',
      relatedSprint: 'Sprint 0.2',
      relatedMemoryIds: [],
      pinned: operator.id === 'cto',
      archived: false,
    })
    setNote(`Saved to Business Memory: ${entry.title}`)
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link to="/operators" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={14} /> Back to Operators</Link>
        <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">Local-first operator workspace</span>
      </div>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow mb-2">{operator.role}</p>
            <h1 className="m-0 font-display text-3xl font-semibold">{operator.name}</h1>
            <p className="mb-0 mt-3 max-w-4xl text-sm leading-6 text-[#c3cbc7]">{operator.mission}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OperatorStatus status={operator.currentStatus} />
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300">{operator.approvalLevel}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-4">
          <Metric label="Current task" value={operator.currentTask?.title ?? 'No active task'} />
          <Metric label="Queued tasks" value={snapshot.openTasks.length.toString()} />
          <Metric label="Recommendations" value={recommendations.length.toString()} />
          <Metric label="Relevant memories" value={snapshot.relevantMemory.length.toString()} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-12 gap-4">
        <main className="col-span-8 space-y-4">
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lime"><ClipboardCheck size={15} /><p className="eyebrow m-0">Task Queue</p></div>
            <form onSubmit={addTask} className="mb-4 grid grid-cols-6 gap-3 rounded-2xl border border-line bg-ink/25 p-4">
              <input className="field col-span-3" placeholder="Task title" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} />
              <select className="field" value={taskDraft.priority} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as OperatorTaskPriority })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <input className="field col-span-2" placeholder="Related issue, e.g. AO-004.2" value={taskDraft.relatedIssue} onChange={(event) => setTaskDraft({ ...taskDraft, relatedIssue: event.target.value })} />
              <textarea className="field col-span-6 min-h-20 resize-y" placeholder="Task description" value={taskDraft.description} onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })} />
              <button className="btn-primary col-span-2" type="submit">Add operator task</button>
            </form>
            <OperatorTaskQueue
              tasks={operator.taskQueue}
              onComplete={(taskId) => operatorStore.completeTask(operator.id, taskId)}
              onRemove={(taskId) => operatorStore.removeTask(operator.id, taskId)}
            />
          </section>

          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lime"><Lightbulb size={15} /><p className="eyebrow m-0">Recent Recommendations</p></div>
            {recommendations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">No recommendations yet. Generate a local draft from available context; nothing executes automatically.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((recommendation) => (
                  <article key={recommendation.id} className="rounded-xl border border-line bg-ink/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="m-0 text-sm font-semibold text-white">{recommendation.title}</h3>
                        <p className="mb-0 mt-2 text-xs leading-5 text-muted">{recommendation.summary}</p>
                      </div>
                      <RecommendationStatus status={recommendation.status} />
                    </div>
                    <p className="mb-0 mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">Source: {recommendation.source} • Created {new Date(recommendation.createdAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lime"><History size={15} /><p className="eyebrow m-0">Operator History</p></div>
            {snapshot.events.length === 0 ? (
              <p className="m-0 text-xs text-muted">No operator history yet.</p>
            ) : snapshot.events.map((event) => (
              <p key={event.id} className="mb-2 rounded-xl border border-line bg-white/[0.025] px-3 py-2 text-xs text-muted">{event.message}</p>
            ))}
          </section>
        </main>

        <aside className="col-span-4 space-y-4">
          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lime"><Sparkles size={15} /><p className="eyebrow m-0">Actions Panel</p></div>
            <div className="grid gap-3">
              <button onClick={runAnalysis} className="btn-secondary flex items-center justify-center gap-2"><PlayCircle size={14} /> Run analysis</button>
              <button onClick={generateRecommendation} className="btn-secondary flex items-center justify-center gap-2"><Lightbulb size={14} /> Generate recommendation</button>
              <button onClick={() => setTaskDraft({ title: `${operator.name} follow-up`, description: buildLocalAnalysis(operator.id, context), priority: operator.id === 'cto' ? 'High' : 'Medium', relatedIssue: 'AO-004.2' })} className="btn-secondary">Draft task from context</button>
              <button onClick={saveNoteToMemory} className="btn-secondary flex items-center justify-center gap-2"><FilePlus2 size={14} /> Save note to memory</button>
            </div>
            {analysis && <p className="mt-4 rounded-xl border border-lime/15 bg-lime/[0.04] p-3 text-xs leading-5 text-[#c3cbc7]">{analysis}</p>}
            <textarea className="field mt-4 min-h-24 resize-y" placeholder="Optional note to save into Business Memory" value={note} onChange={(event) => setNote(event.target.value)} />
          </section>

          <section className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-lime"><Brain size={15} /><p className="eyebrow m-0">Available Shared Context</p></div>
            <ContextRow label="Business Memory" value={counts.businessMemory} />
            <ContextRow label="Money Department" value={counts.moneyRecords} />
            <ContextRow label="CEO Briefing" value={counts.ceoBriefing} />
            <ContextRow label="Development tasks/projects" value={counts.developmentItems} />
            <ContextRow label="Approval Queue" value={counts.approvalQueue} />
            <p className="mb-0 mt-4 text-xs leading-5 text-muted">{snapshot.memorySummary}</p>
          </section>

          <section className="panel p-5">
            <InfoPanel icon={BriefcaseBusiness} title="Responsibilities" items={operator.responsibilities} />
            <InfoPanel icon={Wrench} title="Available Tools" items={operator.availableTools} />
            <InfoPanel icon={ShieldCheck} title="Memory Access" items={[operator.memoryAccess.notes]} />
          </section>
        </aside>
      </div>
    </>
  )
}

function buildLocalAnalysis(operatorId: OperatorId, context: OperatorSharedContext) {
  if (operatorId === 'cto') {
    return `CTO analysis: ${context.memories.filter((memory) => !memory.archived).length} active memory records, ${context.operatingState.tasks.length} development tasks, and ${context.metrics.sprintProgress}% sprint progress are available. The safest architecture move is to keep operator workspaces local-first, persist operator state separately, and preserve approval gates before automation.`
  }
  return `Local analysis: ${context.memories.filter((memory) => !memory.archived).length} memories, ${context.metrics.pendingApprovalCount} pending approvals, and ${context.operatingState.tasks.length} tasks are available for this operator.`
}

function buildLocalRecommendation(operatorId: OperatorId, context: OperatorSharedContext) {
  if (operatorId === 'cto') {
    return {
      title: 'Stabilize operator workspace architecture',
      summary: 'Persist operator task queues and recommendations locally while keeping AI reasoning disabled until approval workflows are stronger.',
      rationale: buildLocalAnalysis(operatorId, context),
      source: 'CTO local architecture analysis',
      status: 'Draft' as OperatorRecommendationStatus,
      requiresApproval: false,
    }
  }
  return {
    title: 'Review local operator context',
    summary: 'Use the current shared business context to prepare a recommendation draft, but do not execute anything automatically.',
    rationale: buildLocalAnalysis(operatorId, context),
    source: 'Operator local analysis',
    status: context.metrics.pendingApprovalCount > 0 ? 'Needs Approval' as OperatorRecommendationStatus : 'Draft' as OperatorRecommendationStatus,
    requiresApproval: context.metrics.pendingApprovalCount > 0,
  }
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-line bg-ink/25 p-4">
      <p className="eyebrow mb-2">{label}</p>
      <p className="m-0 line-clamp-2 text-sm font-semibold text-white">{value}</p>
    </section>
  )
}

function ContextRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-ink/30 px-3 py-2 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function RecommendationStatus({ status }: { status: OperatorRecommendationStatus }) {
  const className = status === 'Needs Approval'
    ? 'border-orange-400/30 bg-orange-400/10 text-orange-300'
    : status === 'Accepted'
      ? 'border-lime/30 bg-lime/10 text-lime'
      : status === 'Rejected'
        ? 'border-red-400/30 bg-red-400/10 text-red-300'
        : 'border-white/10 bg-white/[0.05] text-muted'
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${className}`}>{status}</span>
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
    <section className="mb-4 last:mb-0">
      <div className="mb-3 flex items-center gap-2 text-lime"><Icon size={15} /><p className="eyebrow m-0">{title}</p></div>
      <ul className="m-0 space-y-2 p-0">
        {items.map((item) => <li key={item} className="list-none text-xs leading-5 text-muted">{item}</li>)}
      </ul>
    </section>
  )
}
