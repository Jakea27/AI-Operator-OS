export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived'

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type ProjectTimelineItem = {
  id: string
  message: string
  createdAt: string
}

export type BusinessAssetType = 'YouTube Video'

export type BusinessAssetProductionStatus = 'Planning' | 'Ready' | 'In Production' | 'Review' | 'Approved' | 'Packaged' | 'Archived'

export type BusinessAssetProductionStage = 'Intake' | 'Brief' | 'Research' | 'Production Planning' | 'Drafting' | 'Review' | 'Approved' | 'Packaged'

export type BusinessAssetProfile = {
  enabled: boolean
  assetType: BusinessAssetType
  platform: string
  topic: string
  goal: string
  targetAudience: string
  tone: string
  targetLength: string
  additionalNotes: string
  currentProductionStage: BusinessAssetProductionStage
  productionStatus: BusinessAssetProductionStatus
  departmentId: string
  departmentName: string
  createdAt: string
  updatedAt: string
  metadata: Record<string, string>
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
  businessAsset?: BusinessAssetProfile
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
  businessAsset?: BusinessAssetProfile
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
  | 'businessAsset'
>>

export const businessAssetTypes: BusinessAssetType[] = ['YouTube Video']

export const businessAssetProductionStatuses: BusinessAssetProductionStatus[] = ['Planning', 'Ready', 'In Production', 'Review', 'Approved', 'Packaged', 'Archived']

export const businessAssetProductionStages: BusinessAssetProductionStage[] = ['Intake', 'Brief', 'Research', 'Production Planning', 'Drafting', 'Review', 'Approved', 'Packaged']
