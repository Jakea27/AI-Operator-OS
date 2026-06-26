import type { MemoryEntry } from '@/src/core/memory'
import type { OperatingState } from '@/src/services/operatingStore'
import type { DailyBriefing } from '@/src/services/briefing/briefingEngine'
import type { OperatorLocalState } from '../operatorTypes'

export const ctoRecommendationTypes = [
  'Architecture',
  'Feature',
  'Bug',
  'Optimization',
  'Security',
  'Performance',
  'Business',
  'Automation',
] as const

export type CTORecommendationType = (typeof ctoRecommendationTypes)[number]

export type CTORecommendationStatus =
  | 'Draft'
  | 'Needs Approval'
  | 'Approved'
  | 'Rejected'
  | 'Changes Requested'
  | 'Deferred'
  | 'Archived'
  | 'Added to Roadmap'
  | 'Converted to AO Issue'
  | 'Saved to Memory'

export type CTORecommendationRisk = 'Low' | 'Medium' | 'High'
export type CTORecommendationConfidence = 'Low' | 'Medium' | 'High'
export type CTORecommendationEffort = 'Small' | 'Medium' | 'Large'

export type CTORecommendation = {
  id: string
  type: CTORecommendationType
  title: string
  summary: string
  reasoning: string
  businessValue: string
  estimatedEffort: CTORecommendationEffort
  dependencies: string[]
  risk: CTORecommendationRisk
  confidence: CTORecommendationConfidence
  supportingEvidence: string[]
  recommendedNextAction: string
  requiresCEOApproval: boolean
  status: CTORecommendationStatus
  createdAt: string
  updatedAt: string
  history: CTORecommendationHistoryItem[]
}

export type CTORecommendationHistoryItem = {
  id: string
  event: string
  status: CTORecommendationStatus
  createdAt: string
}

export type CTORecommendationInputContext = {
  operatingState: OperatingState
  memories: MemoryEntry[]
  briefing: DailyBriefing | null
  operatorState: OperatorLocalState
}

export type CTORecommendationStoreState = {
  version: 1
  recommendations: CTORecommendation[]
}
