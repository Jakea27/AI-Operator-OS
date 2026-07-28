import { ProviderValidationIssue, providerManager } from '@/src/core/providers/providerManager'
import {
  ProviderAvailability,
  ProviderConfigurationRecord,
  ProviderHealthRecord,
  ProviderHealthStatus,
  ProviderModelRecord,
  ProviderRecord,
  ProviderRuntime,
  ProviderStatus,
  ProviderStoreState,
  ProviderUsageSummary,
} from '@/src/core/providers/providerTypes'

export type ProviderHealthFilter = ProviderHealthStatus | 'All'
export type ProviderRuntimeFilter = ProviderRuntime | 'All'
export type ProviderEnabledFilter = 'All' | 'Enabled' | 'Disabled'
export type ProviderConfiguredFilter = 'All' | 'Configured' | 'Not Configured'
export type ProviderAttentionFilter = 'All' | 'Needs Attention' | 'No Attention'
export type ProviderModelFilter = 'All' | 'Has Models' | 'No Models'
export type ProviderSortMode = 'Updated' | 'Name' | 'Health' | 'Model Count' | 'Usage Cost'

export type ProviderViewModel = {
  provider: ProviderRecord
  configuration?: ProviderConfigurationRecord
  health?: ProviderHealthRecord
  models: ProviderModelRecord[]
  usage: ProviderUsageSummary[]
  validationIssues: ProviderValidationIssue[]
  healthStatus: ProviderHealthStatus
  availability: ProviderAvailability
  configured: boolean
  compatibleModelCount: number
  totalEstimatedCost: number
  totalActualCost: number
  requiresAttention: boolean
  attentionReasons: string[]
  recommendationScore: number
  updatedAt: string
}

export type ProviderFilters = {
  query: string
  health: ProviderHealthFilter
  runtime: ProviderRuntimeFilter
  enabled: ProviderEnabledFilter
  configured: ProviderConfiguredFilter
  attention: ProviderAttentionFilter
  models: ProviderModelFilter
  sort: ProviderSortMode
}

function latestByDate<T extends { createdAt: string; updatedAt?: string; lastCheckedAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.lastCheckedAt ?? a.updatedAt ?? a.createdAt
    const bTime = b.lastCheckedAt ?? b.updatedAt ?? b.createdAt
    return bTime.localeCompare(aTime)
  })[0]
}

function healthRank(status: ProviderHealthStatus) {
  return {
    Healthy: 7,
    Unknown: 6,
    'Not Checked': 5,
    Degraded: 4,
    Misconfigured: 3,
    Unavailable: 2,
    Disabled: 1,
    Error: 0,
  }[status]
}

export function formatProviderDate(value?: string) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatProviderMoney(value: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export function isOllamaProvider(provider: ProviderRecord) {
  return provider.name.trim().toLowerCase() === 'ollama' && provider.runtime === 'Local'
}

export function buildProviderViewModels(state: ProviderStoreState): ProviderViewModel[] {
  const recommendations = providerManager.recommendProviders({ requiredCapabilities: [] })

  return state.providers.map((provider) => {
    const configuration = latestByDate(state.configurations.filter((item) => item.providerRecordId === provider.id))
    const health = latestByDate(state.healthRecords.filter((item) => item.providerRecordId === provider.id))
    const models = state.models.filter((model) => model.providerRecordId === provider.id)
    const usage = state.usageSummaries.filter((item) => item.providerRecordId === provider.id)
    const validation = providerManager.validateProvider(provider.id)
    const healthStatus = health?.status ?? (provider.enabled ? 'Not Checked' : 'Disabled')
    const availability = providerManager.evaluateProviderAvailability(provider.id)
    const configured = Boolean(configuration?.configured && configuration.validationStatus === 'Configured')
    const totalEstimatedCost = usage.reduce((total, item) => total + item.estimatedCost, 0)
    const totalActualCost = usage.reduce((total, item) => total + item.actualCost, 0)
    const compatibleModelCount = models.filter((model) => model.enabled && model.availability !== 'Unavailable').length
    const recommendationScore = recommendations.find((item) => item.provider.id === provider.id)?.score ?? 0
    const attentionReasons = [
      ...validation.issues.filter((issue) => issue.severity !== 'Info').map((issue) => issue.message),
      ...(!provider.enabled ? ['Provider is disabled.'] : []),
      ...(!configured ? ['Provider configuration is not ready.'] : []),
      ...(['Unavailable', 'Misconfigured', 'Error', 'Disabled'].includes(healthStatus) ? [`Provider health is ${healthStatus}.`] : []),
      ...(models.length === 0 ? ['No model records are registered.'] : []),
      ...(models.length > 0 && compatibleModelCount === 0 ? ['No enabled compatible model records are available.'] : []),
    ]

    return {
      provider,
      configuration,
      health,
      models,
      usage,
      validationIssues: validation.issues,
      healthStatus,
      availability,
      configured,
      compatibleModelCount,
      totalEstimatedCost,
      totalActualCost,
      requiresAttention: attentionReasons.length > 0,
      attentionReasons,
      recommendationScore,
      updatedAt: [provider.updatedAt, configuration?.updatedAt, health?.lastCheckedAt, ...models.map((model) => model.updatedAt)]
        .filter(Boolean)
        .sort()
        .at(-1) ?? provider.updatedAt,
    }
  })
}

export function filterAndSortProviders(providers: ProviderViewModel[], filters: ProviderFilters) {
  const query = filters.query.trim().toLowerCase()

  const filtered = providers.filter((item) => {
    if (query) {
      const searchable = [
        item.provider.name,
        item.provider.providerId,
        item.provider.description,
        item.provider.supportedCapabilities.join(' '),
        ...item.models.flatMap((model) => [model.displayName, model.modelName, model.modelId]),
      ].join(' ').toLowerCase()

      if (!searchable.includes(query)) return false
    }

    if (filters.health !== 'All' && item.healthStatus !== filters.health) return false
    if (filters.runtime !== 'All' && item.provider.runtime !== filters.runtime) return false
    if (filters.enabled !== 'All' && (item.provider.enabled ? 'Enabled' : 'Disabled') !== filters.enabled) return false
    if (filters.configured !== 'All' && (item.configured ? 'Configured' : 'Not Configured') !== filters.configured) return false
    if (filters.attention !== 'All' && (item.requiresAttention ? 'Needs Attention' : 'No Attention') !== filters.attention) return false
    if (filters.models === 'Has Models' && item.models.length === 0) return false
    if (filters.models === 'No Models' && item.models.length > 0) return false

    return true
  })

  return [...filtered].sort((a, b) => {
    if (filters.sort === 'Name') return a.provider.name.localeCompare(b.provider.name)
    if (filters.sort === 'Health') return healthRank(b.healthStatus) - healthRank(a.healthStatus)
    if (filters.sort === 'Model Count') return b.models.length - a.models.length
    if (filters.sort === 'Usage Cost') return b.totalActualCost - a.totalActualCost
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function providerStatusTone(status: ProviderStatus | ProviderHealthStatus | ProviderAvailability) {
  if (['Available', 'Healthy', 'Configured'].includes(status)) return 'good'
  if (['Degraded', 'Limited', 'Not Checked', 'Unknown'].includes(status)) return 'warning'
  if (['Unavailable', 'Misconfigured', 'Error'].includes(status)) return 'danger'
  if (['Disabled'].includes(status)) return 'muted'
  return 'neutral'
}
