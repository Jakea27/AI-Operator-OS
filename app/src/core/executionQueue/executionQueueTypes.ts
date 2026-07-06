export type ExecutionQueueStatus = 'Queued' | 'Waiting Approval' | 'Ready' | 'Blocked' | 'Completed' | 'Archived'

export type ExecutionType = 'Manual' | 'Draft' | 'Review' | 'Future AI' | 'Future Automation'

export type ExecutionQueuePriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ExecutionQueueTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type ExecutionQueueRecord = {
  id: string
  queueId: string
  sourceWorkItemRecordId: string
  sourceWorkItemId: string
  workItemTitle: string
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  operatorId?: string
  operatorCode?: string
  operatorName: string
  queueStatus: ExecutionQueueStatus
  priority: ExecutionQueuePriority
  executionType: ExecutionType
  requiresApproval: boolean
  notes: string
  placeholderResult: string
  createdAt: string
  updatedAt: string
  timeline: ExecutionQueueTimelineItem[]
}

export type ExecutionQueueInput = {
  sourceWorkItemRecordId: string
  sourceWorkItemId: string
  workItemTitle: string
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  operatorId?: string
  operatorCode?: string
  operatorName: string
  queueStatus: ExecutionQueueStatus
  priority: ExecutionQueuePriority
  executionType: ExecutionType
  requiresApproval: boolean
  notes: string
}

export type ExecutionQueueUpdate = Partial<Pick<
  ExecutionQueueRecord,
  'queueStatus' | 'priority' | 'executionType' | 'requiresApproval' | 'notes'
>>
