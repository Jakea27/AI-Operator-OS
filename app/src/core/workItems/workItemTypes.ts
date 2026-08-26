export type WorkItemStatus = 'Planning' | 'Ready' | 'In Progress' | 'Blocked' | 'Review' | 'Completed' | 'Archived'

export type WorkItemPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type WorkItemTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type WorkOrderType =
  | 'Generate Title'
  | 'Generate Hook'
  | 'Generate Script'
  | 'Generate Description'
  | 'Generate Tags'
  | 'Generate Thumbnail Concept'
  | 'Develop Creative Concepts'

export type WorkOrderStatus = 'Prepared' | 'Request Built' | 'Ready For Execution' | 'Completed' | 'Cancelled'

export type ExecutionRequestStatus = 'Built' | 'Invalid'

export type ExecutionRequestReference = {
  requestId: string
  status: ExecutionRequestStatus
  requestedCapability: string
  workItemRecordId: string
  workItemId: string
  projectId: string
  projectCode: string
  businessAssetProjectId: string
  blueprintDeliverableId: string
  blueprintDeliverableName: string
  knowledgeReferenceIds: string[]
  instructions: string
  outputRequirements: string
  correlationMetadata: Record<string, string>
  createdAt: string
}

export type WorkOrderProfile = {
  enabled: true
  workOrderId: string
  workOrderType: WorkOrderType
  status: WorkOrderStatus
  assetType: string
  platform: string
  businessAssetProjectId: string
  productionBlueprintType: string
  blueprintDeliverableId: string
  blueprintDeliverableName: string
  knowledgeReferenceIds: string[]
  executionRequest?: ExecutionRequestReference
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
}

export type WorkItemRecord = {
  id: string
  workItemId: string
  title: string
  description: string
  status: WorkItemStatus
  priority: WorkItemPriority
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  assignedManagerId?: string
  assignedManagerName: string
  assignedOperatorId?: string
  assignedOperatorCode?: string
  assignedOperatorName: string
  estimatedHours: number
  dueDate: string
  notes: string
  placeholderMetrics: string
  placeholderNotes: string
  createdAt: string
  updatedAt: string
  timeline: WorkItemTimelineItem[]
  workOrder?: WorkOrderProfile
}

export type WorkItemInput = {
  title: string
  description: string
  status: WorkItemStatus
  priority: WorkItemPriority
  businessId: string
  businessCode: string
  businessName: string
  projectId: string
  projectCode: string
  projectName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  assignedManagerId?: string
  assignedManagerName: string
  assignedOperatorId?: string
  assignedOperatorCode?: string
  assignedOperatorName: string
  estimatedHours: number
  dueDate: string
  notes: string
  workOrder?: WorkOrderProfile
}

export type WorkItemUpdate = Partial<Pick<
  WorkItemRecord,
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'assignedOperatorId'
  | 'assignedOperatorCode'
  | 'assignedOperatorName'
  | 'estimatedHours'
  | 'dueDate'
  | 'notes'
  | 'workOrder'
>>

export const workOrderTypes: WorkOrderType[] = [
  'Generate Title',
  'Generate Hook',
  'Generate Script',
  'Generate Description',
  'Generate Tags',
  'Generate Thumbnail Concept',
  'Develop Creative Concepts',
]

export const workOrderStatuses: WorkOrderStatus[] = ['Prepared', 'Request Built', 'Ready For Execution', 'Completed', 'Cancelled']
