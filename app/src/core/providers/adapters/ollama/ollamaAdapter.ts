import { modelDiscoveryCoordinator } from '../../modelDiscoveryCoordinator'
import {
  DiscoveredProviderModel,
  ModelDiscoveryFailureCode,
  ModelDiscoverySubmission,
  ModelDiscoveryWarningCode,
} from '../../modelDiscoveryTypes'
import { providerManager } from '../../providerManager'
import {
  ProviderAdapterPromptExecutionInput,
  ProviderPromptExecutionResult,
  ProviderPromptFailureCode,
  ProviderPromptTokenUsage,
  ProviderPromptWarningCode,
} from '../../providerExecutionTypes'
import { providerStore } from '../../providerStore'
import {
  ProviderCapability,
  ProviderHealthInput,
  ProviderModelCostMetadata,
  ProviderRecord,
} from '../../providerTypes'
import {
  OLLAMA_DEFAULT_ENDPOINT,
  OLLAMA_DEFAULT_TIMEOUT_MS,
  OLLAMA_PROVIDER_NAME,
  OllamaAdapterOptions,
  OllamaDiscoveredModel,
  OllamaEndpointValidationResult,
  OllamaErrorCode,
  OllamaHealthCheckResult,
  OllamaModelDiscoveryResult,
  OllamaProviderRegistrationResult,
  OllamaGenerateResponse,
  OllamaRegistrationApplyResult,
  OllamaRegistrationPlanResult,
  OllamaWarningCode,
} from './ollamaTypes'

type OllamaVersionResponse = {
  version?: unknown
}

type OllamaTagModel = {
  name?: unknown
  model?: unknown
  modified_at?: unknown
  size?: unknown
  digest?: unknown
  details?: {
    parent_model?: unknown
    format?: unknown
    family?: unknown
    families?: unknown
    parameter_size?: unknown
    quantization_level?: unknown
  }
}

type OllamaTagsResponse = {
  models?: unknown
}

function now() {
  return new Date().toISOString()
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : undefined
}

function positiveNumber(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return undefined
  return numeric
}

function endpointFromOptions(options?: OllamaAdapterOptions) {
  return options?.endpoint?.trim() || OLLAMA_DEFAULT_ENDPOINT
}

function timeoutFromOptions(options?: OllamaAdapterOptions) {
  const timeoutMs = Number(options?.timeoutMs)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return OLLAMA_DEFAULT_TIMEOUT_MS
  return Math.min(Math.max(timeoutMs, 1000), 30000)
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.toLowerCase()
  if (['localhost', '127.0.0.1', '::1'].includes(normalized)) return true
  if (normalized.startsWith('127.')) return true
  if (normalized.startsWith('192.168.')) return true
  if (normalized.startsWith('10.')) return true
  const private172Match = normalized.match(/^172\.(\d+)\./)
  if (private172Match) {
    const octet = Number(private172Match[1])
    return octet >= 16 && octet <= 31
  }
  return normalized.endsWith('.local')
}

export function validateOllamaEndpoint(endpoint = OLLAMA_DEFAULT_ENDPOINT): OllamaEndpointValidationResult {
  const rawEndpoint = endpoint.trim()

  if (!rawEndpoint) {
    return {
      valid: false,
      endpoint,
      errorCode: 'Invalid Endpoint',
      message: 'Ollama endpoint is required.',
    }
  }

  try {
    const url = new URL(rawEndpoint)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return {
        valid: false,
        endpoint: rawEndpoint,
        errorCode: 'Invalid Endpoint',
        message: 'Ollama endpoint must use http or https.',
      }
    }

    if (!isLocalHostname(url.hostname)) {
      return {
        valid: false,
        endpoint: rawEndpoint,
        errorCode: 'Non Local Endpoint Rejected',
        message: 'Sprint 013 Task 5 only allows local Ollama endpoints.',
      }
    }

    const warningCodes: OllamaWarningCode[] = ['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase()) || url.hostname.startsWith('127.')
      ? []
      : ['Endpoint Uses Local Network Address']

    url.pathname = url.pathname.replace(/\/+$/, '')
    url.search = ''
    url.hash = ''

    return {
      valid: true,
      endpoint: url.toString().replace(/\/$/, ''),
      url,
      warningCodes,
    }
  } catch {
    return {
      valid: false,
      endpoint: rawEndpoint,
      errorCode: 'Invalid Endpoint',
      message: 'Ollama endpoint is not a valid URL.',
    }
  }
}

function endpointUrl(endpoint: string, path: string) {
  const base = endpoint.replace(/\/+$/, '')
  return `${base}${path}`
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<{ data?: T; latencyMs: number; errorCode?: OllamaErrorCode; message?: string }> {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const latencyMs = Math.max(0, Math.round(endedAt - startedAt))

    if (!response.ok) {
      return {
        latencyMs,
        errorCode: 'Provider Unavailable',
        message: `Ollama returned HTTP ${response.status}.`,
      }
    }

    try {
      return {
        data: await response.json() as T,
        latencyMs,
      }
    } catch {
      return {
        latencyMs,
        errorCode: 'Invalid Response',
        message: 'Ollama returned malformed JSON.',
      }
    }
  } catch (error) {
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const latencyMs = Math.max(0, Math.round(endedAt - startedAt))
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')
    const message = aborted
      ? `Local Ollama request timed out after ${timeoutMs} ms.`
      : error instanceof Error ? error.message : 'Ollama request failed.'
    return {
      latencyMs,
      errorCode: aborted ? 'Request Timeout' : 'Connection Refused',
      message,
    }
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

async function postJsonWithTimeout<T>(
  url: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ data?: T; latencyMs: number; errorCode?: OllamaErrorCode; message?: string }> {
  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const latencyMs = Math.max(0, Math.round(endedAt - startedAt))

    if (!response.ok) {
      return {
        latencyMs,
        errorCode: 'Prompt Execution Failed',
        message: `Ollama returned HTTP ${response.status}.`,
      }
    }

    try {
      return {
        data: await response.json() as T,
        latencyMs,
      }
    } catch {
      return {
        latencyMs,
        errorCode: 'Invalid Response',
        message: 'Ollama returned malformed JSON.',
      }
    }
  } catch (error) {
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const latencyMs = Math.max(0, Math.round(endedAt - startedAt))
    const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')
    const message = aborted
      ? `Local Ollama request timed out after ${timeoutMs} ms.`
      : error instanceof Error ? error.message : 'Ollama prompt request failed.'
    return {
      latencyMs,
      errorCode: aborted ? 'Request Timeout' : 'Connection Refused',
      message,
    }
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export async function checkOllamaHealth(options?: OllamaAdapterOptions): Promise<OllamaHealthCheckResult> {
  const checkedAt = now()
  const endpointValidation = validateOllamaEndpoint(endpointFromOptions(options))

  if (!endpointValidation.valid) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      checkedAt,
      status: endpointValidation.errorCode === 'Non Local Endpoint Rejected' ? 'Misconfigured' : 'Misconfigured',
      availability: 'Unavailable',
      errorCode: endpointValidation.errorCode,
      message: endpointValidation.message,
    }
  }

  const result = await fetchJsonWithTimeout<OllamaVersionResponse>(
    endpointUrl(endpointValidation.endpoint, '/api/version'),
    timeoutFromOptions(options),
  )

  if (result.errorCode) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      checkedAt,
      status: result.errorCode === 'Request Timeout' ? 'Unavailable' : 'Unavailable',
      availability: 'Unavailable',
      latencyMs: result.latencyMs,
      errorCode: result.errorCode,
      message: result.message ?? 'Ollama is unavailable.',
    }
  }

  const version = trim(result.data?.version)
  if (!version) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      checkedAt,
      status: 'Degraded',
      availability: 'Limited',
      latencyMs: result.latencyMs,
      errorCode: 'Unsupported Ollama Version',
      message: 'Ollama responded, but version metadata was missing.',
    }
  }

  return {
    provider: 'Ollama',
    endpoint: endpointValidation.endpoint,
    checkedAt,
    status: 'Healthy',
    availability: 'Available',
    latencyMs: result.latencyMs,
    version,
    message: `Ollama is available locally. Version: ${version}.`,
  }
}

function modelNameParts(name: string) {
  const [familyPart, tagPart] = name.split(':')
  return {
    family: familyPart || undefined,
    version: tagPart || undefined,
  }
}

function inferCapabilities(modelName: string, details: OllamaTagModel['details']) {
  const normalized = modelName.toLowerCase()
  const family = trim(details?.family)?.toLowerCase() ?? ''
  const capabilities: ProviderCapability[] = []

  capabilities.push('Text Generation')

  if (
    normalized.includes('code') ||
    normalized.includes('coder') ||
    normalized.includes('codellama') ||
    family.includes('code')
  ) {
    capabilities.push('Coding')
  }

  if (
    normalized.includes('embed') ||
    normalized.includes('nomic-embed') ||
    family.includes('embed')
  ) {
    return unique<ProviderCapability>(['Embeddings'])
  }

  if (
    normalized.includes('reason') ||
    normalized.includes('deepseek') ||
    normalized.includes('qwen') ||
    normalized.includes('llama') ||
    normalized.includes('mistral')
  ) {
    capabilities.push('Reasoning')
  }

  return unique(capabilities)
}

function normalizeOllamaModel(model: OllamaTagModel, discoveredAt: string): OllamaDiscoveredModel | undefined {
  const modelName = trim(model.name) ?? trim(model.model)
  if (!modelName) return undefined

  const parts = modelNameParts(modelName)
  const family = trim(model.details?.family) ?? parts.family
  const version = parts.version
  const parameterSize = trim(model.details?.parameter_size)
  const quantizationLevel = trim(model.details?.quantization_level)
  const sizeBytes = positiveNumber(model.size)
  const modifiedAt = trim(model.modified_at)
  const digest = trim(model.digest)
  const warningCodes: OllamaWarningCode[] = []

  if (!family || !parameterSize) warningCodes.push('Partial Model Metadata')
  warningCodes.push('Context Metadata Missing', 'Cost Metadata Missing')

  return {
    name: modelName,
    displayName: modelName,
    family,
    version,
    parameterSize,
    quantizationLevel,
    sizeBytes,
    modifiedAt,
    digest,
    capabilities: inferCapabilities(modelName, model.details),
    warningCodes: unique(warningCodes),
    metadata: {
      ollamaRuntime: true,
      family,
      version,
      parameterSize,
      quantizationLevel,
      sizeBytes,
      modifiedAt,
      digest,
      discoveredAt,
    },
  }
}

function toDiscoveredProviderModel(model: OllamaDiscoveredModel): DiscoveredProviderModel {
  const costMetadata: ProviderModelCostMetadata = {
    currency: 'USD',
    inputUnit: 'Unknown',
    outputUnit: 'Unknown',
    estimatedInputCostPerUnit: 0,
    estimatedOutputCostPerUnit: 0,
    notes: 'Local Ollama model. Direct provider cost is treated as zero; hardware and electricity costs are not estimated in Task 5.',
  }

  return {
    discoveredModelId: model.name,
    displayName: model.displayName,
    modelName: model.name,
    modelFamily: model.family,
    modelVersion: model.version,
    inputModalities: model.capabilities.includes('Embeddings') ? ['Text'] : ['Text'],
    outputModalities: model.capabilities.includes('Embeddings') ? ['Embeddings'] : ['Text', ...(model.capabilities.includes('Coding') ? ['Code' as const] : [])],
    supportedCapabilities: model.capabilities,
    toolUseSupported: false,
    structuredOutputSupported: false,
    runtime: 'Local',
    costMetadata,
    availability: 'Available',
    discoveredAt: model.metadata.discoveredAt as string,
    metadata: model.metadata,
  }
}

function discoveryOutcome(models: OllamaDiscoveredModel[], errorCode?: OllamaErrorCode): ModelDiscoverySubmission['outcome'] {
  if (errorCode === 'Provider Unavailable' || errorCode === 'Connection Refused' || errorCode === 'Request Timeout') return 'Provider Unavailable'
  if (errorCode === 'Invalid Response') return 'Invalid Discovery Response'
  if (models.length === 0) return 'No Models Discovered'
  if (models.some((model) => model.warningCodes.includes('Partial Model Metadata'))) return 'Partial Discovery'
  return 'Models Discovered'
}

function discoveryFailures(errorCode?: OllamaErrorCode): ModelDiscoveryFailureCode[] {
  if (!errorCode) return []
  if (['Provider Unavailable', 'Connection Refused', 'Request Timeout'].includes(errorCode)) return ['Provider Unavailable']
  if (errorCode === 'Invalid Response') return ['Invalid Discovery Response']
  if (errorCode === 'Provider Misconfigured' || errorCode === 'Invalid Endpoint' || errorCode === 'Non Local Endpoint Rejected') return ['Provider Not Configured']
  return []
}

export async function discoverOllamaModels(providerRecordId: string, options?: OllamaAdapterOptions): Promise<OllamaModelDiscoveryResult> {
  const discoveredAt = now()
  const endpointValidation = validateOllamaEndpoint(endpointFromOptions(options))

  if (!endpointValidation.valid) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      discoveredAt,
      outcome: 'Provider Not Configured',
      models: [],
      warningCodes: [],
      failureCodes: ['Provider Not Configured'],
      adapterWarningCodes: [],
      adapterErrorCode: endpointValidation.errorCode,
      message: endpointValidation.message,
    }
  }

  if (!providerStore.getProvider(providerRecordId)) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      discoveredAt,
      outcome: 'Provider Not Configured',
      models: [],
      warningCodes: [],
      failureCodes: ['Provider Not Found'],
      adapterWarningCodes: endpointValidation.warningCodes,
      adapterErrorCode: 'Provider Not Found',
      message: 'Ollama provider record was not found.',
    }
  }

  const result = await fetchJsonWithTimeout<OllamaTagsResponse>(
    endpointUrl(endpointValidation.endpoint, '/api/tags'),
    timeoutFromOptions(options),
  )

  if (result.errorCode) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      discoveredAt,
      outcome: discoveryOutcome([], result.errorCode),
      models: [],
      warningCodes: [],
      failureCodes: discoveryFailures(result.errorCode),
      adapterWarningCodes: endpointValidation.warningCodes,
      adapterErrorCode: result.errorCode,
      message: result.message ?? 'Ollama model discovery failed.',
    }
  }

  if (!Array.isArray(result.data?.models)) {
    return {
      provider: 'Ollama',
      endpoint: endpointValidation.endpoint,
      discoveredAt,
      outcome: 'Invalid Discovery Response',
      models: [],
      warningCodes: [],
      failureCodes: ['Invalid Discovery Response'],
      adapterWarningCodes: endpointValidation.warningCodes,
      adapterErrorCode: 'Invalid Response',
      message: 'Ollama model discovery returned an invalid response shape.',
    }
  }

  const rawModels = result.data.models as OllamaTagModel[]
  const normalizedModels = rawModels
    .map((model) => normalizeOllamaModel(model, discoveredAt))
    .filter((model): model is OllamaDiscoveredModel => Boolean(model))

  const adapterWarnings = unique([
    ...endpointValidation.warningCodes,
    ...(normalizedModels.length === 0 ? ['No Models Installed' as OllamaWarningCode] : []),
    ...normalizedModels.flatMap((model) => model.warningCodes),
  ])

  const warningCodes: ModelDiscoveryWarningCode[] = unique([
    ...(adapterWarnings.includes('No Models Installed') ? ['Partial Metadata' as ModelDiscoveryWarningCode] : []),
    ...(adapterWarnings.includes('Partial Model Metadata') ? ['Partial Metadata' as ModelDiscoveryWarningCode] : []),
    ...(adapterWarnings.includes('Context Metadata Missing') ? ['Context Metadata Missing' as ModelDiscoveryWarningCode] : []),
    ...(adapterWarnings.includes('Cost Metadata Missing') ? ['Cost Metadata Missing' as ModelDiscoveryWarningCode] : []),
  ])

  return {
    provider: 'Ollama',
    endpoint: endpointValidation.endpoint,
    discoveredAt,
    outcome: discoveryOutcome(normalizedModels),
    models: normalizedModels,
    warningCodes,
    failureCodes: [],
    adapterWarningCodes: adapterWarnings,
    adapterErrorCode: normalizedModels.length === 0 ? 'No Models Installed' : undefined,
    message: normalizedModels.length === 0
      ? 'Ollama is reachable, but no local models are installed.'
      : `Discovered ${normalizedModels.length} local Ollama model${normalizedModels.length === 1 ? '' : 's'}.`,
  }
}

function providerIsOllama(provider: ProviderRecord) {
  return provider.name.trim().toLowerCase() === OLLAMA_PROVIDER_NAME.toLowerCase() && provider.runtime === 'Local'
}

export function getOllamaProvider() {
  return providerStore.getProviders().find(providerIsOllama)
}

export function ensureOllamaProvider(options?: OllamaAdapterOptions): OllamaProviderRegistrationResult {
  const endpointValidation = validateOllamaEndpoint(endpointFromOptions(options))
  const existing = getOllamaProvider()
  const provider = existing ?? providerManager.registerProvider({
    name: OLLAMA_PROVIDER_NAME,
    type: 'Local',
    source: 'Built In',
    description: 'Local Ollama provider adapter. This record supports detection, health checks, and model discovery only.',
    runtime: 'Local',
    supportedCapabilities: ['Text Generation', 'Coding', 'Reasoning', 'Embeddings'],
    enabled: false,
    status: 'Disabled',
  })

  const endpoint = endpointValidation.valid ? endpointValidation.endpoint : endpointFromOptions(options)
  const configured = endpointValidation.valid

  providerStore.upsertConfiguration({
    providerRecordId: provider.id,
    endpoint,
    apiKeyRequired: false,
    configured,
    localHost: endpointValidation.valid ? endpointValidation.url.hostname : undefined,
    connectionTimeoutMs: timeoutFromOptions(options),
    validationStatus: configured ? 'Configured' : 'Invalid',
    notes: configured
      ? 'Local Ollama endpoint metadata. No credentials are stored.'
      : `Invalid Ollama endpoint: ${endpointValidation.valid ? '' : endpointValidation.message}`,
  })

  return {
    provider,
    created: !existing,
    configured,
    endpoint,
    warningCodes: endpointValidation.valid ? endpointValidation.warningCodes : [],
  }
}

export function recordOllamaHealth(providerRecordId: string, result: OllamaHealthCheckResult) {
  const healthInput: ProviderHealthInput = {
    providerRecordId,
    status: result.status,
    lastCheckedAt: result.checkedAt,
    lastSuccessfulCheckAt: result.status === 'Healthy' ? result.checkedAt : undefined,
    responseTimeMs: result.latencyMs,
    lastError: result.errorCode ? `${result.errorCode}: ${result.message}` : undefined,
    consecutiveFailures: result.status === 'Healthy' ? 0 : 1,
    availability: result.availability,
    notes: result.message,
  }
  const health = providerStore.recordHealth(healthInput)
  const providerStatus = result.status === 'Healthy'
    ? 'Available'
    : result.status === 'Degraded'
      ? 'Degraded'
      : result.status === 'Misconfigured'
        ? 'Error'
        : 'Unavailable'

  providerStore.updateProvider(providerRecordId, { status: providerStatus })
  return health
}

export async function createOllamaRegistrationPlan(providerRecordId: string, options?: OllamaAdapterOptions): Promise<OllamaRegistrationPlanResult> {
  const discovery = await discoverOllamaModels(providerRecordId, options)
  const submission: ModelDiscoverySubmission = {
    discoveryRequestId: `OLLAMA-DISCOVERY-${Date.now()}`,
    providerRecordId,
    source: 'Ollama Adapter',
    requestedAt: discovery.discoveredAt,
    outcome: discovery.outcome,
    models: discovery.models.map(toDiscoveredProviderModel),
    warningCodes: discovery.warningCodes,
    failureCodes: discovery.failureCodes,
    metadata: {
      endpoint: discovery.endpoint,
      provider: 'Ollama',
    },
  }
  const plan = modelDiscoveryCoordinator.createRegistrationPlan(submission)
  return {
    discovery: {
      ...discovery,
      registrationPlan: plan,
    },
    plan,
  }
}

export function applyOllamaRegistrationPlan(providerRecordId: string, plan: ReturnType<typeof modelDiscoveryCoordinator.createRegistrationPlan>): OllamaRegistrationApplyResult {
  const provider = providerStore.getProvider(providerRecordId)
  if (!provider) {
    return {
      provider: {
        id: '',
        providerId: '',
        name: OLLAMA_PROVIDER_NAME,
        type: 'Local',
        status: 'Error',
        source: 'Built In',
        description: 'Missing Ollama provider record.',
        enabled: false,
        runtime: 'Local',
        supportedCapabilities: [],
        createdAt: now(),
        updatedAt: now(),
      },
      appliedAt: now(),
      added: [],
      updated: [],
      skipped: [],
      rejected: plan.items.map((item) => ({
        ...item,
        status: 'Rejected',
        failureCodes: unique([...item.failureCodes, 'Provider Not Found']),
      })),
    }
  }

  const result = modelDiscoveryCoordinator.applyRegistrationPlan(plan)
  return {
    provider,
    appliedAt: now(),
    ...result,
  }
}

function latestConfiguration(providerRecordId: string) {
  return [...providerStore.getState().configurations]
    .filter((configuration) => configuration.providerRecordId === providerRecordId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function promptMetadata(input: ProviderAdapterPromptExecutionInput) {
  return {
    promptLength: input.prompt.length,
    systemPromptLength: input.systemPrompt?.length ?? 0,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    structuredResponse: Boolean(input.structuredResponse),
    metadata: input.metadata ?? {},
  }
}

function providerSummary(input: ProviderAdapterPromptExecutionInput) {
  return {
    providerId: input.provider.providerId,
    providerRecordId: input.provider.id,
    name: input.provider.name,
    runtime: input.provider.runtime,
  }
}

function modelSummary(input: ProviderAdapterPromptExecutionInput) {
  return {
    modelId: input.model.modelId,
    modelRecordId: input.model.id,
    name: input.model.modelName,
    capabilities: input.model.supportedCapabilities,
  }
}

function tokenUsageFromResponse(response: OllamaGenerateResponse | undefined): ProviderPromptTokenUsage {
  const promptTokens = positiveNumber(response?.prompt_eval_count)
  const completionTokens = positiveNumber(response?.eval_count)
  if (promptTokens === undefined && completionTokens === undefined) {
    return { source: 'Unavailable' }
  }
  return {
    promptTokens,
    completionTokens,
    totalTokens: (promptTokens ?? 0) + (completionTokens ?? 0),
    source: 'Provider Reported',
  }
}

function errorToFailure(errorCode: OllamaErrorCode | undefined): ProviderPromptFailureCode {
  if (errorCode === 'Invalid Endpoint') return 'Invalid Endpoint'
  if (errorCode === 'Non Local Endpoint Rejected') return 'Non Local Endpoint Rejected'
  if (errorCode === 'Request Timeout') return 'Request Timeout'
  if (errorCode === 'Connection Refused' || errorCode === 'Provider Unavailable') return 'Provider Unavailable'
  if (errorCode === 'Invalid Response') return 'Invalid Provider Response'
  if (errorCode === 'Provider Disabled') return 'Provider Disabled'
  if (errorCode === 'Provider Misconfigured') return 'Provider Misconfigured'
  if (errorCode === 'Model Not Found') return 'Model Not Found'
  return 'Prompt Execution Failed'
}

function buildPrompt(input: ProviderAdapterPromptExecutionInput) {
  if (!input.systemPrompt?.trim()) return input.prompt
  return `${input.systemPrompt.trim()}\n\n${input.prompt}`
}

export async function executeOllamaPrompt(input: ProviderAdapterPromptExecutionInput): Promise<ProviderPromptExecutionResult> {
  const startedAt = now()
  const completedAtForFailure = () => now()
  const metadata = promptMetadata(input)

  if (!input.prompt.trim()) {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      tokenUsage: { source: 'Unavailable' },
      warnings: [],
      failures: ['Missing Prompt'],
      errorMessage: 'Prompt is required.',
      startedAt,
      completedAt: completedAtForFailure(),
    }
  }

  if (!input.provider.enabled || input.provider.status === 'Disabled') {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      tokenUsage: { source: 'Unavailable' },
      warnings: [],
      failures: ['Provider Disabled'],
      errorMessage: 'Ollama provider is disabled.',
      startedAt,
      completedAt: completedAtForFailure(),
    }
  }

  if (!input.model.enabled || input.model.availability === 'Unavailable') {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      tokenUsage: { source: 'Unavailable' },
      warnings: [],
      failures: ['Model Unavailable'],
      errorMessage: 'Selected Ollama model is unavailable or disabled.',
      startedAt,
      completedAt: completedAtForFailure(),
    }
  }

  const configuration = latestConfiguration(input.provider.id)
  const endpointValidation = validateOllamaEndpoint(configuration?.endpoint ?? OLLAMA_DEFAULT_ENDPOINT)

  if (!configuration?.configured || configuration.validationStatus !== 'Configured') {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      tokenUsage: { source: 'Unavailable' },
      warnings: [],
      failures: ['Provider Misconfigured'],
      errorMessage: 'Ollama provider configuration is not ready.',
      startedAt,
      completedAt: completedAtForFailure(),
    }
  }

  if (!endpointValidation.valid) {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      tokenUsage: { source: 'Unavailable' },
      warnings: [],
      failures: [errorToFailure(endpointValidation.errorCode)],
      errorMessage: endpointValidation.message,
      startedAt,
      completedAt: completedAtForFailure(),
    }
  }

  const warnings: ProviderPromptWarningCode[] = []
  if (input.structuredResponse) warnings.push('Structured Response Not Guaranteed')

  const result = await postJsonWithTimeout<OllamaGenerateResponse>(
    endpointUrl(endpointValidation.endpoint, '/api/generate'),
    {
      model: input.model.modelName,
      prompt: buildPrompt(input),
      stream: false,
      options: {
        temperature: input.temperature,
        num_predict: input.maxTokens,
      },
    },
    configuration.connectionTimeoutMs,
  )
  const completedAt = now()

  if (result.errorCode) {
    return {
      success: false,
      response: '',
      provider: providerSummary(input),
      model: modelSummary(input),
      promptMetadata: metadata,
      latencyMs: result.latencyMs,
      tokenUsage: { source: 'Unavailable' },
      warnings,
      failures: [errorToFailure(result.errorCode)],
      errorMessage: result.message ?? 'Ollama prompt execution failed.',
      startedAt,
      completedAt,
    }
  }

  const responseText = trim(result.data?.response) ?? ''
  if (!responseText) warnings.push('Provider Returned Empty Response')
  const tokenUsage = tokenUsageFromResponse(result.data)
  if (tokenUsage.source === 'Unavailable') warnings.push('Token Usage Unavailable')

  return {
    success: true,
    response: responseText,
    provider: providerSummary(input),
    model: modelSummary(input),
    promptMetadata: metadata,
    latencyMs: result.latencyMs,
    tokenUsage,
    warnings: unique(warnings),
    failures: [],
    startedAt,
    completedAt,
  }
}

export const ollamaAdapter = {
  defaultEndpoint: OLLAMA_DEFAULT_ENDPOINT,
  validateEndpoint: validateOllamaEndpoint,
  ensureProvider: ensureOllamaProvider,
  getProvider: getOllamaProvider,
  checkHealth: checkOllamaHealth,
  recordHealth: recordOllamaHealth,
  discoverModels: discoverOllamaModels,
  createRegistrationPlan: createOllamaRegistrationPlan,
  applyRegistrationPlan: applyOllamaRegistrationPlan,
  executePrompt: executeOllamaPrompt,
}
