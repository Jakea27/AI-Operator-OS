import { providerStore } from './providerStore'
import {
  ProviderAvailability,
  ProviderConfigurationRecord,
  ProviderHealthRecord,
  ProviderHealthStatus,
  ProviderModelRecord,
  ProviderRecord,
} from './providerTypes'

export type ProviderHealthInformationSource = 'Stored Metadata' | 'Supplied Metadata' | 'Derived Metadata' | 'No Metadata'

export type ProviderHealthWarningCode =
  | 'Health Metadata Missing'
  | 'Health Metadata Stale'
  | 'Configuration Missing'
  | 'Configuration Needs Validation'
  | 'No Compatible Models'
  | 'Provider Availability Unknown'

export type ProviderHealthFailureCode =
  | 'Provider Not Found'
  | 'Provider Disabled'
  | 'Provider Misconfigured'
  | 'Provider Unavailable'
  | 'Provider Error'
  | 'Provider Unhealthy'
  | 'No Models Available'

export type ProviderHealthEvaluationInput = {
  providerRecordId: string
  healthRecord?: ProviderHealthRecord
  configuration?: ProviderConfigurationRecord
  models?: ProviderModelRecord[]
  evaluatedAt?: string
  staleAfterMs?: number
}

export type ProviderHealthEvaluationResult = {
  provider?: ProviderRecord
  providerRecordId: string
  providerId?: string
  status: ProviderHealthStatus
  configurationReady: boolean
  availability: ProviderAvailability
  lastCheckedAt?: string
  lastSuccessfulCheckAt?: string
  responseTimeMs?: number
  warningCodes: ProviderHealthWarningCode[]
  failureCodes: ProviderHealthFailureCode[]
  summary: string
  source: ProviderHealthInformationSource
  compatibleModelCount: number
  availableForRecommendation: boolean
  evaluatedAt: string
}

const defaultStaleAfterMs = 24 * 60 * 60 * 1000

function now() {
  return new Date().toISOString()
}

function latestByCreatedAt<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function isStale(timestamp: string | undefined, evaluatedAt: string, staleAfterMs: number) {
  if (!timestamp) return false
  const checked = Date.parse(timestamp)
  const evaluated = Date.parse(evaluatedAt)
  if (Number.isNaN(checked) || Number.isNaN(evaluated)) return false
  return evaluated - checked > staleAfterMs
}

function modelAvailable(model: ProviderModelRecord) {
  return model.enabled && !['Unavailable', 'Error', 'Disabled'].includes(model.health) && model.availability !== 'Unavailable'
}

export function evaluateProviderHealth(input: ProviderHealthEvaluationInput): ProviderHealthEvaluationResult {
  const evaluatedAt = input.evaluatedAt ?? now()
  const provider = providerStore.getProvider(input.providerRecordId)

  if (!provider) {
    return {
      providerRecordId: input.providerRecordId,
      status: 'Unknown',
      configurationReady: false,
      availability: 'Unknown',
      warningCodes: [],
      failureCodes: ['Provider Not Found'],
      summary: 'Provider record was not found.',
      source: 'No Metadata',
      compatibleModelCount: 0,
      availableForRecommendation: false,
      evaluatedAt,
    }
  }

  const storedState = providerStore.getState()
  const configuration = input.configuration ??
    latestByCreatedAt(storedState.configurations.filter((item) => item.providerRecordId === provider.id))
  const healthRecord = input.healthRecord ??
    latestByCreatedAt(storedState.healthRecords.filter((item) => item.providerRecordId === provider.id))
  const models = input.models ?? storedState.models.filter((model) => model.providerRecordId === provider.id)
  const warningCodes: ProviderHealthWarningCode[] = []
  const failureCodes: ProviderHealthFailureCode[] = []

  const configurationReady = Boolean(configuration?.configured && configuration.validationStatus === 'Configured')
  const compatibleModelCount = models.filter(modelAvailable).length
  const source: ProviderHealthInformationSource = input.healthRecord || input.configuration || input.models
    ? 'Supplied Metadata'
    : healthRecord || configuration || models.length > 0
      ? 'Stored Metadata'
      : 'Derived Metadata'

  if (!provider.enabled || provider.status === 'Disabled') failureCodes.push('Provider Disabled')
  if (!configuration) warningCodes.push('Configuration Missing')
  if (configuration && !configurationReady) failureCodes.push('Provider Misconfigured')
  if (configuration && configuration.validationStatus !== 'Configured') warningCodes.push('Configuration Needs Validation')
  if (!healthRecord) warningCodes.push('Health Metadata Missing')
  if (healthRecord && isStale(healthRecord.lastCheckedAt, evaluatedAt, input.staleAfterMs ?? defaultStaleAfterMs)) warningCodes.push('Health Metadata Stale')
  if (compatibleModelCount === 0) {
    warningCodes.push('No Compatible Models')
    failureCodes.push('No Models Available')
  }
  if (provider.status === 'Unavailable') failureCodes.push('Provider Unavailable')
  if (provider.status === 'Error') failureCodes.push('Provider Error')

  const healthStatus = !provider.enabled || provider.status === 'Disabled'
    ? 'Disabled'
    : !configurationReady
      ? 'Misconfigured'
      : healthRecord?.status ?? (provider.status === 'Available' ? 'Healthy' : 'Unknown')

  if (['Unavailable', 'Error'].includes(healthStatus)) failureCodes.push(healthStatus === 'Error' ? 'Provider Error' : 'Provider Unavailable')
  if (healthStatus === 'Degraded') failureCodes.push('Provider Unhealthy')

  const availability = !provider.enabled || provider.status === 'Disabled'
    ? 'Unavailable'
    : healthRecord?.availability ?? (provider.status === 'Available' ? 'Available' : 'Unknown')

  if (availability === 'Unknown') warningCodes.push('Provider Availability Unknown')
  if (availability === 'Unavailable') failureCodes.push('Provider Unavailable')

  const uniqueFailures = unique(failureCodes)
  const availableForRecommendation = uniqueFailures.length === 0 && ['Healthy', 'Unknown', 'Not Checked'].includes(healthStatus) && availability !== 'Unavailable'

  return {
    provider,
    providerRecordId: provider.id,
    providerId: provider.providerId,
    status: healthStatus,
    configurationReady,
    availability,
    lastCheckedAt: healthRecord?.lastCheckedAt,
    lastSuccessfulCheckAt: healthRecord?.lastSuccessfulCheckAt,
    responseTimeMs: healthRecord?.responseTimeMs,
    warningCodes: unique(warningCodes),
    failureCodes: uniqueFailures,
    summary: availableForRecommendation
      ? `${provider.name} is available for metadata-only provider recommendation.`
      : `${provider.name} is not available for recommendation: ${uniqueFailures.join(', ') || 'Warnings require review'}.`,
    source,
    compatibleModelCount,
    availableForRecommendation,
    evaluatedAt,
  }
}
