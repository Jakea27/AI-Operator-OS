import {
  ProviderAvailability,
  ProviderCapability,
  ProviderInputSupport,
  ProviderModelCostMetadata,
  ProviderModelInput,
  ProviderModelRecord,
  ProviderOutputSupport,
  ProviderRuntime,
} from './providerTypes'

export type ModelDiscoverySource = 'Future Adapter' | 'Ollama Adapter' | 'Imported Metadata' | 'Manual Entry' | 'Stored Metadata' | 'Unknown'

export type ModelDiscoveryOutcome =
  | 'Models Discovered'
  | 'No Models Discovered'
  | 'Provider Unavailable'
  | 'Provider Not Configured'
  | 'Discovery Unsupported'
  | 'Invalid Discovery Response'
  | 'Partial Discovery'

export type ModelDiscoveryWarningCode =
  | 'Unknown Capability Ignored'
  | 'Unknown Input Modality Ignored'
  | 'Unknown Output Modality Ignored'
  | 'Context Metadata Missing'
  | 'Cost Metadata Missing'
  | 'Duplicate Model'
  | 'Partial Metadata'

export type ModelDiscoveryFailureCode =
  | 'Provider Not Found'
  | 'Provider Unavailable'
  | 'Provider Not Configured'
  | 'Discovery Unsupported'
  | 'Invalid Discovery Response'
  | 'Missing Model Identifier'
  | 'Missing Display Name'
  | 'Invalid Runtime'
  | 'Invalid Context Metadata'

export type ModelDiscoveryRequest = {
  discoveryRequestId: string
  providerRecordId: string
  source: ModelDiscoverySource
  requestedAt: string
  metadata?: Record<string, string | number | boolean | undefined>
}

export type DiscoveredProviderModel = {
  discoveredModelId: string
  displayName?: string
  modelName?: string
  modelFamily?: string
  modelVersion?: string
  contextWindowTokens?: number
  maxInputTokens?: number
  maxOutputTokens?: number
  inputModalities?: ProviderInputSupport[]
  outputModalities?: ProviderOutputSupport[]
  supportedCapabilities?: ProviderCapability[]
  toolUseSupported?: boolean
  structuredOutputSupported?: boolean
  runtime?: ProviderRuntime
  costMetadata?: ProviderModelCostMetadata
  availability?: ProviderAvailability
  discoveredAt?: string
  metadata?: Record<string, string | number | boolean | undefined>
}

export type NormalizedDiscoveredModel = {
  discoveryModelId: string
  providerRecordId: string
  providerId: string
  modelInput: ProviderModelInput
  discoveredAt: string
  source: ModelDiscoverySource
  warningCodes: ModelDiscoveryWarningCode[]
  metadata: Record<string, string | number | boolean | undefined>
}

export type ModelDiscoveryNormalizationResult =
  | {
    status: 'Normalized'
    normalizedModel: NormalizedDiscoveredModel
    warningCodes: ModelDiscoveryWarningCode[]
    failureCodes: []
  }
  | {
    status: 'Rejected'
    normalizedModel?: undefined
    warningCodes: ModelDiscoveryWarningCode[]
    failureCodes: ModelDiscoveryFailureCode[]
  }

export type ModelDiscoverySubmission = ModelDiscoveryRequest & {
  outcome: ModelDiscoveryOutcome
  models: DiscoveredProviderModel[]
  warningCodes?: ModelDiscoveryWarningCode[]
  failureCodes?: ModelDiscoveryFailureCode[]
}

export type ModelRegistrationPlanStatus = 'Add' | 'Update' | 'Unchanged' | 'Rejected'

export type ModelRegistrationPlanItem = {
  status: ModelRegistrationPlanStatus
  discoveredModel?: DiscoveredProviderModel
  normalizedModel?: NormalizedDiscoveredModel
  existingModel?: ProviderModelRecord
  warningCodes: ModelDiscoveryWarningCode[]
  failureCodes: ModelDiscoveryFailureCode[]
}

export type ModelRegistrationPlan = {
  providerRecordId: string
  providerId?: string
  discoveryRequestId: string
  source: ModelDiscoverySource
  outcome: ModelDiscoveryOutcome
  generatedAt: string
  items: ModelRegistrationPlanItem[]
  addedCount: number
  updatedCount: number
  unchangedCount: number
  rejectedCount: number
  warningCount: number
  failureCount: number
}

export type ModelRegistrationApplyResult = {
  added: ProviderModelRecord[]
  updated: ProviderModelRecord[]
  skipped: ModelRegistrationPlanItem[]
  rejected: ModelRegistrationPlanItem[]
}
