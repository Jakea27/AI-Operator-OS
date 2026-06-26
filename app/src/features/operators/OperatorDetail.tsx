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
  AIOperator,
  CTORecommendation,
  getOperatorContextCounts,
  getOperatorDetail,
  generateCTORecommendation,
  OperatorId,
  OperatorRecommendation,
  OperatorRecommendationStatus,
  OperatorSharedContext,
  OperatorTaskPriority,
  OperatorWorkspaceContextCounts,
  useCTORecommendationStore,
  useOperatorStore,
} from '@/src/core/operators'
import { roadmapStore } from '@/src/core/roadmap'
import { approvalStore } from '@/src/features/approval'
import { useOperatingStore } from '@/src/services/operatingStore'
import { OperatorTaskQueue } from './OperatorTaskQueue'
import { OperatorStatus } from './OperatorStatus'
import { operatorIcon } from './operatorPresentation'

const operatorIds: OperatorId[] = ['cto', 'cfo', 'cmo', 'coo', 'research']

export function OperatorDetail() {
  const { operatorId } = useParams()
  const id = operatorId as OperatorId
  const { data, metrics, storageAvailable } = useOperatingStore()
  const { memoryEntries } = useMemoryStore()
  const operatorStore = useOperatorStore()
  const ctoRecommendations = useCTORecommendationStore()
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
  const structuredCTORecommendations = ctoRecommendations.recommendations
  const currentObjective = getCurrentObjective(operator.id, metrics.sprintProgress)
  const stats = getExecutiveStats(operator, counts)

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
    if (operator.id === 'cto') {
      const recommendation = ctoRecommendations.add(generateCTORecommendation({
        operatingState: data,
        memories: memoryEntries,
        briefing: data.latestBriefing,
        operatorState: operatorStore.data,
      }))
      operatorStore.addRecommendation(operator.id, {
        title: recommendation.title,
        summary: recommendation.summary,
        rationale: recommendation.reasoning,
        source: 'CTO Recommendation Engine',
        status: recommendation.requiresCEOApproval ? 'Needs Approval' : 'Draft',
        confidence: recommendation.confidence,
        riskLevel: recommendation.risk,
        requiresApproval: recommendation.requiresCEOApproval,
      })
      if (recommendation.requiresCEOApproval) {
        approvalStore.addApproval({
          title: recommendation.title,
          description: recommendation.summary,
          submittedBy: 'CTO Operator',
          operator: 'CTO',
          department: 'Technology',
          relatedIssue: 'AO-004.4',
          recommendationId: recommendation.id,
          priority: recommendation.risk === 'High' ? 'High' : 'Medium',
          effort: recommendation.estimatedEffort === 'Small' ? 'Low' : recommendation.estimatedEffort === 'Large' ? 'High' : 'Medium',
          risk: recommendation.risk,
          status: 'Pending',
          requiresCEOApproval: true,
        })
      }
      setAnalysis(recommendation.summary)
      return
    }
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
      relatedIssue: 'AO-004.2.1',
      relatedSprint: 'Sprint 0.2',
      relatedMemoryIds: [],
      pinned: operator.id === 'cto',
      archived: false,
    })
    setNote(`Saved to Business Memory: ${entry.title}`)
  }

  const approveCTORecommendation = (recommendation: CTORecommendation) => {
    ctoRecommendations.updateStatus(recommendation.id, 'Approved', 'Recommendation approved locally')
  }

  const rejectCTORecommendation = (recommendation: CTORecommendation) => {
    ctoRecommendations.updateStatus(recommendation.id, 'Rejected', 'Recommendation rejected locally')
  }

  const addCTORecommendationToRoadmap = (recommendation: CTORecommendation) => {
    roadmapStore.addItem({
      title: recommendation.title,
      description: `${recommendation.summary}\n\nBusiness value: ${recommendation.businessValue}\n\nNext action: ${recommendation.recommendedNextAction}`,
      sourceOperator: 'CTO',
      priority: recommendation.risk === 'High' ? 'High' : recommendation.risk === 'Medium' ? 'Medium' : 'Low',
      status: 'backlog',
      relatedIssue: 'AO-005',
    })
    ctoRecommendations.updateStatus(recommendation.id, 'Added to Roadmap', 'Recommendation added to local roadmap backlog')
  }

  const convertCTORecommendationToIssue = (recommendation: CTORecommendation) => {
    operatorStore.addTask('cto', {
      title: `AO issue draft: ${recommendation.title}`,
      description: `${recommendation.summary}\n\nRecommended next action: ${recommendation.recommendedNextAction}`,
      priority: recommendation.risk === 'High' ? 'High' : 'Medium',
      relatedIssue: 'AO-DRAFT',
      source: 'operator',
      requiresApproval: recommendation.requiresCEOApproval,
    })
    ctoRecommendations.updateStatus(recommendation.id, 'Converted to AO Issue', 'Recommendation converted into a local AO issue draft task')
  }

  const saveCTORecommendationToMemory = (recommendation: CTORecommendation) => {
    memoryStore.add({
      title: recommendation.title,
      type: 'Architecture',
      category: 'Development',
      tags: ['cto', 'recommendation', recommendation.type.toLowerCase()],
      summary: recommendation.summary,
      details: [
        `# ${recommendation.title}`,
        '',
        `## Reasoning`,
        recommendation.reasoning,
        '',
        `## Business Value`,
        recommendation.businessValue,
        '',
        `## Recommended Next Action`,
        recommendation.recommendedNextAction,
      ].join('\n'),
      author: 'CTO Operator',
      relatedIssue: 'AO-004.4',
      relatedSprint: 'Sprint 0.2',
      relatedMemoryIds: [],
      pinned: recommendation.requiresCEOApproval,
      archived: false,
    })
    ctoRecommendations.updateStatus(recommendation.id, 'Saved to Memory', 'Recommendation saved to Business Memory')
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link to="/operators" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft size={14} /> Back to Operators</Link>
        <span className="rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-lime">Local-first operator workspace</span>
      </div>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-lime/20 bg-lime/10 text-4xl shadow-[0_0_30px_rgba(200,245,96,0.06)]">{operatorIcon(operator.id)}</span>
            <div>
              <p className="eyebrow mb-2">{operator.role}</p>
              <h1 className="m-0 font-display text-3xl font-semibold">{operator.name}</h1>
              <p className="mb-0 mt-3 max-w-4xl text-sm leading-6 text-[#c3cbc7]">Department-head workspace for local analysis, recommendations, and drafts.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OperatorStatus status={operator.currentStatus} />
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300">{operator.approvalLevel}</span>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-lime/20 bg-lime/[0.045] p-5">
          <p className="eyebrow mb-2 text-lime">Mission</p>
          <h2 className="m-0 text-xl font-semibold text-white">Mission title: {operator.role}</h2>
          <p className="mb-0 mt-3 text-sm leading-6 text-[#d5ddd9]">{operator.mission}</p>
        </section>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <section className="rounded-2xl border border-mint/20 bg-mint/[0.04] p-5">
            <p className="eyebrow mb-2 text-mint">Current Objective</p>
            <h2 className="m-0 text-lg font-semibold text-white">{currentObjective.objective}</h2>
            <p className="mb-0 mt-2 text-xs leading-5 text-muted">Current issue: {currentObjective.issue}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full rounded-full bg-lime" style={{ width: `${currentObjective.progress}%` }} />
            </div>
            <p className="mb-0 mt-2 text-[10px] uppercase tracking-[0.12em] text-muted">{currentObjective.progress}% progress indicator</p>
          </section>
          <section className="rounded-2xl border border-line bg-ink/25 p-5">
            <p className="eyebrow mb-3">Executive Statistics</p>
            <div className="grid grid-cols-5 gap-2">
              <Metric label="Open Tasks" value={stats.openTasks.toString()} />
              <Metric label="Completed Today" value={stats.completedToday.toString()} />
              <Metric label="Recommendations" value={stats.recommendations.toString()} />
              <Metric label="Memory Links" value={stats.memoryLinks.toString()} />
              <Metric label="CEO Approvals Waiting" value={stats.approvalsWaiting.toString()} />
            </div>
          </section>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-12 gap-4">
        <main className="col-span-8 space-y-4">
          <section className="panel p-5">
            <div className="mb-5 flex items-center gap-2 text-lime"><ClipboardCheck size={17} /><h2 className="m-0 text-lg font-semibold text-white">Task Queue</h2></div>
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

          {operator.id === 'cto' && (
            <section className="panel p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-lime"><Lightbulb size={17} /><h2 className="m-0 text-lg font-semibold text-white">CTO Recommendation Engine</h2></div>
                <button onClick={generateRecommendation} className="btn-primary">Generate Recommendation</button>
              </div>
              {structuredCTORecommendations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">No structured CTO recommendations yet. Generate one from local Memory, Money, Briefing, Development, Roadmap, and Operator task context.</p>
              ) : (
                <div className="space-y-4">
                  <p className="eyebrow mb-0">Recommendations</p>
                  {structuredCTORecommendations.map((recommendation) => (
                    <CTORecommendationDetailCard
                      key={recommendation.id}
                      recommendation={recommendation}
                      onApprove={() => approveCTORecommendation(recommendation)}
                      onReject={() => rejectCTORecommendation(recommendation)}
                      onAddToRoadmap={() => addCTORecommendationToRoadmap(recommendation)}
                      onConvertToIssue={() => convertCTORecommendationToIssue(recommendation)}
                      onSaveToMemory={() => saveCTORecommendationToMemory(recommendation)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="panel p-5">
            <div className="mb-5 flex items-center gap-2 text-lime"><Lightbulb size={17} /><h2 className="m-0 text-lg font-semibold text-white">Recent Recommendations</h2></div>
            {recommendations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-ink/30 p-4 text-xs leading-5 text-muted">No recommendations yet. Generate a local draft from available context; nothing executes automatically.</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((recommendation) => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5">
            <div className="mb-5 flex items-center gap-2 text-lime"><History size={17} /><h2 className="m-0 text-lg font-semibold text-white">Activity Timeline</h2></div>
            {snapshot.events.length === 0 ? (
              <p className="m-0 text-xs text-muted">No operator activity yet.</p>
            ) : snapshot.events.map((event) => (
              <article key={event.id} className="relative mb-3 border-l border-line pl-4 last:mb-0">
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-lime" />
                <div className="rounded-xl border border-line bg-white/[0.025] p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="m-0 text-sm font-semibold text-white">{event.message}</p>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-muted">{event.status}</span>
                  </div>
                  <p className="m-0 text-[10px] uppercase tracking-[0.12em] text-muted">{new Date(event.createdAt).toLocaleString()} • Source: {event.source}</p>
                </div>
              </article>
            ))}
          </section>
        </main>

        <aside className="col-span-4 space-y-4">
          <section className="panel p-5">
            <div className="mb-5 flex items-center gap-2 text-lime"><Sparkles size={17} /><h2 className="m-0 text-lg font-semibold text-white">Actions Panel</h2></div>
            <div className="grid gap-3">
              <button onClick={runAnalysis} className="btn-secondary flex items-center justify-center gap-2"><PlayCircle size={14} /> Run analysis</button>
              <button onClick={generateRecommendation} className="btn-secondary flex items-center justify-center gap-2"><Lightbulb size={14} /> Generate recommendation</button>
              <button onClick={() => setTaskDraft({ title: `${operator.name} follow-up`, description: buildLocalAnalysis(operator.id, context), priority: operator.id === 'cto' ? 'High' : 'Medium', relatedIssue: 'AO-004.2.1' })} className="btn-secondary">Draft task from context</button>
              <button onClick={saveNoteToMemory} className="btn-secondary flex items-center justify-center gap-2"><FilePlus2 size={14} /> Save note to memory</button>
            </div>
            {analysis && <p className="mt-4 rounded-xl border border-lime/15 bg-lime/[0.04] p-3 text-xs leading-5 text-[#c3cbc7]">{analysis}</p>}
            <textarea className="field mt-4 min-h-24 resize-y" placeholder="Optional note to save into Business Memory" value={note} onChange={(event) => setNote(event.target.value)} />
          </section>

          <section className="panel p-5">
            <div className="mb-5 flex items-center gap-2 text-lime"><Brain size={17} /><h2 className="m-0 text-lg font-semibold text-white">Available Shared Context</h2></div>
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
      confidence: 'High' as const,
      riskLevel: 'Low' as const,
      requiresApproval: false,
    }
  }
  return {
    title: 'Review local operator context',
    summary: 'Use the current shared business context to prepare a recommendation draft, but do not execute anything automatically.',
    rationale: buildLocalAnalysis(operatorId, context),
    source: 'Operator local analysis',
    status: context.metrics.pendingApprovalCount > 0 ? 'Needs Approval' as OperatorRecommendationStatus : 'Draft' as OperatorRecommendationStatus,
    confidence: 'Medium' as const,
    riskLevel: context.metrics.pendingApprovalCount > 0 ? 'Medium' as const : 'Low' as const,
    requiresApproval: context.metrics.pendingApprovalCount > 0,
  }
}

function getCurrentObjective(operatorId: OperatorId, sprintProgress: number) {
  if (operatorId === 'cto') {
    return {
      objective: 'Polish the Operator Workspace before AO-004.3.',
      issue: 'AO-004.2.1',
      progress: Math.max(sprintProgress, 65),
    }
  }
  return {
    objective: 'Use shared local context to prepare safe operator drafts.',
    issue: 'AO-004.2.1',
    progress: Math.max(sprintProgress, 35),
  }
}

function getExecutiveStats(operator: AIOperator, counts: OperatorWorkspaceContextCounts) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    openTasks: operator.taskQueue.filter((task) => task.status !== 'done').length,
    completedToday: operator.taskQueue.filter((task) => task.completedAt?.slice(0, 10) === today).length,
    recommendations: operator.recommendationHistory.length,
    memoryLinks: operator.taskQueue.filter((task) => task.relatedMemoryId).length + counts.businessMemory,
    approvalsWaiting: counts.approvalQueue,
  }
}

function RecommendationCard({ recommendation }: { recommendation: OperatorRecommendation }) {
  return (
    <article className="rounded-2xl border border-line bg-ink/35 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Recommendation Title</p>
          <h3 className="m-0 text-base font-semibold text-white">{recommendation.title}</h3>
        </div>
        <RecommendationStatus status={recommendation.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <InfoTile label="Confidence" value={recommendation.confidence} />
        <InfoTile label="Risk Level" value={recommendation.riskLevel} />
        <InfoTile label="Created Date" value={new Date(recommendation.createdAt).toLocaleDateString()} />
      </div>
      <div className="mt-4 space-y-3">
        <TextBlock label="Summary" value={recommendation.summary} />
        <TextBlock label="Reasoning" value={recommendation.rationale || 'Deterministic local reasoning placeholder based on currently available operator context.'} />
      </div>
      <p className="mb-0 mt-3 text-[10px] uppercase tracking-[0.12em] text-muted">Source: {recommendation.source}</p>
    </article>
  )
}

function CTORecommendationDetailCard({
  recommendation,
  onApprove,
  onReject,
  onAddToRoadmap,
  onConvertToIssue,
  onSaveToMemory,
}: {
  recommendation: CTORecommendation
  onApprove: () => void
  onReject: () => void
  onAddToRoadmap: () => void
  onConvertToIssue: () => void
  onSaveToMemory: () => void
}) {
  return (
    <article className="rounded-2xl border border-lime/15 bg-gradient-to-br from-lime/[0.04] to-ink/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Recommendation Detail</p>
          <h3 className="m-0 text-xl font-semibold text-white">{recommendation.title}</h3>
          <p className="mb-0 mt-2 text-sm leading-6 text-[#c3cbc7]">{recommendation.summary}</p>
        </div>
        <CTORecommendationStatusBadge status={recommendation.status} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        <InfoTile label="Type" value={recommendation.type} />
        <InfoTile label="Effort" value={recommendation.estimatedEffort} />
        <InfoTile label="Risk" value={recommendation.risk} />
        <InfoTile label="Confidence" value={recommendation.confidence} />
      </div>

      <div className="mt-5 grid gap-4">
        <TextBlock label="Reasoning" value={recommendation.reasoning} />
        <TextBlock label="Business Value" value={recommendation.businessValue} />
        <TextBlock label="Dependencies" value={recommendation.dependencies.length ? recommendation.dependencies.join(', ') : 'No dependencies recorded.'} />
        <TextBlock label="Supporting Evidence" value={recommendation.supportingEvidence.length ? recommendation.supportingEvidence.join(' • ') : 'No evidence recorded.'} />
        <TextBlock label="Recommended Next Action" value={recommendation.recommendedNextAction} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <InfoTile label="Requires CEO Approval" value={recommendation.requiresCEOApproval ? 'Yes' : 'No'} />
        <InfoTile label="Created" value={new Date(recommendation.createdAt).toLocaleString()} />
        <InfoTile label="Updated" value={new Date(recommendation.updatedAt).toLocaleString()} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="eyebrow mb-3">Recommendation History</p>
        <div className="space-y-2">
          {recommendation.history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-line bg-ink/30 px-3 py-2 text-xs">
              <span className="text-[#c3cbc7]">{item.event}</span>
              <span className="text-muted">{item.status} • {new Date(item.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <button onClick={onApprove} className="btn-secondary">Approve</button>
        <button onClick={onReject} className="rounded-lg border border-[#ff9e8f]/30 px-3 py-2 text-xs text-[#ff9e8f] hover:border-[#ff9e8f]/70">Reject</button>
        <button onClick={onAddToRoadmap} className="btn-secondary">Add to Roadmap</button>
        <button onClick={onConvertToIssue} className="btn-secondary">Convert to AO Issue</button>
        <button onClick={onSaveToMemory} className="btn-secondary">Save to Memory</button>
      </div>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-line bg-ink/25 p-3">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="m-0 line-clamp-2 text-sm font-semibold text-white">{value}</p>
    </section>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.025] p-3">
      <p className="eyebrow mb-1">{label}</p>
      <p className="m-0 font-semibold text-white">{value}</p>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="m-0 text-xs leading-5 text-muted">{value}</p>
    </div>
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

function CTORecommendationStatusBadge({ status }: { status: CTORecommendation['status'] }) {
  const className = status === 'Needs Approval'
    ? 'border-orange-400/30 bg-orange-400/10 text-orange-300'
    : status === 'Approved' || status === 'Added to Roadmap' || status === 'Converted to AO Issue' || status === 'Saved to Memory'
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
