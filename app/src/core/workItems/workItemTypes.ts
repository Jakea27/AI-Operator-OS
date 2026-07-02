export type WorkItemStatus = 'Planning' | 'Ready' | 'In Progress' | 'Blocked' | 'Review' | 'Completed' | 'Archived'

export type WorkItemPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type WorkItemTimelineItem = {
  id: string
  message: string
  createdAt: string
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
>>
