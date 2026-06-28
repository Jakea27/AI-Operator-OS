export type AutomationType =
  | 'Research'
  | 'Content'
  | 'Money'
  | 'Store'
  | 'Product'
  | 'Marketing'
  | 'Operations'
  | 'Roadmap'
  | 'Approval'
  | 'Memory'
  | 'System'
  | 'Other'

export type AutomationCategory =
  | 'Dropshipping'
  | 'YouTube'
  | 'TikTok'
  | 'Affiliate'
  | 'SaaS'
  | 'Local Business'
  | 'Internal OS'
  | 'Finance'
  | 'Marketing'
  | 'Research'
  | 'Operations'

export type AutomationSource =
  | 'Manual'
  | 'Operator'
  | 'Coordinator'
  | 'Recommendation'
  | 'Roadmap'
  | 'Approval Queue'

export type AutomationSourceOperator =
  | 'CTO'
  | 'CFO'
  | 'CMO'
  | 'COO'
  | 'Research'
  | 'System'
  | 'Unassigned'

export type AutomationPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type AutomationRisk = 'Low' | 'Medium' | 'High' | 'Critical'

export type AutomationStatus =
  | 'Draft'
  | 'Queued'
  | 'Needs Approval'
  | 'Approved'
  | 'Ready'
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Blocked'
  | 'Archived'

export type AutomationHistoryItem = {
  id: string
  action: string
  actor: string
  note: string
  createdAt: string
}

export type AutomationRecord = {
  id: string
  title: string
  description: string
  type: AutomationType
  category: AutomationCategory
  source: AutomationSource
  sourceOperator: AutomationSourceOperator
  relatedBusiness: string
  relatedIssue: string
  relatedApprovalId: string
  relatedRoadmapItemId: string
  priority: AutomationPriority
  risk: AutomationRisk
  status: AutomationStatus
  requiresCEOApproval: boolean
  canAutoExecute: boolean
  createdAt: string
  updatedAt: string
  queuedAt: string | null
  approvedAt: string | null
  completedAt: string | null
  history: AutomationHistoryItem[]
}

export type AutomationInput = Partial<Omit<AutomationRecord, 'id' | 'createdAt' | 'updatedAt' | 'history'>> & {
  title: string
  description: string
  history?: AutomationHistoryItem[]
}

export type AutomationFilters = {
  search?: string
  type?: 'All' | AutomationType
  category?: 'All' | AutomationCategory
  source?: 'All' | AutomationSource
  sourceOperator?: 'All' | AutomationSourceOperator
  priority?: 'All' | AutomationPriority
  risk?: 'All' | AutomationRisk
  status?: 'All' | AutomationStatus
  requiresCEOApproval?: 'All' | boolean
  sort?: 'newest' | 'oldest' | 'updated' | 'priority' | 'risk'
}

export type AutomationStoreState = {
  version: 1
  automations: AutomationRecord[]
}

export type AutomationStats = {
  total: number
  draft: number
  queued: number
  needsApproval: number
  approved: number
  ready: number
  running: number
  completed: number
  failed: number
  blocked: number
  archived: number
  requiresCEOApproval: number
  canAutoExecute: number
  byRisk: Record<AutomationRisk, number>
  byType: Record<AutomationType, number>
}

export const automationTypes: AutomationType[] = [
  'Research',
  'Content',
  'Money',
  'Store',
  'Product',
  'Marketing',
  'Operations',
  'Roadmap',
  'Approval',
  'Memory',
  'System',
  'Other',
]

export const automationCategories: AutomationCategory[] = [
  'Dropshipping',
  'YouTube',
  'TikTok',
  'Affiliate',
  'SaaS',
  'Local Business',
  'Internal OS',
  'Finance',
  'Marketing',
  'Research',
  'Operations',
]

export const automationSources: AutomationSource[] = [
  'Manual',
  'Operator',
  'Coordinator',
  'Recommendation',
  'Roadmap',
  'Approval Queue',
]

export const automationSourceOperators: AutomationSourceOperator[] = [
  'CTO',
  'CFO',
  'CMO',
  'COO',
  'Research',
  'System',
  'Unassigned',
]

export const automationPriorities: AutomationPriority[] = ['Low', 'Medium', 'High', 'Critical']

export const automationRisks: AutomationRisk[] = ['Low', 'Medium', 'High', 'Critical']

export const automationStatuses: AutomationStatus[] = [
  'Draft',
  'Queued',
  'Needs Approval',
  'Approved',
  'Ready',
  'Running',
  'Completed',
  'Failed',
  'Blocked',
  'Archived',
]

