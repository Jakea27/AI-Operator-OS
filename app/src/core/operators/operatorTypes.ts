import type { MemoryEntry, MemorySearchQuery } from '@/src/core/memory'
import type { OperatingMetrics, OperatingState } from '@/src/services/operatingStore'
import type { DailyBriefing } from '@/src/services/briefing/briefingEngine'

export type OperatorId = 'cto' | 'cfo' | 'cmo' | 'coo' | 'research'

export type OperatorStatus =
  | 'Idle'
  | 'Thinking'
  | 'Waiting'
  | 'Blocked'
  | 'Needs Approval'
  | 'Completed'

export type OperatorApprovalLevel = 'None' | 'Low' | 'Medium' | 'High' | 'CEO Required'

export type OperatorTool =
  | 'Money Metrics'
  | 'Business Memory'
  | 'Daily Briefing'
  | 'Approval Queue'
  | 'Sprint Tasks'
  | 'Project Records'
  | 'Local Research Notes'

export type OperatorTaskStatus = 'queued' | 'active' | 'waiting' | 'blocked' | 'done'

export type OperatorTask = {
  id: string
  title: string
  description: string
  status: OperatorTaskStatus
  createdAt: string
  source: 'system' | 'operator' | 'ceo'
  requiresApproval: boolean
}

export type OperatorRecommendation = {
  id: string
  summary: string
  rationale: string
  createdAt: string
  requiresApproval: boolean
}

export type OperatorMemoryAccess = {
  canReadBusinessMemory: boolean
  preferredTypes: MemorySearchQuery['types']
  preferredCategories: string[]
  notes: string
}

export type OperatorEvent = {
  id: string
  operatorId: OperatorId
  type: 'status' | 'task' | 'recommendation' | 'memory'
  message: string
  createdAt: string
}

export type AIOperator = {
  id: OperatorId
  name: string
  role: string
  mission: string
  responsibilities: string[]
  availableTools: OperatorTool[]
  memoryAccess: OperatorMemoryAccess
  approvalLevel: OperatorApprovalLevel
  currentStatus: OperatorStatus
  currentTask: OperatorTask | null
  taskQueue: OperatorTask[]
  recommendationHistory: OperatorRecommendation[]
}

export type OperatorSharedContext = {
  operatingState: OperatingState
  metrics: OperatingMetrics
  memories: MemoryEntry[]
  briefing: DailyBriefing | null
  storageAvailable: boolean
}
