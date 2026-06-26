import type { MemoryEntry, MemorySearchQuery } from '@/src/core/memory'
import type { OperatingMetrics, OperatingState } from '@/src/services/operatingStore'
import type { DailyBriefing } from '@/src/services/briefing/briefingEngine'

export type OperatorId = 'cto' | 'cfo' | 'cmo' | 'coo' | 'research'

export type OperatorStatus =
  | 'Working'
  | 'Idle'
  | 'Waiting'
  | 'Analyzing'
  | 'Needs Context'
  | 'Blocked'

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
export type OperatorTaskPriority = 'Low' | 'Medium' | 'High'

export type OperatorTask = {
  id: string
  title: string
  description: string
  priority: OperatorTaskPriority
  status: OperatorTaskStatus
  createdAt: string
  completedAt?: string
  source: 'system' | 'operator' | 'coordinator' | 'ceo'
  requiresApproval: boolean
  relatedMemoryId?: string
  relatedIssue?: string
}

export type OperatorRecommendationStatus = 'Draft' | 'Needs Approval' | 'Accepted' | 'Rejected'

export type OperatorRecommendation = {
  id: string
  title: string
  summary: string
  rationale: string
  createdAt: string
  source: string
  status: OperatorRecommendationStatus
  confidence: 'Low' | 'Medium' | 'High'
  riskLevel: 'Low' | 'Medium' | 'High'
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
  source: string
  status: string
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

export type OperatorLocalState = {
  version: 1
  tasks: Record<OperatorId, OperatorTask[]>
  recommendations: Record<OperatorId, OperatorRecommendation[]>
}

export type OperatorWorkspaceContextCounts = {
  businessMemory: number
  moneyRecords: number
  ceoBriefing: number
  developmentItems: number
  approvalQueue: number
}
