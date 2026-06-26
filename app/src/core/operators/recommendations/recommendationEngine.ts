import { queryBusinessMemory } from '@/src/core/memory'
import { CTORecommendationInputContext } from './recommendationTypes'

export function generateCTORecommendation(context: CTORecommendationInputContext) {
  const hasCoordinator = true
  const hasDedicatedApprovalPage = false
  const pendingApprovals = context.operatingState.approvals.filter((approval) => approval.status === 'pending').length
  const architectureMemories = queryBusinessMemory(context.memories, {
    types: ['Architecture', 'Decision', 'Business Rule', 'Bug'],
    archived: false,
    limit: 5,
  })
  const ctoTasks = context.operatorState.tasks.cto ?? []
  const openCtoTasks = ctoTasks.filter((task) => task.status !== 'done')

  if (hasCoordinator && !hasDedicatedApprovalPage) {
    return {
      type: 'Feature' as const,
      title: 'Build a dedicated Approval Queue workspace',
      summary: 'The Executive Coordinator now routes risky requests into approvals, but there is no dedicated Approval Queue workspace for reviewing and resolving those decisions.',
      reasoning: 'AO-004.3 introduced deterministic routing and risk handoff. The local operating store already supports pending approvals, and Dashboard/briefing surfaces counts, but approval work still lacks a focused department page. A dedicated Approval Queue reduces execution risk before automation expands.',
      businessValue: 'Improves CEO control, keeps consequential actions visible, and creates the foundation for safe operator-driven execution.',
      estimatedEffort: 'Medium' as const,
      dependencies: ['Existing operatingStore approvals', 'Executive Coordinator risk routing', 'CEO approval workflow'],
      risk: pendingApprovals > 0 ? 'Medium' as const : 'Low' as const,
      confidence: 'High' as const,
      supportingEvidence: [
        'Executive Coordinator service exists and can queue risky requests.',
        `${pendingApprovals} approval item(s) are currently pending.`,
        'No dedicated /approval route exists in the active router.',
      ],
      recommendedNextAction: 'Create AO-005 Approval Queue as the next operator-safe execution control surface.',
      requiresCEOApproval: false,
      status: 'Draft' as const,
    }
  }

  return {
    type: 'Architecture' as const,
    title: 'Stabilize local operator architecture before expanding automation',
    summary: 'Operator workspaces, memory, money, briefing, and coordinator services are now connected. The next technical move is to harden persistence and review flow before adding autonomy.',
    reasoning: 'The codebase has multiple local stores and deterministic operator services. Before adding reasoning or external integrations, the CTO should reduce local data risk and strengthen approval boundaries.',
    businessValue: 'Protects system reliability and keeps AI Operator OS safe as more operator capabilities are added.',
    estimatedEffort: 'Medium' as const,
    dependencies: ['Business Memory', 'Operator workspace store', 'Operating store', 'Approval workflow'],
    risk: openCtoTasks.length > 3 ? 'Medium' as const : 'Low' as const,
    confidence: architectureMemories.length > 0 ? 'High' as const : 'Medium' as const,
    supportingEvidence: [
      `${architectureMemories.length} relevant architecture/memory records found.`,
      `${openCtoTasks.length} open CTO task(s) found.`,
      context.briefing ? 'A CEO briefing snapshot is available.' : 'No saved CEO briefing snapshot is available.',
    ],
    recommendedNextAction: 'Define backup/export boundaries for local operating and memory stores.',
    requiresCEOApproval: false,
    status: 'Draft' as const,
  }
}
