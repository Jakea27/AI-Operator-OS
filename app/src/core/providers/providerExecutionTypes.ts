import {
  CapabilityRoutingRequest,
  CapabilityRoutingResult,
} from './capabilityRoutingTypes'
import {
  ProviderCapability,
  ProviderModelRecord,
  ProviderRecord,
} from './providerTypes'

export type ProviderPromptExecutionMetadata = Record<string, string | number | boolean | undefined>

export type ProviderPromptExecutionInput = {
  capabilityRequest: CapabilityRoutingRequest
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  structuredResponse?: boolean
  metadata?: ProviderPromptExecutionMetadata
}

export type ProviderAdapterPromptExecutionInput = {
  provider: ProviderRecord
  model: ProviderModelRecord
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  structuredResponse?: boolean
  metadata?: ProviderPromptExecutionMetadata
}

export type ProviderPromptTokenUsage = {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  source: 'Provider Reported' | 'Estimated' | 'Unavailable'
}

export type ProviderPromptFailureCode =
  | 'Missing Prompt'
  | 'Prompt Execution Not Supported'
  | 'Provider Routing Failed'
  | 'Provider Not Found'
  | 'Provider Adapter Missing'
  | 'Provider Disabled'
  | 'Provider Misconfigured'
  | 'Provider Unavailable'
  | 'Model Not Found'
  | 'Model Unavailable'
  | 'Invalid Endpoint'
  | 'Non Local Endpoint Rejected'
  | 'Request Timeout'
  | 'Invalid Provider Response'
  | 'Prompt Execution Failed'

export type ProviderPromptWarningCode =
  | 'Structured Response Not Guaranteed'
  | 'Token Usage Unavailable'
  | 'Model Metadata Limited'
  | 'Provider Returned Empty Response'

export type ProviderPromptExecutionSuccess = {
  success: true
  response: string
  provider: {
    providerId: string
    providerRecordId: string
    name: string
    runtime: ProviderRecord['runtime']
  }
  model: {
    modelId: string
    modelRecordId: string
    name: string
    capabilities: ProviderCapability[]
  }
  promptMetadata: {
    promptLength: number
    systemPromptLength: number
    temperature?: number
    maxTokens?: number
    structuredResponse: boolean
    metadata: ProviderPromptExecutionMetadata
  }
  routing?: CapabilityRoutingResult
  latencyMs: number
  tokenUsage: ProviderPromptTokenUsage
  warnings: ProviderPromptWarningCode[]
  failures: []
  startedAt: string
  completedAt: string
}

export type ProviderPromptExecutionFailure = {
  success: false
  response: ''
  provider?: {
    providerId: string
    providerRecordId: string
    name: string
    runtime: ProviderRecord['runtime']
  }
  model?: {
    modelId: string
    modelRecordId: string
    name: string
    capabilities: ProviderCapability[]
  }
  promptMetadata: {
    promptLength: number
    systemPromptLength: number
    temperature?: number
    maxTokens?: number
    structuredResponse: boolean
    metadata: ProviderPromptExecutionMetadata
  }
  routing?: CapabilityRoutingResult
  latencyMs?: number
  tokenUsage: ProviderPromptTokenUsage
  warnings: ProviderPromptWarningCode[]
  failures: ProviderPromptFailureCode[]
  errorMessage: string
  startedAt: string
  completedAt: string
}

export type ProviderPromptExecutionResult = ProviderPromptExecutionSuccess | ProviderPromptExecutionFailure

export type ProviderExecutionAdapter = {
  providerName: string
  canExecute(provider: ProviderRecord): boolean
  executePrompt(input: ProviderAdapterPromptExecutionInput): Promise<ProviderPromptExecutionResult>
}
