export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived'

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ProjectTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type ProjectRecord = {
  id: string
  projectId: string
  name: string
  description: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  priority: ProjectPriority
  status: ProjectStatus
  progress: number
  startDate: string
  targetDate: string
  notes: string
  placeholderWorkItems: string
  openWorkItems: number
  createdAt: string
  updatedAt: string
  timeline: ProjectTimelineItem[]
}

export type ProjectInput = {
  name: string
  description: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  managerId?: string
  managerName: string
  priority: ProjectPriority
  status: ProjectStatus
  progress: number
  startDate: string
  targetDate: string
  notes: string
}

export type ProjectUpdate = Partial<Pick<
  ProjectRecord,
  | 'name'
  | 'description'
  | 'businessId'
  | 'businessCode'
  | 'businessName'
  | 'departmentId'
  | 'departmentCode'
  | 'departmentName'
  | 'managerId'
  | 'managerName'
  | 'priority'
  | 'status'
  | 'progress'
  | 'startDate'
  | 'targetDate'
  | 'notes'
>>
