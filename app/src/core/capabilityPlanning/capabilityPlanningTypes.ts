export type CapabilityReadinessStatus = 'Draft' | 'Incomplete' | 'Ready for Review' | 'Approved' | 'Blocked' | 'Archived'

export type CapabilityRequirementPriority = 'Required' | 'Optional'

export type CapabilityRequirement = {
  id: string
  name: string
  category: string
  priority: CapabilityRequirementPriority
  notes: string
}

export type ProviderCandidate = {
  id: string
  name: string
  category: string
  notes: string
}

export type CapabilityToolRequirement = {
  id: string
  name: string
  category: string
  notes: string
}

export type CapabilityPermissionRequirement = {
  id: string
  name: string
  notes: string
}

export type CapabilityOperatorRequirement = {
  id: string
  role: string
  notes: string
}

export type CapabilityPlanHistoryItem = {
  id: string
  message: string
  createdAt: string
}

export type CapabilityPlanRecord = {
  id: string
  capabilityPlanId: string
  sourceQueueItemId: string
  sourceQueueCode: string
  sourceWorkItemId: string
  workItemTitle: string
  sourceProjectId: string
  sourceProjectCode: string
  projectName: string
  sourceBusinessId: string
  sourceBusinessCode: string
  businessName: string
  requiredCapabilities: CapabilityRequirement[]
  preferredProviders: ProviderCandidate[]
  requiredTools: CapabilityToolRequirement[]
  requiredPermissions: CapabilityPermissionRequirement[]
  requiredOperators: CapabilityOperatorRequirement[]
  estimatedCost: number
  estimatedRuntimeMinutes: number
  readinessStatus: CapabilityReadinessStatus
  missingRequirements: string[]
  notes: string
  createdAt: string
  updatedAt: string
  history: CapabilityPlanHistoryItem[]
}

export type CapabilityPlanInput = {
  sourceQueueItemId: string
  sourceQueueCode: string
  sourceWorkItemId: string
  workItemTitle: string
  sourceProjectId: string
  sourceProjectCode: string
  projectName: string
  sourceBusinessId: string
  sourceBusinessCode: string
  businessName: string
}

export type CapabilityPlanUpdate = Partial<Pick<
  CapabilityPlanRecord,
  | 'requiredCapabilities'
  | 'preferredProviders'
  | 'requiredTools'
  | 'requiredPermissions'
  | 'requiredOperators'
  | 'estimatedCost'
  | 'estimatedRuntimeMinutes'
  | 'readinessStatus'
  | 'notes'
>>
