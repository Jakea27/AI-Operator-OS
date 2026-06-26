import { buildOperatorEvents } from './operatorEvents'
import { getOperatorMemory, summarizeOperatorMemory } from './operatorMemory'
import { deriveSystemTasks, getOpenOperatorTasks } from './operatorTasks'
import { AIOperator, OperatorLocalState, OperatorSharedContext } from './operatorTypes'

export function hydrateOperator(operator: AIOperator, context: OperatorSharedContext, localState?: OperatorLocalState): AIOperator {
  const derivedTasks = deriveSystemTasks(operator, context)
  const localTasks = localState?.tasks[operator.id] ?? []
  const localRecommendations = localState?.recommendations[operator.id] ?? []
  const existingIds = new Set([...operator.taskQueue, ...localTasks].map((task) => task.id))
  const taskQueue = [
    ...derivedTasks.filter((task) => !existingIds.has(task.id)),
    ...localTasks,
    ...operator.taskQueue,
  ]
  const currentTask = operator.currentTask ?? taskQueue.find((task) => task.status === 'active') ?? taskQueue.find((task) => task.status === 'queued') ?? null
  const currentStatus = currentTask?.status === 'waiting'
      ? 'Waiting'
      : currentTask?.status === 'blocked'
        ? 'Blocked'
        : currentTask
          ? 'Working'
          : operator.currentStatus

  return {
    ...operator,
    currentStatus,
    currentTask,
    taskQueue,
    recommendationHistory: [
      ...localRecommendations,
      ...operator.recommendationHistory,
    ],
  }
}

export function getOperatorSnapshot(operator: AIOperator, context: OperatorSharedContext, localState?: OperatorLocalState) {
  const hydrated = hydrateOperator(operator, context, localState)
  return {
    operator: hydrated,
    openTasks: getOpenOperatorTasks(hydrated),
    relevantMemory: getOperatorMemory(hydrated, context),
    memorySummary: summarizeOperatorMemory(hydrated, context),
    events: buildOperatorEvents(hydrated),
  }
}
