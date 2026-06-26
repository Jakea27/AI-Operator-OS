import { buildOperatorEvents } from './operatorEvents'
import { getOperatorMemory, summarizeOperatorMemory } from './operatorMemory'
import { deriveSystemTasks, getOpenOperatorTasks } from './operatorTasks'
import { AIOperator, OperatorSharedContext } from './operatorTypes'

export function hydrateOperator(operator: AIOperator, context: OperatorSharedContext): AIOperator {
  const derivedTasks = deriveSystemTasks(operator, context)
  const existingIds = new Set(operator.taskQueue.map((task) => task.id))
  const taskQueue = [
    ...derivedTasks.filter((task) => !existingIds.has(task.id)),
    ...operator.taskQueue,
  ]
  const currentTask = operator.currentTask ?? taskQueue.find((task) => task.status === 'active') ?? taskQueue.find((task) => task.status === 'queued') ?? null
  const currentStatus = currentTask?.requiresApproval
    ? 'Needs Approval'
    : currentTask?.status === 'waiting'
      ? 'Waiting'
      : currentTask?.status === 'blocked'
        ? 'Blocked'
        : operator.currentStatus

  return {
    ...operator,
    currentStatus,
    currentTask,
    taskQueue,
  }
}

export function getOperatorSnapshot(operator: AIOperator, context: OperatorSharedContext) {
  const hydrated = hydrateOperator(operator, context)
  return {
    operator: hydrated,
    openTasks: getOpenOperatorTasks(hydrated),
    relevantMemory: getOperatorMemory(hydrated, context),
    memorySummary: summarizeOperatorMemory(hydrated, context),
    events: buildOperatorEvents(hydrated),
  }
}
