export type ApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Changes Requested' | 'Deferred' | 'Archived'

export type ApprovalPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ApprovalEffort = 'Low' | 'Medium' | 'High'

export type ApprovalRisk = 'Low' | 'Medium' | 'High'

export type ApprovalOperator = 'CTO' | 'CFO' | 'CMO' | 'COO' | 'Research' | 'System'

export type Approval = {
  id: string
  title: string
  description: string
  submittedBy: string
  operator: ApprovalOperator
  department: string
  relatedIssue: string
  recommendationId: string
  priority: ApprovalPriority
  effort: ApprovalEffort
  risk: ApprovalRisk
  status: ApprovalStatus
  requiresCEOApproval: boolean
  created: string
  updated: string
  submittedAt?: string
  decidedAt?: string
  decision?: string
  decisionNote?: string
  businessValue?: string
  supportingEvidence?: string[]
  recommendedNextAction?: string
  decisionHistory: ApprovalDecisionHistoryItem[]
}

export type ApprovalDecisionHistoryItem = {
  id: string
  action: ApprovalStatus | 'Submitted'
  actor: string
  note: string
  createdAt: string
}

export type ApprovalInput = Omit<Approval, 'id' | 'created' | 'updated' | 'decisionHistory'>

export type ApprovalFilters = {
  search: string
  status: 'All' | ApprovalStatus
  operator: 'All' | ApprovalOperator
  priority: 'All' | ApprovalPriority
  risk: 'All' | ApprovalRisk
  sort: 'newest' | 'oldest'
}

export const approvalStatuses: ApprovalStatus[] = ['Draft', 'Pending', 'Approved', 'Rejected', 'Changes Requested', 'Deferred', 'Archived']

export const approvalPriorities: ApprovalPriority[] = ['Low', 'Medium', 'High', 'Critical']

export const approvalOperators: ApprovalOperator[] = ['CTO', 'CFO', 'CMO', 'COO', 'Research', 'System']
