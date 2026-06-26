import { AIOperator, OperatorEvent } from './operatorTypes'

export function buildOperatorEvents(operator: AIOperator): OperatorEvent[] {
  const events: OperatorEvent[] = []
  if (operator.currentTask) {
    events.push({
      id: `${operator.id}-event-current-task`,
      operatorId: operator.id,
      type: 'task',
      message: `Current task: ${operator.currentTask.title}`,
      createdAt: operator.currentTask.createdAt,
    })
  }
  operator.recommendationHistory.slice(0, 3).forEach((recommendation) => {
    events.push({
      id: `${operator.id}-event-${recommendation.id}`,
      operatorId: operator.id,
      type: 'recommendation',
      message: recommendation.summary,
      createdAt: recommendation.createdAt,
    })
  })
  return events
}
