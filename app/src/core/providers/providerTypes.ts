export type ProviderType = 'Local' | 'Cloud' | 'Hybrid' | 'Custom'

export type ProviderRuntime = 'Local' | 'Cloud' | 'Hybrid'

export type ProviderStatus =
  | 'Unconfigured'
  | 'Configured'
  | 'Unavailable'
  | 'Available'
  | 'Degraded'
  | 'Disabled'
  | 'Error'

export type ProviderSource = 'Built In' | 'User Defined' | 'Imported' | 'Future Integration'

export type ProviderCapability =
  | 'Text Generation'
  | 'Coding'
  | 'Reasoning'
  | 'Vision'
  | 'Image Generation'
  | 'Embeddings'
  | 'Transcription'
  | 'Speech Generation'
  | 'Tool Use'
  | 'Long Context'
  | 'Structured Output'

export type ProviderHealthStatus =
  | 'Unknown'
  | 'Healthy'
  | 'Degraded'
  | 'Unavailable'
  | 'Misconfigured'
  | 'Disabled'
  | 'Error'
  | 'Not Checked'

export type ProviderAvailability = 'Unknown' | 'Available' | 'Unavailable' | 'Limited'

export type ProviderConfigurationStatus = 'Not Configured' | 'Configured' | 'Invalid' | 'Needs Validation'

export type ProviderInputSupport = 'Text' | 'Image' | 'Audio' | 'File' | 'Structured Data'

export type ProviderOutputSupport = 'Text' | 'Image' | 'Audio' | 'Embeddings' | 'Structured Data' | 'Code'

export type ProviderUsageUnit = 'Token' | 'Character' | 'Request' | 'Second' | 'Image' | 'Audio Minute' | 'Unknown'

export type ProviderSpeedTier = 'Unknown' | 'Fast' | 'Balanced' | 'Slow'

export type ProviderQualityTier = 'Unknown' | 'High' | 'Balanced' | 'Experimental'

export type ProviderPrivacyRequirement = 'Any' | 'Local Only' | 'No Training' | 'Business Approved'

export type ProviderPriority = 'Low' | 'Medium' | 'High' | 'Preferred'

export type ProviderId = string

export type ProviderModelId = string

export type ProviderCapabilityDefinition = {
  id: string
  capabilityId: string
  name: ProviderCapability
  description: string
  createdAt: string
  updatedAt: string
}

export type ProviderRecord = {
  id: string
  providerId: ProviderId
  name: string
  type: ProviderType
  status: ProviderStatus
  source: ProviderSource
  description: string
  enabled: boolean
  runtime: ProviderRuntime
  supportedCapabilities: ProviderCapability[]
  createdAt: string
  updatedAt: string
}

export type ProviderModelContextLimits = {
  maxInputTokens?: number
  maxOutputTokens?: number
  maxContextTokens?: number
  notes?: string
}

export type ProviderModelCostMetadata = {
  currency: string
  inputUnit?: ProviderUsageUnit
  outputUnit?: ProviderUsageUnit
  estimatedInputCostPerUnit?: number
  estimatedOutputCostPerUnit?: number
  notes?: string
}

export type ProviderModelPerformanceMetadata = {
  speedTier: ProviderSpeedTier
  qualityTier: ProviderQualityTier
  latencyMs?: number
  notes?: string
}

export type ProviderModelRecord = {
  id: string
  modelId: ProviderModelId
  providerRecordId: string
  providerId: ProviderId
  displayName: string
  modelName: string
  enabled: boolean
  runtime: ProviderRuntime
  supportedCapabilities: ProviderCapability[]
  contextLimits?: ProviderModelContextLimits
  inputSupport: ProviderInputSupport[]
  outputSupport: ProviderOutputSupport[]
  costMetadata?: ProviderModelCostMetadata
  performanceMetadata?: ProviderModelPerformanceMetadata
  availability: ProviderAvailability
  health: ProviderHealthStatus
  createdAt: string
  updatedAt: string
}

export type ProviderConfigurationRecord = {
  id: string
  configurationId: string
  providerRecordId: string
  providerId: ProviderId
  endpoint?: string
  apiKeyRequired: boolean
  configured: boolean
  localHost?: string
  environmentVariableReference?: string
  connectionTimeoutMs: number
  preferredModelId?: ProviderModelId
  validationStatus: ProviderConfigurationStatus
  lastValidatedAt?: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProviderHealthRecord = {
  id: string
  healthId: string
  providerRecordId: string
  providerId: ProviderId
  status: ProviderHealthStatus
  lastCheckedAt?: string
  responseTimeMs?: number
  lastSuccessfulCheckAt?: string
  lastError?: string
  consecutiveFailures: number
  availability: ProviderAvailability
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProviderUsageSummary = {
  id: string
  usageId: string
  providerRecordId: string
  providerId: ProviderId
  modelRecordId?: string
  modelId?: ProviderModelId
  executionRecordId?: string
  executionId?: string
  requests: number
  inputUnits: number
  outputUnits: number
  unit: ProviderUsageUnit
  estimatedCost: number
  actualCost: number
  currency: string
  periodStart: string
  periodEnd: string
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProviderSelectionPolicy = {
  id: string
  policyId: string
  name: string
  description: string
  requiredCapabilities: ProviderCapability[]
  providerPriority: ProviderPriority
  maximumEstimatedCost?: number
  currency: string
  localOnly: boolean
  cloudAllowed: boolean
  privacyRequirement: ProviderPrivacyRequirement
  speedPriority: ProviderPriority
  qualityPriority: ProviderPriority
  fallbackAllowed: boolean
  preferredProviderId?: ProviderId
  excludedProviderIds: ProviderId[]
  createdAt: string
  updatedAt: string
}

export type ProviderStoreState = {
  providers: ProviderRecord[]
  models: ProviderModelRecord[]
  configurations: ProviderConfigurationRecord[]
  healthRecords: ProviderHealthRecord[]
  usageSummaries: ProviderUsageSummary[]
  selectionPolicies: ProviderSelectionPolicy[]
}

export type ProviderInput = {
  name: string
  type: ProviderType
  source?: ProviderSource
  description?: string
  runtime: ProviderRuntime
  supportedCapabilities?: ProviderCapability[]
  enabled?: boolean
  status?: ProviderStatus
}

export type ProviderUpdate = Partial<Omit<ProviderRecord, 'id' | 'providerId' | 'createdAt' | 'updatedAt'>>

export type ProviderModelInput = {
  providerRecordId: string
  displayName: string
  modelName: string
  runtime: ProviderRuntime
  supportedCapabilities?: ProviderCapability[]
  enabled?: boolean
  contextLimits?: ProviderModelContextLimits
  inputSupport?: ProviderInputSupport[]
  outputSupport?: ProviderOutputSupport[]
  costMetadata?: ProviderModelCostMetadata
  performanceMetadata?: ProviderModelPerformanceMetadata
  availability?: ProviderAvailability
  health?: ProviderHealthStatus
}

export type ProviderModelUpdate = Partial<Omit<ProviderModelRecord, 'id' | 'modelId' | 'providerRecordId' | 'providerId' | 'createdAt' | 'updatedAt'>>

export type ProviderConfigurationInput = {
  providerRecordId: string
  endpoint?: string
  apiKeyRequired?: boolean
  configured?: boolean
  localHost?: string
  environmentVariableReference?: string
  connectionTimeoutMs?: number
  preferredModelId?: ProviderModelId
  validationStatus?: ProviderConfigurationStatus
  notes?: string
}

export type ProviderHealthInput = {
  providerRecordId: string
  status?: ProviderHealthStatus
  responseTimeMs?: number
  lastError?: string
  consecutiveFailures?: number
  availability?: ProviderAvailability
  notes?: string
}

export type ProviderUsageInput = {
  providerRecordId: string
  modelRecordId?: string
  executionRecordId?: string
  executionId?: string
  requests?: number
  inputUnits?: number
  outputUnits?: number
  unit?: ProviderUsageUnit
  estimatedCost?: number
  actualCost?: number
  currency?: string
  periodStart: string
  periodEnd: string
  notes?: string
}

export type ProviderSelectionPolicyInput = {
  name: string
  description?: string
  requiredCapabilities?: ProviderCapability[]
  providerPriority?: ProviderPriority
  maximumEstimatedCost?: number
  currency?: string
  localOnly?: boolean
  cloudAllowed?: boolean
  privacyRequirement?: ProviderPrivacyRequirement
  speedPriority?: ProviderPriority
  qualityPriority?: ProviderPriority
  fallbackAllowed?: boolean
  preferredProviderId?: ProviderId
  excludedProviderIds?: ProviderId[]
}
