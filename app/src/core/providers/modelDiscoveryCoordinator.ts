import { providerCapabilities, providerStore } from './providerStore'
import {
  DiscoveredProviderModel,
  ModelDiscoveryFailureCode,
  ModelDiscoveryNormalizationResult,
  ModelDiscoverySubmission,
  ModelDiscoveryWarningCode,
  ModelRegistrationApplyResult,
  ModelRegistrationPlan,
  ModelRegistrationPlanItem,
  NormalizedDiscoveredModel,
} from './modelDiscoveryTypes'
import {
  ProviderAvailability,
  ProviderCapability,
  ProviderInputSupport,
  ProviderModelInput,
  ProviderOutputSupport,
  ProviderRecord,
  ProviderRuntime,
} from './providerTypes'

const inputModalities: ProviderInputSupport[] = ['Text', 'Image', 'Audio', 'File', 'Structured Data']
const outputModalities: ProviderOutputSupport[] = ['Text', 'Image', 'Audio', 'Embeddings', 'Structured Data', 'Code']
const runtimes: ProviderRuntime[] = ['Local', 'Cloud', 'Hybrid']
const availabilities: ProviderAvailability[] = ['Unknown', 'Available', 'Unavailable', 'Limited']

function now() {
  return new Date().toISOString()
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function nonNegativeNumber(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return undefined
  return numeric
}

function normalizeCapabilities(model: DiscoveredProviderModel, warnings: ModelDiscoveryWarningCode[]) {
  const raw = [
    ...(model.supportedCapabilities ?? []),
    ...(model.toolUseSupported ? ['Tool Use' as ProviderCapability] : []),
    ...(model.structuredOutputSupported ? ['Structured Output' as ProviderCapability] : []),
  ]

  const normalized = unique(raw.filter((capability): capability is ProviderCapability => providerCapabilities.includes(capability)))
  if (raw.length !== normalized.length) warnings.push('Unknown Capability Ignored')
  return normalized
}

function normalizeInputModalities(model: DiscoveredProviderModel, warnings: ModelDiscoveryWarningCode[]) {
  const raw = model.inputModalities ?? []
  const normalized = unique(raw.filter((modality): modality is ProviderInputSupport => inputModalities.includes(modality)))
  if (raw.length !== normalized.length) warnings.push('Unknown Input Modality Ignored')
  return normalized
}

function normalizeOutputModalities(model: DiscoveredProviderModel, warnings: ModelDiscoveryWarningCode[]) {
  const raw = model.outputModalities ?? []
  const normalized = unique(raw.filter((modality): modality is ProviderOutputSupport => outputModalities.includes(modality)))
  if (raw.length !== normalized.length) warnings.push('Unknown Output Modality Ignored')
  return normalized
}

function normalizeRuntime(model: DiscoveredProviderModel, provider: ProviderRecord, failures: ModelDiscoveryFailureCode[]) {
  if (!model.runtime) return provider.runtime
  if (!runtimes.includes(model.runtime)) {
    failures.push('Invalid Runtime')
    return provider.runtime
  }
  return model.runtime
}

function normalizeAvailability(value: ProviderAvailability | undefined) {
  return value && availabilities.includes(value) ? value : 'Unknown'
}

function modelInputEquals(a: ProviderModelInput, b: ProviderModelInput) {
  return JSON.stringify({
    displayName: a.displayName,
    modelName: a.modelName,
    runtime: a.runtime,
    supportedCapabilities: a.supportedCapabilities ?? [],
    contextLimits: a.contextLimits,
    inputSupport: a.inputSupport ?? [],
    outputSupport: a.outputSupport ?? [],
    costMetadata: a.costMetadata,
    availability: a.availability,
  }) === JSON.stringify({
    displayName: b.displayName,
    modelName: b.modelName,
    runtime: b.runtime,
    supportedCapabilities: b.supportedCapabilities ?? [],
    contextLimits: b.contextLimits,
    inputSupport: b.inputSupport ?? [],
    outputSupport: b.outputSupport ?? [],
    costMetadata: b.costMetadata,
    availability: b.availability,
  })
}

function inputFromExisting(existing: NonNullable<ReturnType<typeof providerStore.getModel>>): ProviderModelInput {
  return {
    providerRecordId: existing.providerRecordId,
    displayName: existing.displayName,
    modelName: existing.modelName,
    runtime: existing.runtime,
    supportedCapabilities: existing.supportedCapabilities,
    enabled: existing.enabled,
    contextLimits: existing.contextLimits,
    inputSupport: existing.inputSupport,
    outputSupport: existing.outputSupport,
    costMetadata: existing.costMetadata,
    performanceMetadata: existing.performanceMetadata,
    availability: existing.availability,
    health: existing.health,
  }
}

export function normalizeDiscoveredModel(
  providerRecordId: string,
  model: DiscoveredProviderModel,
  source: ModelDiscoverySubmission['source'],
): ModelDiscoveryNormalizationResult {
  const provider = providerStore.getProvider(providerRecordId)
  const warningCodes: ModelDiscoveryWarningCode[] = []
  const failureCodes: ModelDiscoveryFailureCode[] = []

  if (!provider) failureCodes.push('Provider Not Found')
  if (!model.discoveredModelId?.trim()) failureCodes.push('Missing Model Identifier')

  const displayName = model.displayName?.trim() || model.modelName?.trim() || model.discoveredModelId?.trim()
  if (!displayName) failureCodes.push('Missing Display Name')

  const contextWindowTokens = nonNegativeNumber(model.contextWindowTokens)
  const maxInputTokens = nonNegativeNumber(model.maxInputTokens)
  const maxOutputTokens = nonNegativeNumber(model.maxOutputTokens)

  if (
    (model.contextWindowTokens !== undefined && contextWindowTokens === undefined) ||
    (model.maxInputTokens !== undefined && maxInputTokens === undefined) ||
    (model.maxOutputTokens !== undefined && maxOutputTokens === undefined)
  ) {
    failureCodes.push('Invalid Context Metadata')
  }

  if (!contextWindowTokens && !maxInputTokens && !maxOutputTokens) warningCodes.push('Context Metadata Missing')
  if (!model.costMetadata) warningCodes.push('Cost Metadata Missing')

  if (!provider || failureCodes.length > 0) {
    return { status: 'Rejected', warningCodes: unique(warningCodes), failureCodes: unique(failureCodes) }
  }

  const modelInput: ProviderModelInput = {
    providerRecordId: provider.id,
    displayName,
    modelName: model.modelName?.trim() || model.discoveredModelId.trim(),
    runtime: normalizeRuntime(model, provider, failureCodes),
    supportedCapabilities: normalizeCapabilities(model, warningCodes),
    enabled: false,
    contextLimits: {
      maxContextTokens: contextWindowTokens,
      maxInputTokens,
      maxOutputTokens,
      notes: [model.modelFamily, model.modelVersion].filter(Boolean).join(' ') || undefined,
    },
    inputSupport: normalizeInputModalities(model, warningCodes),
    outputSupport: normalizeOutputModalities(model, warningCodes),
    costMetadata: model.costMetadata,
    availability: normalizeAvailability(model.availability),
    health: 'Not Checked',
  }

  const normalizedModel: NormalizedDiscoveredModel = {
    discoveryModelId: model.discoveredModelId.trim(),
    providerRecordId: provider.id,
    providerId: provider.providerId,
    modelInput,
    discoveredAt: model.discoveredAt ?? now(),
    source,
    warningCodes: unique(warningCodes),
    metadata: model.metadata ?? {},
  }

  return { status: 'Normalized', normalizedModel, warningCodes: unique(warningCodes), failureCodes: [] }
}

function existingModel(providerRecordId: string, normalized: NormalizedDiscoveredModel) {
  return providerStore.getState().models.find((model) =>
    model.providerRecordId === providerRecordId &&
    model.modelName.trim().toLowerCase() === normalized.modelInput.modelName.trim().toLowerCase()
  )
}

function itemForModel(submission: ModelDiscoverySubmission, model: DiscoveredProviderModel): ModelRegistrationPlanItem {
  const normalized = normalizeDiscoveredModel(submission.providerRecordId, model, submission.source)

  if (normalized.status === 'Rejected') {
    return {
      status: 'Rejected',
      discoveredModel: model,
      warningCodes: normalized.warningCodes,
      failureCodes: normalized.failureCodes,
    }
  }

  const existing = existingModel(submission.providerRecordId, normalized.normalizedModel)
  if (!existing) {
    return {
      status: 'Add',
      discoveredModel: model,
      normalizedModel: normalized.normalizedModel,
      warningCodes: normalized.warningCodes,
      failureCodes: [],
    }
  }

  const existingInput = inputFromExisting(existing)
  const unchanged = modelInputEquals(existingInput, normalized.normalizedModel.modelInput)

  return {
    status: unchanged ? 'Unchanged' : 'Update',
    discoveredModel: model,
    normalizedModel: normalized.normalizedModel,
    existingModel: existing,
    warningCodes: unique([...normalized.warningCodes, 'Duplicate Model']),
    failureCodes: [],
  }
}

export const modelDiscoveryCoordinator = {
  createRegistrationPlan(submission: ModelDiscoverySubmission): ModelRegistrationPlan {
    const generatedAt = now()
    const provider = providerStore.getProvider(submission.providerRecordId)
    const submissionFailures = [...(submission.failureCodes ?? [])]

    if (!provider) submissionFailures.push('Provider Not Found')
    if (submission.outcome === 'Provider Unavailable') submissionFailures.push('Provider Unavailable')
    if (submission.outcome === 'Provider Not Configured') submissionFailures.push('Provider Not Configured')
    if (submission.outcome === 'Discovery Unsupported') submissionFailures.push('Discovery Unsupported')
    if (submission.outcome === 'Invalid Discovery Response') submissionFailures.push('Invalid Discovery Response')

    const items = submissionFailures.length > 0
      ? submission.models.map((model): ModelRegistrationPlanItem => ({
        status: 'Rejected',
        discoveredModel: model,
        warningCodes: submission.warningCodes ?? [],
        failureCodes: unique(submissionFailures),
      }))
      : submission.models.map((model) => itemForModel(submission, model))

    const allItems = submission.models.length === 0 && submissionFailures.length > 0
      ? [{
        status: 'Rejected' as const,
        warningCodes: submission.warningCodes ?? [],
        failureCodes: unique(submissionFailures),
      }]
      : items

    return {
      providerRecordId: submission.providerRecordId,
      providerId: provider?.providerId,
      discoveryRequestId: submission.discoveryRequestId,
      source: submission.source,
      outcome: submission.outcome,
      generatedAt,
      items: allItems,
      addedCount: allItems.filter((item) => item.status === 'Add').length,
      updatedCount: allItems.filter((item) => item.status === 'Update').length,
      unchangedCount: allItems.filter((item) => item.status === 'Unchanged').length,
      rejectedCount: allItems.filter((item) => item.status === 'Rejected').length,
      warningCount: allItems.reduce((count, item) => count + item.warningCodes.length, 0),
      failureCount: allItems.reduce((count, item) => count + item.failureCodes.length, 0),
    }
  },

  applyRegistrationPlan(plan: ModelRegistrationPlan): ModelRegistrationApplyResult {
    const added = []
    const updated = []
    const skipped = []
    const rejected = []

    for (const item of plan.items) {
      if (item.status === 'Rejected') {
        rejected.push(item)
        continue
      }
      if (!item.normalizedModel) {
        skipped.push(item)
        continue
      }
      if (item.status === 'Add') {
        const model = providerStore.addModel(item.normalizedModel.modelInput)
        if (model) added.push(model)
        continue
      }
      if (item.status === 'Update' && item.existingModel) {
        const model = providerStore.updateModel(item.existingModel.id, item.normalizedModel.modelInput)
        if (model) updated.push(model)
        continue
      }
      skipped.push(item)
    }

    return { added, updated, skipped, rejected }
  },
}
