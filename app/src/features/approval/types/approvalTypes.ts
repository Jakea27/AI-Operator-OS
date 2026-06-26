export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Deferred' | 'Archived'

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
}

export type ApprovalInput = Omit<Approval, 'id' | 'created' | 'updated'>

export type ApprovalFilters = {
  search: string
  status: 'All' | ApprovalStatus
  operator: 'All' | ApprovalOperator
  priority: 'All' | ApprovalPriority
  sort: 'newest' | 'oldest'
}

export const approvalStatuses: ApprovalStatus[] = ['Pending', 'Approved', 'Rejected', 'Deferred', 'Archived']

export const approvalPriorities: ApprovalPriority[] = ['Low', 'Medium', 'High', 'Critical']

export const approvalOperators: ApprovalOperator[] = ['CTO', 'CFO', 'CMO', 'COO', 'Research', 'System']
