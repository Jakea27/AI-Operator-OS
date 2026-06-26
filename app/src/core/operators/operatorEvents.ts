import { AIOperator, OperatorEvent } from './operatorTypes'

export function buildOperatorEvents(operator: AIOperator): OperatorEvent[] {
  const events: OperatorEvent[] = []
  operator.taskQueue.forEach((task) => {
    events.push({
      id: `${operator.id}-event-${task.id}`,
      operatorId: operator.id,
      type: 'task',
      message: task.status === 'done' ? `Task completed: ${task.title}` : `Task queued: ${task.title}`,
      source: task.source,
      status: task.status,
      createdAt: task.completedAt ?? task.createdAt,
    })
  })
  operator.recommendationHistory.forEach((recommendation) => {
    events.push({
      id: `${operator.id}-event-${recommendation.id}`,
      operatorId: operator.id,
      type: 'recommendation',
      message: `Recommendation generated: ${recommendation.title}`,
      source: recommendation.source,
      status: recommendation.status,
      createdAt: recommendation.createdAt,
    })
  })
  return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12)
}
