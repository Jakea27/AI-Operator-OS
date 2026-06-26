export type RoadmapPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type RoadmapStatus = 'backlog' | 'planned' | 'in-progress' | 'complete' | 'archived'

export type RoadmapSourceOperator = 'CTO' | 'CFO' | 'CMO' | 'COO' | 'Research'

export type RoadmapItem = {
  id: string
  title: string
  description: string
  sourceOperator: RoadmapSourceOperator
  priority: RoadmapPriority
  status: RoadmapStatus
  relatedIssue: string
  recommendationId?: string
  sourceApprovalId?: string
  approvalStatus?: string
  approvedAt?: string
  created: string
  updated: string
}

export type RoadmapItemInput = Omit<RoadmapItem, 'id' | 'created' | 'updated'>

export type RoadmapFilters = {
  search: string
  operator: 'All' | RoadmapSourceOperator
  priority: 'All' | RoadmapPriority
  status: 'All' | RoadmapStatus
  sort: 'newest' | 'oldest' | 'priority'
}

export const roadmapOperators: RoadmapSourceOperator[] = ['CTO', 'CFO', 'CMO', 'COO', 'Research']

export const roadmapPriorities: RoadmapPriority[] = ['Low', 'Medium', 'High', 'Critical']

export const roadmapStatuses: RoadmapStatus[] = ['backlog', 'planned', 'in-progress', 'complete', 'archived']
