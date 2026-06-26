import { getRegisteredOperators } from './operatorRegistry'
import { getOperatorSnapshot, hydrateOperator } from './operator'
import { AIOperator, OperatorId, OperatorLocalState, OperatorSharedContext, OperatorWorkspaceContextCounts } from './operatorTypes'

export function buildOperators(context: OperatorSharedContext, localState?: OperatorLocalState): AIOperator[] {
  return getRegisteredOperators().map((operator) => hydrateOperator(operator, context, localState))
}

export function getOperatorDetail(id: OperatorId, context: OperatorSharedContext, localState?: OperatorLocalState) {
  const operator = getRegisteredOperators().find((entry) => entry.id === id)
  return operator ? getOperatorSnapshot(operator, context, localState) : null
}

export function getLastRecommendation(operator: AIOperator) {
  return operator.recommendationHistory[0]?.summary ?? 'No recommendations generated yet.'
}

export function getOperatorContextCounts(context: OperatorSharedContext): OperatorWorkspaceContextCounts {
  return {
    businessMemory: context.memories.filter((memory) => !memory.archived).length,
    moneyRecords: context.operatingState.revenueEntries.length + context.operatingState.expenseEntries.length,
    ceoBriefing: context.briefing ? 1 : 0,
    developmentItems: context.operatingState.projects.length + context.operatingState.tasks.length,
    approvalQueue: context.operatingState.approvals.filter((approval) => approval.status === 'pending').length,
  }
}
