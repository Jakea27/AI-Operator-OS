import {
  ProviderCapability,
  ProviderInputSupport,
  ProviderModelRecord,
  ProviderOutputSupport,
  ProviderPrivacyRequirement,
  ProviderPriority,
  ProviderRecord,
  ProviderRuntime,
} from './providerTypes'

export type CapabilityRequestingEntityType =
  | 'Department'
  | 'Manager'
  | 'Squad'
  | 'Worker'
  | 'Operator'
  | 'Workflow'
  | 'System'

export type CapabilityRequestReference = {
  entityType: CapabilityRequestingEntityType
  entityId: string
  displayName?: string
}

export type CapabilityRoutingMetadata = Record<string, string | number | boolean | undefined>

export type CapabilityRoutingRequest = {
  requestId: string
  requestedCapability: ProviderCapability
  additionalCapabilities?: ProviderCapability[]
  requestingEntity: CapabilityRequestReference
  workItemId?: string
  executionId?: string
  capabilityPlanId?: string
  requiredInputModalities?: ProviderInputSupport[]
  requiredOutputModalities?: ProviderOutputSupport[]
  minimumContextTokens?: number
  requiresStructuredOutput?: boolean
  requiresToolUse?: boolean
  localOnly?: boolean
  cloudAllowed?: boolean
  cloudOnly?: boolean
  privacyRequirement?: ProviderPrivacyRequirement
  maximumEstimatedCost?: number
  currency?: string
  speedPriority?: ProviderPriority
  qualityPriority?: ProviderPriority
  preferredProviderId?: string
  preferredProviderPolicyApproved?: boolean
  excludedProviderIds?: string[]
  fallbackAllowed?: boolean
  requestedAt: string
  metadata?: CapabilityRoutingMetadata
}

export type NormalizedCapabilityRoutingRequest = {
  requestId: string
  requiredCapabilities: ProviderCapability[]
  requestingEntity: CapabilityRequestReference
  workItemId?: string
  executionId?: string
  capabilityPlanId?: string
  requiredInputModalities: ProviderInputSupport[]
  requiredOutputModalities: ProviderOutputSupport[]
  minimumContextTokens?: number
  localOnly: boolean
  cloudAllowed: boolean
  cloudOnly: boolean
  privacyRequirement: ProviderPrivacyRequirement
  maximumEstimatedCost?: number
  currency: string
  speedPriority: ProviderPriority
  qualityPriority: ProviderPriority
  preferredProviderId?: string
  excludedProviderIds: string[]
  fallbackAllowed: boolean
  requestedAt: string
  metadata: CapabilityRoutingMetadata
}

export type CapabilityRoutingFailureCode =
  | 'Missing Request ID'
  | 'Missing Requesting Entity'
  | 'Missing Capability'
  | 'Unknown Capability'
  | 'Invalid Timestamp'
  | 'Invalid Cost Constraint'
  | 'Conflicting Runtime Constraints'
  | 'Preferred Provider Excluded'
  | 'Preferred Provider Not Approved'
  | 'No Configured Provider'
  | 'No Enabled Provider'
  | 'No Healthy Provider'
  | 'No Available Provider'
  | 'No Compatible Provider'
  | 'No Compatible Model'
  | 'Missing Capability Support'
  | 'Cost Constraint Failure'
  | 'Local Cloud Constraint Failure'
  | 'Privacy Constraint Failure'
  | 'Fallback Unavailable'
  | 'Human Review Required'

export type CapabilityRoutingWarningCode =
  | 'Fallback Candidates Available'
  | 'Preferred Provider Not Selected'
  | 'Provider Has Warnings'
  | 'Cost Metadata Missing'
  | 'Privacy Metadata Limited'
  | 'Model Metadata Limited'

export type CapabilityRoutingReason = {
  code: CapabilityRoutingFailureCode | CapabilityRoutingWarningCode | 'Provider Recommended'
  message: string
}

export type CapabilityRoutingProviderSnapshot = {
  providerId: string
  providerRecordId: string
  providerName: string
  runtime: ProviderRuntime
  score: number
  healthStatus: string
  availability: string
  configured: boolean
  matchedCapabilities: ProviderCapability[]
  modelIds: string[]
  modelRecordIds: string[]
  reasons: string[]
  warnings: string[]
}

export type CapabilityRoutingSuccessResult = {
  status: 'Routed'
  requestId: string
  normalizedRequest: NormalizedCapabilityRoutingRequest
  recommendedProviderId: string
  recommendedProviderRecordId: string
  recommendedModelId?: string
  recommendedModelRecordId?: string
  score: number
  matchedCapabilities: ProviderCapability[]
  providerState: CapabilityRoutingProviderSnapshot
  fallbackCandidates: CapabilityRoutingProviderSnapshot[]
  reasons: CapabilityRoutingReason[]
  warnings: CapabilityRoutingReason[]
  generatedAt: string
}

export type CapabilityRoutingFailureResult = {
  status: 'Unable To Route'
  requestId: string
  normalizedRequest?: NormalizedCapabilityRoutingRequest
  failureCodes: CapabilityRoutingFailureCode[]
  reasons: CapabilityRoutingReason[]
  missingCapabilities: ProviderCapability[]
  conflictingConstraints: string[]
  fallbackUnavailable: boolean
  humanReviewRequired: boolean
  generatedAt: string
}

export type CapabilityRoutingResult = CapabilityRoutingSuccessResult | CapabilityRoutingFailureResult

export type CapabilityRoutingCandidateEvaluation = {
  provider: ProviderRecord
  models: ProviderModelRecord[]
  score: number
  compatible: boolean
  fallbackEligible: boolean
  healthStatus: string
  availability: string
  configured: boolean
  matchedCapabilities: ProviderCapability[]
  reasons: string[]
  warnings: string[]
  failureCodes: CapabilityRoutingFailureCode[]
}
