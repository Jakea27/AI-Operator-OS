import { AIOperator, OperatorSharedContext, OperatorTask } from './operatorTypes'

export function getActiveOperatorTask(operator: AIOperator): OperatorTask | null {
  return operator.currentTask ?? operator.taskQueue.find((task) => task.status === 'active') ?? null
}

export function getOpenOperatorTasks(operator: AIOperator) {
  return operator.taskQueue.filter((task) => task.status !== 'done')
}

export function deriveSystemTasks(operator: AIOperator, context: OperatorSharedContext): OperatorTask[] {
  const now = new Date().toISOString()
  if (operator.id === 'cfo' && context.metrics.profit < 0) {
    return [{
      id: 'cfo-system-negative-profit',
      title: 'Review negative monthly profit',
      description: 'Monthly expenses exceed revenue in the local Money Department.',
      priority: 'High',
      status: 'queued',
      createdAt: now,
      source: 'system',
      requiresApproval: false,
    }]
  }
  if (operator.id === 'coo' && context.metrics.pendingApprovalCount > 0) {
    return [{
      id: 'coo-system-pending-approvals',
      title: 'Review pending approvals',
      description: `${context.metrics.pendingApprovalCount} approval item(s) are waiting for CEO review.`,
      priority: 'High',
      status: 'queued',
      createdAt: now,
      source: 'system',
      requiresApproval: true,
    }]
  }
  if (operator.id === 'cto' && context.metrics.sprintTotal > 0 && context.metrics.sprintProgress < 100) {
    return [{
      id: 'cto-system-sprint-progress',
      title: 'Support current sprint completion',
      description: `Sprint progress is ${context.metrics.sprintProgress}% based on local task records.`,
      priority: 'Medium',
      status: 'queued',
      createdAt: now,
      source: 'system',
      requiresApproval: false,
    }]
  }
  return []
}
