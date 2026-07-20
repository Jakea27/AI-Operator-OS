import { providerStore } from './providerStore'
import {
  ProviderAvailability,
  ProviderCapability,
  ProviderConfigurationRecord,
  ProviderHealthRecord,
  ProviderHealthStatus,
  ProviderInput,
  ProviderModelRecord,
  ProviderRecord,
  ProviderSelectionPolicy,
} from './providerTypes'

export type ProviderValidationIssue = {
  severity: 'Info' | 'Warning' | 'Error'
  message: string
}

export type ProviderValidationResult = {
  valid: boolean
  issues: ProviderValidationIssue[]
}

export type ProviderCompatibilityRequest = {
  requiredCapabilities: ProviderCapability[]
  localOnly?: boolean
  cloudAllowed?: boolean
  preferredProviderId?: string
  excludedProviderIds?: string[]
}

export type ProviderCompatibilityResult = {
  compatible: boolean
  missingCapabilities: ProviderCapability[]
  reasons: string[]
}

export type ProviderRecommendationRequest = ProviderCompatibilityRequest & {
  policy?: ProviderSelectionPolicy
  fallbackAllowed?: boolean
}

export type ProviderRecommendation = {
  provider: ProviderRecord
  models: ProviderModelRecord[]
  score: number
  compatible: boolean
  fallbackEligible: boolean
  healthStatus: ProviderHealthStatus
  availability: ProviderAvailability
  configured: boolean
  reasons: string[]
  warnings: string[]
}

function latestByCreatedAt<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

function getConfiguration(provider: ProviderRecord): ProviderConfigurationRecord | undefined {
  return latestByCreatedAt(providerStore.getState().configurations.filter((configuration) => configuration.providerRecordId === provider.id))
}

function getHealth(provider: ProviderRecord): ProviderHealthRecord | undefined {
  return latestByCreatedAt(providerStore.getState().healthRecords.filter((health) => health.providerRecordId === provider.id))
}

function getModels(provider: ProviderRecord) {
  return providerStore.getState().models.filter((model) => model.providerRecordId === provider.id)
}

function uniqueCapabilities(capabilities: ProviderCapability[]) {
  return Array.from(new Set(capabilities))
}

function capabilitySet(provider: ProviderRecord, models = getModels(provider)) {
  return new Set<ProviderCapability>([
    ...provider.supportedCapabilities,
    ...models.flatMap((model) => model.supportedCapabilities),
  ])
}

function supportsCapability(provider: ProviderRecord, capability: ProviderCapability) {
  return capabilitySet(provider).has(capability)
}

function supportsCapabilities(provider: ProviderRecord, requiredCapabilities: ProviderCapability[]) {
  const supported = capabilitySet(provider)
  return requiredCapabilities.filter((capability) => !supported.has(capability))
}

function isRuntimeAllowed(provider: ProviderRecord, request: ProviderCompatibilityRequest) {
  if (request.localOnly && provider.runtime !== 'Local') return false
  if (request.cloudAllowed === false && provider.runtime === 'Cloud') return false
  return true
}

function healthScore(status: ProviderHealthStatus) {
  return {
    Healthy: 25,
    Unknown: 8,
    'Not Checked': 6,
    Degraded: 4,
    Unavailable: -20,
    Error: -30,
  }[status]
}

function availabilityScore(availability: ProviderAvailability) {
  return {
    Available: 20,
    Limited: 6,
    Unknown: 3,
    Unavailable: -20,
  }[availability]
}

function priorityScore(provider: ProviderRecord, request: ProviderRecommendationRequest) {
  if (request.preferredProviderId && [provider.id, provider.providerId].includes(request.preferredProviderId)) return 40
  if (request.policy?.preferredProviderId && [provider.id, provider.providerId].includes(request.policy.preferredProviderId)) return 40

  return {
    Preferred: 18,
    High: 12,
    Medium: 6,
    Low: 2,
  }[request.policy?.providerPriority ?? 'Medium']
}

function matchingModels(provider: ProviderRecord, requiredCapabilities: ProviderCapability[]) {
  const models = getModels(provider)
  if (requiredCapabilities.length === 0) return models
  return models.filter((model) => {
    const supported = new Set(model.supportedCapabilities)
    return requiredCapabilities.every((capability) => supported.has(capability))
  })
}

export const providerManager = {
  registerProvider(input: ProviderInput) {
    return providerStore.addProvider(input)
  },

  unregisterProvider(providerRecordId: string) {
    return providerStore.removeProvider(providerRecordId)
  },

  enableProvider(providerRecordId: string) {
    return providerStore.enableProvider(providerRecordId)
  },

  disableProvider(providerRecordId: string) {
    return providerStore.disableProvider(providerRecordId)
  },

  getProviders() {
    return providerStore.getProviders()
  },

  getProvider(providerRecordId: string) {
    return providerStore.getProvider(providerRecordId)
  },

  getProviderConfiguration(providerRecordId: string) {
    const provider = providerStore.getProvider(providerRecordId)
    return provider ? getConfiguration(provider) : undefined
  },

  getProviderHealth(providerRecordId: string) {
    const provider = providerStore.getProvider(providerRecordId)
    return provider ? getHealth(provider) : undefined
  },

  evaluateProviderHealth(providerRecordId: string): ProviderHealthStatus {
    const provider = providerStore.getProvider(providerRecordId)
    if (!provider) return 'Unknown'
    return getHealth(provider)?.status ?? 'Not Checked'
  },

  evaluateProviderAvailability(providerRecordId: string): ProviderAvailability {
    const provider = providerStore.getProvider(providerRecordId)
    if (!provider) return 'Unknown'
    if (!provider.enabled || provider.status === 'Disabled') return 'Unavailable'
    if (provider.status === 'Available') return 'Available'
    if (provider.status === 'Degraded') return 'Limited'
    if (['Unavailable', 'Error'].includes(provider.status)) return 'Unavailable'
    return getHealth(provider)?.availability ?? 'Unknown'
  },

  getProvidersForCapability(capability: ProviderCapability) {
    return providerStore.getProviders().filter((provider) => supportsCapability(provider, capability))
  },

  getModelsForCapability(capability: ProviderCapability) {
    return providerStore.getModels().filter((model) => model.supportedCapabilities.includes(capability))
  },

  validateProvider(providerRecordId: string): ProviderValidationResult {
    const provider = providerStore.getProvider(providerRecordId)
    if (!provider) {
      return {
        valid: false,
        issues: [{ severity: 'Error', message: 'Provider record was not found.' }],
      }
    }

    const configuration = getConfiguration(provider)
    const issues: ProviderValidationIssue[] = []

    if (!provider.name.trim()) issues.push({ severity: 'Error', message: 'Provider name is required.' })
    if (!provider.enabled) issues.push({ severity: 'Info', message: 'Provider is disabled.' })
    if (!configuration) issues.push({ severity: 'Warning', message: 'Provider has no configuration metadata.' })
    if (configuration?.apiKeyRequired && !configuration.environmentVariableReference) {
      issues.push({ severity: 'Warning', message: 'Provider requires an API key but only an environment variable reference should be stored.' })
    }
    if (configuration?.configured && configuration.validationStatus !== 'Configured') {
      issues.push({ severity: 'Warning', message: 'Provider is marked configured but validation status is not Configured.' })
    }
    if (provider.status === 'Error') issues.push({ severity: 'Error', message: 'Provider status is Error.' })

    return {
      valid: !issues.some((issue) => issue.severity === 'Error'),
      issues,
    }
  },

  checkCompatibility(providerRecordId: string, request: ProviderCompatibilityRequest): ProviderCompatibilityResult {
    const provider = providerStore.getProvider(providerRecordId)
    if (!provider) {
      return {
        compatible: false,
        missingCapabilities: uniqueCapabilities(request.requiredCapabilities),
        reasons: ['Provider record was not found.'],
      }
    }

    const excluded = request.excludedProviderIds ?? []
    const missingCapabilities = supportsCapabilities(provider, uniqueCapabilities(request.requiredCapabilities))
    const reasons: string[] = []

    if (excluded.includes(provider.id) || excluded.includes(provider.providerId)) reasons.push('Provider is excluded by policy.')
    if (!isRuntimeAllowed(provider, request)) reasons.push('Provider runtime does not satisfy local/cloud preference.')
    if (!provider.enabled) reasons.push('Provider is disabled.')
    if (['Unavailable', 'Error', 'Disabled'].includes(provider.status)) reasons.push(`Provider status is ${provider.status}.`)
    if (missingCapabilities.length > 0) reasons.push(`Missing capabilities: ${missingCapabilities.join(', ')}.`)

    return {
      compatible: reasons.length === 0,
      missingCapabilities,
      reasons,
    }
  },

  recommendProviders(request: ProviderRecommendationRequest): ProviderRecommendation[] {
    const requiredCapabilities = uniqueCapabilities([
      ...request.requiredCapabilities,
      ...(request.policy?.requiredCapabilities ?? []),
    ])
    const excludedProviderIds = new Set([
      ...(request.excludedProviderIds ?? []),
      ...(request.policy?.excludedProviderIds ?? []),
    ])

    return providerStore.getProviders()
      .map((provider) => {
        const configuration = getConfiguration(provider)
        const health = getHealth(provider)
        const availability = this.evaluateProviderAvailability(provider.id)
        const healthStatus = health?.status ?? 'Not Checked'
        const compatibility = this.checkCompatibility(provider.id, {
          requiredCapabilities,
          localOnly: request.localOnly ?? request.policy?.localOnly,
          cloudAllowed: request.cloudAllowed ?? request.policy?.cloudAllowed,
          preferredProviderId: request.preferredProviderId ?? request.policy?.preferredProviderId,
          excludedProviderIds: Array.from(excludedProviderIds),
        })
        const configured = Boolean(configuration?.configured && configuration.validationStatus === 'Configured')
        const models = matchingModels(provider, requiredCapabilities)
        const reasons = [...compatibility.reasons]
        const warnings: string[] = []

        if (!configuration) warnings.push('No configuration metadata is recorded.')
        if (!configured) warnings.push('Provider is not configured for use.')
        if (models.length === 0 && requiredCapabilities.length > 0) warnings.push('No model advertises every requested capability.')

        const score =
          priorityScore(provider, request) +
          healthScore(healthStatus) +
          availabilityScore(availability) +
          (provider.enabled ? 20 : -25) +
          (configured ? 15 : -5) +
          (compatibility.missingCapabilities.length === 0 ? 30 : -15 * compatibility.missingCapabilities.length) +
          (provider.status === 'Available' ? 20 : provider.status === 'Configured' ? 12 : 0) +
          (request.localOnly && provider.runtime === 'Local' ? 15 : 0)

        const fallbackAllowed = request.fallbackAllowed ?? request.policy?.fallbackAllowed ?? true
        const preferredId = request.preferredProviderId ?? request.policy?.preferredProviderId
        const fallbackEligible = fallbackAllowed && provider.enabled && ![provider.id, provider.providerId].includes(preferredId ?? '') && compatibility.missingCapabilities.length === 0

        return {
          provider,
          models,
          score,
          compatible: compatibility.compatible,
          fallbackEligible,
          healthStatus,
          availability,
          configured,
          reasons,
          warnings,
        }
      })
      .sort((a, b) => b.score - a.score || a.provider.name.localeCompare(b.provider.name))
  },
}
