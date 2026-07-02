export type WorkforceOperatorStatus = 'Planning' | 'Ready' | 'Operating' | 'Paused' | 'Archived'

export type WorkforceOperatorHealth = 'Excellent' | 'Healthy' | 'Watch' | 'At Risk' | 'Unknown'

export type WorkforceOperatorTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type WorkforceOperatorRecord = {
  id: string
  operatorId: string
  name: string
  role: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  assignedManagerId?: string
  assignedManagerName: string
  status: WorkforceOperatorStatus
  health: WorkforceOperatorHealth
  primarySkill: string
  currentAssignment: string
  notes: string
  placeholderMetrics: string
  placeholderQueue: string
  createdAt: string
  updatedAt: string
  timeline: WorkforceOperatorTimelineItem[]
}

export type WorkforceOperatorInput = {
  name: string
  role: string
  businessId: string
  businessCode: string
  businessName: string
  departmentId: string
  departmentCode: string
  departmentName: string
  assignedManagerId?: string
  assignedManagerName: string
  status: WorkforceOperatorStatus
  health: WorkforceOperatorHealth
  primarySkill: string
  currentAssignment: string
  notes: string
}

export type WorkforceOperatorUpdate = Partial<Pick<
  WorkforceOperatorRecord,
  'name' | 'role' | 'status' | 'health' | 'primarySkill' | 'currentAssignment' | 'notes'
>>

