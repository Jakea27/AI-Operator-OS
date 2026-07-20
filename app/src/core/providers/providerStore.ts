import { useSyncExternalStore } from 'react'
import {
  ProviderCapability,
  ProviderCapabilityDefinition,
  ProviderConfigurationInput,
  ProviderConfigurationRecord,
  ProviderHealthInput,
  ProviderHealthRecord,
  ProviderHealthStatus,
  ProviderInput,
  ProviderModelInput,
  ProviderModelRecord,
  ProviderModelUpdate,
  ProviderRecord,
  ProviderSelectionPolicy,
  ProviderSelectionPolicyInput,
  ProviderStoreState,
  ProviderUpdate,
  ProviderUsageInput,
  ProviderUsageSummary,
} from './providerTypes'

const STORAGE_KEY = 'ai-operator-os-providers-v1'

const listeners = new Set<() => void>()

export const providerCapabilities: ProviderCapability[] = [
  'Text Generation',
  'Coding',
  'Reasoning',
  'Vision',
  'Image Generation',
  'Embeddings',
  'Transcription',
  'Speech Generation',
  'Tool Use',
  'Long Context',
  'Structured Output',
]

export const providerHealthStatuses: ProviderHealthStatus[] = ['Unknown', 'Healthy', 'Degraded', 'Unavailable', 'Error', 'Not Checked']

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function numericOrZero(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, numeric)
}

function positiveNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback
  return numeric
}

function uniqueCapabilities(value: unknown): ProviderCapability[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(providerCapabilities)
  return Array.from(new Set(value.filter((item): item is ProviderCapability => allowed.has(item))))
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())))
}

function fallbackProviderCode(index: number) {
  return `PROV-${String(index + 1).padStart(4, '0')}`
}

function generateProviderCode(existing: ProviderRecord[]) {
  const max = existing.reduce((highest, provider) => {
    const match = provider.providerId?.match(/^PROV-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `PROV-${String(max + 1).padStart(4, '0')}`
}

function fallbackModelCode(index: number) {
  return `MODEL-${String(index + 1).padStart(4, '0')}`
}

function generateModelCode(existing: ProviderModelRecord[]) {
  const max = existing.reduce((highest, model) => {
    const match = model.modelId?.match(/^MODEL-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `MODEL-${String(max + 1).padStart(4, '0')}`
}

function fallbackRecordCode(prefix: string, index: number) {
  return `${prefix}-${String(index + 1).padStart(4, '0')}`
}

function normalizeProvider(raw: Partial<ProviderRecord>, index = 0): ProviderRecord {
  const timestamp = raw.createdAt ?? now()
  const enabled = Boolean(raw.enabled)
  return {
    id: raw.id ?? id('provider'),
    providerId: raw.providerId ?? fallbackProviderCode(index),
    name: raw.name?.trim() || 'Untitled Provider',
    type: raw.type ?? 'Custom',
    status: raw.status ?? (enabled ? 'Unconfigured' : 'Disabled'),
    source: raw.source ?? 'User Defined',
    description: raw.description?.trim() || 'Provider architecture record. No provider connection is configured.',
    enabled,
    runtime: raw.runtime ?? (raw.type === 'Local' ? 'Local' : raw.type === 'Hybrid' ? 'Hybrid' : 'Cloud'),
    supportedCapabilities: uniqueCapabilities(raw.supportedCapabilities),
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizeModel(raw: Partial<ProviderModelRecord>, providers: ProviderRecord[], index = 0): ProviderModelRecord {
  const timestamp = raw.createdAt ?? now()
  const provider = providers.find((item) => item.id === raw.providerRecordId || item.providerId === raw.providerId)
  return {
    id: raw.id ?? id('provider-model'),
    modelId: raw.modelId ?? fallbackModelCode(index),
    providerRecordId: provider?.id ?? raw.providerRecordId ?? '',
    providerId: provider?.providerId ?? raw.providerId ?? 'PROV-0000',
    displayName: raw.displayName?.trim() || raw.modelName?.trim() || 'Untitled Model',
    modelName: raw.modelName?.trim() || raw.displayName?.trim() || 'unknown-model',
    enabled: Boolean(raw.enabled),
    runtime: raw.runtime ?? provider?.runtime ?? 'Cloud',
    supportedCapabilities: uniqueCapabilities(raw.supportedCapabilities),
    contextLimits: raw.contextLimits,
    inputSupport: Array.isArray(raw.inputSupport) ? raw.inputSupport : [],
    outputSupport: Array.isArray(raw.outputSupport) ? raw.outputSupport : [],
    costMetadata: raw.costMetadata
      ? {
        ...raw.costMetadata,
        currency: raw.costMetadata.currency?.trim() || 'USD',
        estimatedInputCostPerUnit: raw.costMetadata.estimatedInputCostPerUnit === undefined
          ? undefined
          : numericOrZero(raw.costMetadata.estimatedInputCostPerUnit),
        estimatedOutputCostPerUnit: raw.costMetadata.estimatedOutputCostPerUnit === undefined
          ? undefined
          : numericOrZero(raw.costMetadata.estimatedOutputCostPerUnit),
      }
      : undefined,
    performanceMetadata: raw.performanceMetadata,
    availability: raw.availability ?? 'Unknown',
    health: raw.health ?? 'Not Checked',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizeConfiguration(raw: Partial<ProviderConfigurationRecord>, providers: ProviderRecord[], index = 0): ProviderConfigurationRecord {
  const timestamp = raw.createdAt ?? now()
  const provider = providers.find((item) => item.id === raw.providerRecordId || item.providerId === raw.providerId)
  return {
    id: raw.id ?? id('provider-config'),
    configurationId: raw.configurationId ?? fallbackRecordCode('PROVCFG', index),
    providerRecordId: provider?.id ?? raw.providerRecordId ?? '',
    providerId: provider?.providerId ?? raw.providerId ?? 'PROV-0000',
    endpoint: raw.endpoint?.trim(),
    apiKeyRequired: Boolean(raw.apiKeyRequired),
    configured: Boolean(raw.configured),
    localHost: raw.localHost?.trim(),
    environmentVariableReference: raw.environmentVariableReference?.trim(),
    connectionTimeoutMs: positiveNumber(raw.connectionTimeoutMs, 30000),
    preferredModelId: raw.preferredModelId,
    validationStatus: raw.validationStatus ?? 'Not Configured',
    lastValidatedAt: raw.lastValidatedAt,
    notes: raw.notes ?? '',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizeHealth(raw: Partial<ProviderHealthRecord>, providers: ProviderRecord[], index = 0): ProviderHealthRecord {
  const timestamp = raw.createdAt ?? now()
  const provider = providers.find((item) => item.id === raw.providerRecordId || item.providerId === raw.providerId)
  return {
    id: raw.id ?? id('provider-health'),
    healthId: raw.healthId ?? fallbackRecordCode('PROVHLTH', index),
    providerRecordId: provider?.id ?? raw.providerRecordId ?? '',
    providerId: provider?.providerId ?? raw.providerId ?? 'PROV-0000',
    status: raw.status ?? 'Not Checked',
    lastCheckedAt: raw.lastCheckedAt,
    responseTimeMs: raw.responseTimeMs === undefined ? undefined : numericOrZero(raw.responseTimeMs),
    lastSuccessfulCheckAt: raw.lastSuccessfulCheckAt,
    lastError: raw.lastError,
    consecutiveFailures: numericOrZero(raw.consecutiveFailures),
    availability: raw.availability ?? 'Unknown',
    notes: raw.notes ?? '',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizeUsage(raw: Partial<ProviderUsageSummary>, providers: ProviderRecord[], models: ProviderModelRecord[], index = 0): ProviderUsageSummary {
  const timestamp = raw.createdAt ?? now()
  const provider = providers.find((item) => item.id === raw.providerRecordId || item.providerId === raw.providerId)
  const model = models.find((item) => item.id === raw.modelRecordId || item.modelId === raw.modelId)
  return {
    id: raw.id ?? id('provider-usage'),
    usageId: raw.usageId ?? fallbackRecordCode('PROVUSE', index),
    providerRecordId: provider?.id ?? raw.providerRecordId ?? '',
    providerId: provider?.providerId ?? raw.providerId ?? 'PROV-0000',
    modelRecordId: model?.id ?? raw.modelRecordId,
    modelId: model?.modelId ?? raw.modelId,
    executionRecordId: raw.executionRecordId,
    executionId: raw.executionId,
    requests: numericOrZero(raw.requests),
    inputUnits: numericOrZero(raw.inputUnits),
    outputUnits: numericOrZero(raw.outputUnits),
    unit: raw.unit ?? 'Unknown',
    estimatedCost: numericOrZero(raw.estimatedCost),
    actualCost: numericOrZero(raw.actualCost),
    currency: raw.currency?.trim() || 'USD',
    periodStart: raw.periodStart ?? timestamp,
    periodEnd: raw.periodEnd ?? timestamp,
    notes: raw.notes ?? '',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizePolicy(raw: Partial<ProviderSelectionPolicy>, index = 0): ProviderSelectionPolicy {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('provider-policy'),
    policyId: raw.policyId ?? fallbackRecordCode('PROVPOL', index),
    name: raw.name?.trim() || 'Untitled Provider Policy',
    description: raw.description?.trim() || 'Provider selection policy structure. No selection algorithm is implemented.',
    requiredCapabilities: uniqueCapabilities(raw.requiredCapabilities),
    providerPriority: raw.providerPriority ?? 'Medium',
    maximumEstimatedCost: raw.maximumEstimatedCost === undefined ? undefined : numericOrZero(raw.maximumEstimatedCost),
    currency: raw.currency?.trim() || 'USD',
    localOnly: Boolean(raw.localOnly),
    cloudAllowed: raw.cloudAllowed ?? true,
    privacyRequirement: raw.privacyRequirement ?? 'Any',
    speedPriority: raw.speedPriority ?? 'Medium',
    qualityPriority: raw.qualityPriority ?? 'Medium',
    fallbackAllowed: raw.fallbackAllowed ?? true,
    preferredProviderId: raw.preferredProviderId,
    excludedProviderIds: uniqueStrings(raw.excludedProviderIds),
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function normalizeState(raw: Partial<ProviderStoreState>): ProviderStoreState {
  const providers = Array.isArray(raw.providers) ? raw.providers.map((provider, index) => normalizeProvider(provider, index)) : []
  const models = Array.isArray(raw.models) ? raw.models.map((model, index) => normalizeModel(model, providers, index)) : []
  return {
    providers,
    models,
    configurations: Array.isArray(raw.configurations)
      ? raw.configurations.map((configuration, index) => normalizeConfiguration(configuration, providers, index))
      : [],
    healthRecords: Array.isArray(raw.healthRecords)
      ? raw.healthRecords.map((health, index) => normalizeHealth(health, providers, index))
      : [],
    usageSummaries: Array.isArray(raw.usageSummaries)
      ? raw.usageSummaries.map((usage, index) => normalizeUsage(usage, providers, models, index))
      : [],
    selectionPolicies: Array.isArray(raw.selectionPolicies)
      ? raw.selectionPolicies.map((policy, index) => normalizePolicy(policy, index))
      : [],
  }
}

function emptyState(): ProviderStoreState {
  return {
    providers: [],
    models: [],
    configurations: [],
    healthRecords: [],
    usageSummaries: [],
    selectionPolicies: [],
  }
}

function readState(): ProviderStoreState {
  if (typeof window === 'undefined') return emptyState()

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState()
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyState()
    return normalizeState(parsed)
  } catch {
    return emptyState()
  }
}

let state = readState()

if (typeof window !== 'undefined') {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Keep normalized in-memory provider state if localStorage is temporarily unavailable.
  }

  window.addEventListener('storage', (storageEvent) => {
    if (storageEvent.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: ProviderStoreState) {
  state = next
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Preserve in-memory state and still notify local subscribers.
    }
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function providerExists(name: string, providerType: ProviderInput['type']) {
  const normalizedName = name.trim().toLowerCase()
  return state.providers.find((provider) => provider.name.trim().toLowerCase() === normalizedName && provider.type === providerType)
}

function providerByRecordId(providerRecordId: string) {
  return state.providers.find((provider) => provider.id === providerRecordId || provider.providerId === providerRecordId)
}

export const providerStore = {
  storageKey: STORAGE_KEY,

  getState() {
    return state
  },

  getProviders() {
    return state.providers
  },

  getProvider(providerRecordId: string) {
    return providerByRecordId(providerRecordId)
  },

  addProvider(input: ProviderInput) {
    const existing = providerExists(input.name, input.type)
    if (existing) return existing

    const timestamp = now()
    const provider = normalizeProvider({
      id: id('provider'),
      providerId: generateProviderCode(state.providers),
      name: input.name,
      type: input.type,
      source: input.source ?? 'User Defined',
      description: input.description,
      runtime: input.runtime,
      supportedCapabilities: input.supportedCapabilities ?? [],
      enabled: input.enabled ?? false,
      status: input.status ?? (input.enabled ? 'Unconfigured' : 'Disabled'),
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    persist({ ...state, providers: [provider, ...state.providers] })
    return provider
  },

  updateProvider(providerRecordId: string, updates: ProviderUpdate) {
    const timestamp = now()
    let updated: ProviderRecord | undefined
    const providers = state.providers.map((provider) => {
      if (provider.id !== providerRecordId && provider.providerId !== providerRecordId) return provider
      updated = normalizeProvider({
        ...provider,
        ...updates,
        name: updates.name ?? provider.name,
        description: updates.description ?? provider.description,
        supportedCapabilities: updates.supportedCapabilities ?? provider.supportedCapabilities,
        updatedAt: timestamp,
      })
      return updated
    })

    persist({ ...state, providers })
    return updated
  },

  removeProvider(providerRecordId: string) {
    const provider = providerByRecordId(providerRecordId)
    if (!provider) return false

    persist({
      ...state,
      providers: state.providers.filter((item) => item.id !== provider.id),
      models: state.models.filter((model) => model.providerRecordId !== provider.id),
      configurations: state.configurations.filter((configuration) => configuration.providerRecordId !== provider.id),
      healthRecords: state.healthRecords.filter((health) => health.providerRecordId !== provider.id),
      usageSummaries: state.usageSummaries.filter((usage) => usage.providerRecordId !== provider.id),
    })
    return true
  },

  enableProvider(providerRecordId: string) {
    return this.updateProvider(providerRecordId, { enabled: true, status: 'Unconfigured' })
  },

  disableProvider(providerRecordId: string) {
    return this.updateProvider(providerRecordId, { enabled: false, status: 'Disabled' })
  },

  getModels() {
    return state.models
  },

  getModel(modelRecordId: string) {
    return state.models.find((model) => model.id === modelRecordId || model.modelId === modelRecordId)
  },

  addModel(input: ProviderModelInput) {
    const provider = providerByRecordId(input.providerRecordId)
    if (!provider) return undefined

    const existing = state.models.find((model) =>
      model.providerRecordId === provider.id &&
      model.modelName.trim().toLowerCase() === input.modelName.trim().toLowerCase()
    )
    if (existing) return existing

    const timestamp = now()
    const model = normalizeModel({
      id: id('provider-model'),
      modelId: generateModelCode(state.models),
      providerRecordId: provider.id,
      providerId: provider.providerId,
      displayName: input.displayName,
      modelName: input.modelName,
      runtime: input.runtime,
      supportedCapabilities: input.supportedCapabilities ?? [],
      enabled: input.enabled ?? false,
      contextLimits: input.contextLimits,
      inputSupport: input.inputSupport ?? [],
      outputSupport: input.outputSupport ?? [],
      costMetadata: input.costMetadata,
      performanceMetadata: input.performanceMetadata,
      availability: input.availability ?? 'Unknown',
      health: input.health ?? 'Not Checked',
      createdAt: timestamp,
      updatedAt: timestamp,
    }, [provider], state.models.length)

    persist({ ...state, models: [model, ...state.models] })
    return model
  },

  updateModel(modelRecordId: string, updates: ProviderModelUpdate) {
    const timestamp = now()
    let updated: ProviderModelRecord | undefined
    const models = state.models.map((model) => {
      if (model.id !== modelRecordId && model.modelId !== modelRecordId) return model
      updated = normalizeModel({
        ...model,
        ...updates,
        displayName: updates.displayName ?? model.displayName,
        modelName: updates.modelName ?? model.modelName,
        supportedCapabilities: updates.supportedCapabilities ?? model.supportedCapabilities,
        updatedAt: timestamp,
      }, state.providers)
      return updated
    })

    persist({ ...state, models })
    return updated
  },

  removeModel(modelRecordId: string) {
    const model = this.getModel(modelRecordId)
    if (!model) return false
    persist({ ...state, models: state.models.filter((item) => item.id !== model.id) })
    return true
  },

  upsertConfiguration(input: ProviderConfigurationInput) {
    const provider = providerByRecordId(input.providerRecordId)
    if (!provider) return undefined

    const timestamp = now()
    const existing = state.configurations.find((configuration) => configuration.providerRecordId === provider.id)
    const configuration = normalizeConfiguration({
      ...existing,
      ...input,
      id: existing?.id ?? id('provider-config'),
      configurationId: existing?.configurationId ?? fallbackRecordCode('PROVCFG', state.configurations.length),
      providerRecordId: provider.id,
      providerId: provider.providerId,
      updatedAt: timestamp,
      createdAt: existing?.createdAt ?? timestamp,
    }, [provider], state.configurations.length)

    persist({
      ...state,
      configurations: existing
        ? state.configurations.map((item) => item.id === existing.id ? configuration : item)
        : [configuration, ...state.configurations],
    })
    return configuration
  },

  recordHealth(input: ProviderHealthInput) {
    const provider = providerByRecordId(input.providerRecordId)
    if (!provider) return undefined

    const timestamp = now()
    const health = normalizeHealth({
      id: id('provider-health'),
      healthId: fallbackRecordCode('PROVHLTH', state.healthRecords.length),
      providerRecordId: provider.id,
      providerId: provider.providerId,
      status: input.status ?? 'Not Checked',
      responseTimeMs: input.responseTimeMs,
      lastError: input.lastError,
      consecutiveFailures: input.consecutiveFailures,
      availability: input.availability,
      notes: input.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    }, [provider], state.healthRecords.length)

    persist({ ...state, healthRecords: [health, ...state.healthRecords] })
    return health
  },

  recordUsage(input: ProviderUsageInput) {
    const provider = providerByRecordId(input.providerRecordId)
    if (!provider) return undefined
    const model = input.modelRecordId ? state.models.find((item) => item.id === input.modelRecordId || item.modelId === input.modelRecordId) : undefined

    const timestamp = now()
    const usage = normalizeUsage({
      id: id('provider-usage'),
      usageId: fallbackRecordCode('PROVUSE', state.usageSummaries.length),
      ...input,
      providerRecordId: provider.id,
      providerId: provider.providerId,
      modelRecordId: model?.id,
      modelId: model?.modelId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }, [provider], model ? [model] : [], state.usageSummaries.length)

    persist({ ...state, usageSummaries: [usage, ...state.usageSummaries] })
    return usage
  },

  addSelectionPolicy(input: ProviderSelectionPolicyInput) {
    const existing = state.selectionPolicies.find((policy) => policy.name.trim().toLowerCase() === input.name.trim().toLowerCase())
    if (existing) return existing

    const timestamp = now()
    const policy = normalizePolicy({
      id: id('provider-policy'),
      policyId: fallbackRecordCode('PROVPOL', state.selectionPolicies.length),
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
    }, state.selectionPolicies.length)

    persist({ ...state, selectionPolicies: [policy, ...state.selectionPolicies] })
    return policy
  },
}

export function useProviderStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    ...snapshot,
    addProvider: providerStore.addProvider,
    updateProvider: providerStore.updateProvider,
    removeProvider: providerStore.removeProvider,
    enableProvider: providerStore.enableProvider.bind(providerStore),
    disableProvider: providerStore.disableProvider.bind(providerStore),
    addModel: providerStore.addModel,
    updateModel: providerStore.updateModel,
    removeModel: providerStore.removeModel.bind(providerStore),
    upsertConfiguration: providerStore.upsertConfiguration,
    recordHealth: providerStore.recordHealth,
    recordUsage: providerStore.recordUsage,
    addSelectionPolicy: providerStore.addSelectionPolicy,
    getProvider: providerStore.getProvider,
    getModel: providerStore.getModel,
  }
}

export const providerCapabilityDefinitions: ProviderCapabilityDefinition[] = providerCapabilities.map((capability, index) => ({
  id: `provider-capability-${index + 1}`,
  capabilityId: `CAPABILITY-${String(index + 1).padStart(4, '0')}`,
  name: capability,
  description: `${capability} capability definition. Providers or models may advertise support, but capabilities remain provider-independent.`,
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
}))
