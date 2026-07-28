import {
  ModelDiscoveryFailureCode,
  ModelDiscoverySubmission,
  ModelDiscoveryWarningCode,
  ModelRegistrationApplyResult,
  ModelRegistrationPlan,
} from '../../modelDiscoveryTypes'
import {
  ProviderAvailability,
  ProviderCapability,
  ProviderHealthStatus,
  ProviderRecord,
} from '../../providerTypes'

export const OLLAMA_PROVIDER_NAME = 'Ollama'
export const OLLAMA_DEFAULT_ENDPOINT = 'http://127.0.0.1:11434'
export const OLLAMA_DEFAULT_TIMEOUT_MS = 30000

export type OllamaErrorCode =
  | 'Invalid Endpoint'
  | 'Non Local Endpoint Rejected'
  | 'Connection Refused'
  | 'Request Timeout'
  | 'Provider Unavailable'
  | 'Invalid Response'
  | 'Unsupported Ollama Version'
  | 'No Models Installed'
  | 'Partial Model Metadata'
  | 'Duplicate Model'
  | 'Registration Rejected'
  | 'Provider Disabled'
  | 'Provider Misconfigured'
  | 'Provider Not Found'
  | 'Model Not Found'
  | 'Prompt Execution Failed'

export type OllamaWarningCode =
  | 'Partial Model Metadata'
  | 'No Models Installed'
  | 'Capability Unknown'
  | 'Context Metadata Missing'
  | 'Cost Metadata Missing'
  | 'Endpoint Uses Local Network Address'

export type OllamaEndpointValidationResult =
  | {
    valid: true
    endpoint: string
    url: URL
    warningCodes: OllamaWarningCode[]
  }
  | {
    valid: false
    endpoint: string
    errorCode: OllamaErrorCode
    message: string
  }

export type OllamaAdapterOptions = {
  endpoint?: string
  timeoutMs?: number
}

export type OllamaHealthCheckResult = {
  provider: 'Ollama'
  endpoint: string
  checkedAt: string
  status: ProviderHealthStatus
  availability: ProviderAvailability
  latencyMs?: number
  version?: string
  errorCode?: OllamaErrorCode
  message: string
}

export type OllamaDiscoveredModel = {
  name: string
  displayName: string
  family?: string
  version?: string
  parameterSize?: string
  quantizationLevel?: string
  sizeBytes?: number
  modifiedAt?: string
  digest?: string
  capabilities: ProviderCapability[]
  warningCodes: OllamaWarningCode[]
  metadata: Record<string, string | number | boolean | undefined>
}

export type OllamaModelDiscoveryResult = {
  provider: 'Ollama'
  endpoint: string
  discoveredAt: string
  outcome: ModelDiscoverySubmission['outcome']
  models: OllamaDiscoveredModel[]
  warningCodes: ModelDiscoveryWarningCode[]
  failureCodes: ModelDiscoveryFailureCode[]
  adapterWarningCodes: OllamaWarningCode[]
  adapterErrorCode?: OllamaErrorCode
  message: string
  registrationPlan?: ModelRegistrationPlan
}

export type OllamaProviderRegistrationResult = {
  provider: ProviderRecord
  created: boolean
  configured: boolean
  endpoint: string
  warningCodes: OllamaWarningCode[]
}

export type OllamaRegistrationPlanResult = {
  discovery: OllamaModelDiscoveryResult
  plan: ModelRegistrationPlan
}

export type OllamaRegistrationApplyResult = ModelRegistrationApplyResult & {
  provider: ProviderRecord
  appliedAt: string
}

export type OllamaGenerateResponse = {
  model?: unknown
  response?: unknown
  done?: unknown
  total_duration?: unknown
  load_duration?: unknown
  prompt_eval_count?: unknown
  prompt_eval_duration?: unknown
  eval_count?: unknown
  eval_duration?: unknown
  created_at?: unknown
}
