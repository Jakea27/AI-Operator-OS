import { queryBusinessMemory } from '@/src/core/memory'
import { AIOperator, OperatorSharedContext } from './operatorTypes'

export function getOperatorMemory(operator: AIOperator, context: OperatorSharedContext) {
  if (!operator.memoryAccess.canReadBusinessMemory) return []
  return queryBusinessMemory(context.memories, {
    types: operator.memoryAccess.preferredTypes,
    categories: operator.memoryAccess.preferredCategories,
    archived: false,
    limit: 6,
  })
}

export function summarizeOperatorMemory(operator: AIOperator, context: OperatorSharedContext) {
  const memories = getOperatorMemory(operator, context)
  if (memories.length === 0) return 'No matching Business Memory context has been captured yet.'
  return memories.map((memory) => `${memory.type}: ${memory.title}`).join(' • ')
}
