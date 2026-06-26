import { getRegisteredOperators } from './operatorRegistry'
import { getOperatorSnapshot, hydrateOperator } from './operator'
import { AIOperator, OperatorId, OperatorSharedContext } from './operatorTypes'

export function buildOperators(context: OperatorSharedContext): AIOperator[] {
  return getRegisteredOperators().map((operator) => hydrateOperator(operator, context))
}

export function getOperatorDetail(id: OperatorId, context: OperatorSharedContext) {
  const operator = getRegisteredOperators().find((entry) => entry.id === id)
  return operator ? getOperatorSnapshot(operator, context) : null
}

export function getLastRecommendation(operator: AIOperator) {
  return operator.recommendationHistory[0]?.summary ?? 'No recommendations generated yet.'
}
