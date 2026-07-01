export type DepartmentName =
  | 'CEO'
  | 'Research'
  | 'Development'
  | 'Marketing'
  | 'Sales'
  | 'Finance'
  | 'Operations'
  | 'Customer Success'
  | 'Administration'
  | 'Content'

export type DepartmentStatus = 'Planning' | 'Ready' | 'Operating' | 'Paused' | 'Archived'

export type DepartmentHealth = 'Healthy' | 'Stable' | 'Watch' | 'At Risk' | 'Unrated'

export type DepartmentTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type DepartmentRecord = {
  id: string
  departmentId: string
  businessId: string
  businessCode: string
  businessName: string
  departmentName: DepartmentName
  manager: string
  status: DepartmentStatus
  health: DepartmentHealth
  projects: string
  operators: string
  metrics: string
  queue: string
  notes: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  timeline: DepartmentTimelineItem[]
}

export type DepartmentOwnerInput = {
  businessId: string
  businessCode: string
  businessName: string
}

export type CompanyStructureTemplate = {
  id: string
  name: string
  description: string
  departments: DepartmentName[]
}

