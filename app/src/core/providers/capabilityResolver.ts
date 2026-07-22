import { providerManager, ProviderRecommendation } from './providerManager'
import { providerCapabilities } from './providerStore'
import {
  CapabilityRoutingCandidateEvaluation,
  CapabilityRoutingFailureCode,
  CapabilityRoutingReason,
  CapabilityRoutingRequest,
  CapabilityRoutingResult,
  CapabilityRoutingSuccessResult,
  CapabilityRoutingWarningCode,
  NormalizedCapabilityRoutingRequest,
} from './capabilityRoutingTypes'
import {
  ProviderCapability,
  ProviderInputSupport,
  ProviderModelRecord,
  ProviderOutputSupport,
  ProviderRecord,
} from './providerTypes'

const healthyStates = new Set(['Healthy', 'Unknown', 'Not Checked'])
const availableStates = new Set(['Available', 'Limited', 'Unknown'])

function now() {
  return new Date().toISOString()
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function uniqueStrings(items: string[] | undefined) {
  if (!items) return []
  return unique(items.map((item) => item.trim()).filter(Boolean))
}

function isProviderCapability(value: unknown): value is ProviderCapability {
  return typeof value === 'string' && providerCapabilities.includes(value as ProviderCapability)
}

function validIsoTimestamp(value: string) {
  return Boolean(value && !Number.isNaN(Date.parse(value)))
}

function costEstimate(model: ProviderModelRecord) {
  const input = model.costMetadata?.estimatedInputCostPerUnit
  const output = model.costMetadata?.estimatedOutputCostPerUnit
  if (input === undefined && output === undefined) return undefined
  return Math.max(0, input ?? 0) + Math.max(0, output ?? 0)
}

function supportsInput(model: ProviderModelRecord, modalities: ProviderInputSupport[]) {
  if (modalities.length === 0) return true
  return modalities.every((modality) => model.inputSupport.includes(modality))
}

function supportsOutput(model: ProviderModelRecord, modalities: ProviderOutputSupport[]) {
  if (modalities.length === 0) return true
  return modalities.every((modality) => model.outputSupport.includes(modality))
}

function supportsContext(model: ProviderModelRecord, minimumContextTokens?: number) {
  if (!minimumContextTokens) return true
  const contextLimit = model.contextLimits?.maxContextTokens ?? model.contextLimits?.maxInputTokens
  return contextLimit !== undefined && contextLimit >= minimumContextTokens
}

function reason(code: CapabilityRoutingFailureCode | CapabilityRoutingWarningCode | 'Provider Recommended', message: string): CapabilityRoutingReason {
  return { code, message }
}

function matchedCapabilities(provider: ProviderRecord, models: ProviderModelRecord[], requiredCapabilities: ProviderCapability[]) {
  const supported = new Set<ProviderCapability>([
    ...provider.supportedCapabilities,
    ...models.flatMap((model) => model.supportedCapabilities),
  ])
  return requiredCapabilities.filter((capability) => supported.has(capability))
}

function snapshot(candidate: CapabilityRoutingCandidateEvaluation) {
  return {
    providerId: candidate.provider.providerId,
    providerRecordId: candidate.provider.id,
    providerName: candidate.provider.name,
    runtime: candidate.provider.runtime,
    score: candidate.score,
    healthStatus: candidate.healthStatus,
    availability: candidate.availability,
    configured: candidate.configured,
    matchedCapabilities: candidate.matchedCapabilities,
    modelIds: candidate.models.map((model) => model.modelId),
    modelRecordIds: candidate.models.map((model) => model.id),
    reasons: candidate.reasons,
    warnings: candidate.warnings,
  }
}

function normalizeRequest(request: CapabilityRoutingRequest) {
  const failureCodes: CapabilityRoutingFailureCode[] = []
  const conflictingConstraints: string[] = []
  const additionalCapabilities = request.additionalCapabilities ?? []
  const requiredCapabilities = unique([
    request.requestedCapability,
    ...additionalCapabilities,
    ...(request.requiresStructuredOutput ? ['Structured Output' as ProviderCapability] : []),
    ...(request.requiresToolUse ? ['Tool Use' as ProviderCapability] : []),
    ...(request.minimumContextTokens ? ['Long Context' as ProviderCapability] : []),
  ]).filter(isProviderCapability)

  if (!request.requestId?.trim()) failureCodes.push('Missing Request ID')
  if (!request.requestingEntity?.entityId?.trim()) failureCodes.push('Missing Requesting Entity')
  if (!request.requestedCapability) failureCodes.push('Missing Capability')
  if (request.requestedCapability && !isProviderCapability(request.requestedCapability)) failureCodes.push('Unknown Capability')
  additionalCapabilities.forEach((capability) => {
    if (!isProviderCapability(capability)) failureCodes.push('Unknown Capability')
  })
  if (!validIsoTimestamp(request.requestedAt)) failureCodes.push('Invalid Timestamp')
  if (request.maximumEstimatedCost !== undefined && (!Number.isFinite(request.maximumEstimatedCost) || request.maximumEstimatedCost < 0)) {
    failureCodes.push('Invalid Cost Constraint')
  }
  if (request.localOnly && request.cloudOnly) {
    failureCodes.push('Conflicting Runtime Constraints')
    conflictingConstraints.push('Request cannot be both local-only and cloud-only.')
  }
  if (request.localOnly && request.cloudAllowed) {
    failureCodes.push('Conflicting Runtime Constraints')
    conflictingConstraints.push('Request marks cloud as allowed while also requiring local-only routing.')
  }
  if (request.preferredProviderId && request.excludedProviderIds?.includes(request.preferredProviderId)) {
    failureCodes.push('Preferred Provider Excluded')
    conflictingConstraints.push('Preferred provider is also listed as excluded.')
  }
  if (request.preferredProviderId && request.preferredProviderPolicyApproved === false) {
    failureCodes.push('Preferred Provider Not Approved')
    conflictingConstraints.push('Preferred provider was supplied without CEO-approved policy permission.')
  }

  if (failureCodes.length > 0) {
    return { normalized: undefined, failureCodes: unique(failureCodes), conflictingConstraints }
  }

  const localOnly = Boolean(request.localOnly)
  const cloudOnly = Boolean(request.cloudOnly)

  const normalized: NormalizedCapabilityRoutingRequest = {
    requestId: request.requestId.trim(),
    requiredCapabilities,
    requestingEntity: {
      ...request.requestingEntity,
      entityId: request.requestingEntity.entityId.trim(),
      displayName: request.requestingEntity.displayName?.trim(),
    },
    workItemId: request.workItemId?.trim(),
    executionId: request.executionId?.trim(),
    capabilityPlanId: request.capabilityPlanId?.trim(),
    requiredInputModalities: unique(request.requiredInputModalities ?? []),
    requiredOutputModalities: unique(request.requiredOutputModalities ?? []),
    minimumContextTokens: request.minimumContextTokens,
    localOnly,
    cloudAllowed: localOnly ? false : request.cloudAllowed ?? true,
    cloudOnly,
    privacyRequirement: request.privacyRequirement ?? (localOnly ? 'Local Only' : 'Any'),
    maximumEstimatedCost: request.maximumEstimatedCost,
    currency: request.currency?.trim() || 'USD',
    speedPriority: request.speedPriority ?? 'Medium',
    qualityPriority: request.qualityPriority ?? 'Medium',
    preferredProviderId: request.preferredProviderId?.trim(),
    excludedProviderIds: uniqueStrings(request.excludedProviderIds),
    fallbackAllowed: request.fallbackAllowed ?? true,
    requestedAt: request.requestedAt,
    metadata: request.metadata ?? {},
  }

  return { normalized, failureCodes: [], conflictingConstraints }
}

function modelMatchesRequest(model: ProviderModelRecord, request: NormalizedCapabilityRoutingRequest) {
  return supportsInput(model, request.requiredInputModalities) &&
    supportsOutput(model, request.requiredOutputModalities) &&
    supportsContext(model, request.minimumContextTokens)
}

function evaluateCandidate(recommendation: ProviderRecommendation, request: NormalizedCapabilityRoutingRequest): CapabilityRoutingCandidateEvaluation {
  const failureCodes: CapabilityRoutingFailureCode[] = []
  const warnings = [...recommendation.warnings]
  const compatibleModels = recommendation.models.filter((model) => model.enabled && modelMatchesRequest(model, request))
  const requiresModelMetadata = request.requiredInputModalities.length > 0 ||
    request.requiredOutputModalities.length > 0 ||
    Boolean(request.minimumContextTokens) ||
    request.maximumEstimatedCost !== undefined

  if (!recommendation.configured) failureCodes.push('No Configured Provider')
  if (!recommendation.provider.enabled) failureCodes.push('No Enabled Provider')
  if (!healthyStates.has(recommendation.healthStatus)) failureCodes.push('No Healthy Provider')
  if (!availableStates.has(recommendation.availability)) failureCodes.push('No Available Provider')
  if (!recommendation.compatible) failureCodes.push('No Compatible Provider')
  if (request.cloudOnly && recommendation.provider.runtime !== 'Cloud') failureCodes.push('Local Cloud Constraint Failure')
  if (request.localOnly && recommendation.provider.runtime !== 'Local') failureCodes.push('Local Cloud Constraint Failure')
  if (request.privacyRequirement === 'Local Only' && recommendation.provider.runtime !== 'Local') failureCodes.push('Privacy Constraint Failure')
  if (requiresModelMetadata && compatibleModels.length === 0) failureCodes.push('No Compatible Model')

  if (request.maximumEstimatedCost !== undefined) {
    const pricedModels = compatibleModels
      .map((model) => ({ model, estimate: costEstimate(model) }))
      .filter((item): item is { model: ProviderModelRecord; estimate: number } => item.estimate !== undefined)

    if (pricedModels.length === 0) {
      warnings.push('No model cost metadata is available for cost filtering.')
    } else if (!pricedModels.some((item) => item.estimate <= request.maximumEstimatedCost!)) {
      failureCodes.push('Cost Constraint Failure')
    }
  }

  const matched = matchedCapabilities(recommendation.provider, recommendation.models, request.requiredCapabilities)
  if (matched.length < request.requiredCapabilities.length) failureCodes.push('Missing Capability Support')

  return {
    provider: recommendation.provider,
    models: compatibleModels.length > 0 || requiresModelMetadata ? compatibleModels : recommendation.models,
    score: recommendation.score,
    compatible: failureCodes.length === 0,
    fallbackEligible: recommendation.fallbackEligible && failureCodes.length === 0,
    healthStatus: recommendation.healthStatus,
    availability: recommendation.availability,
    configured: recommendation.configured,
    matchedCapabilities: matched,
    reasons: recommendation.reasons,
    warnings,
    failureCodes: unique(failureCodes),
  }
}

function failureResult(
  requestId: string,
  normalizedRequest: NormalizedCapabilityRoutingRequest | undefined,
  failureCodes: CapabilityRoutingFailureCode[],
  conflictingConstraints: string[],
  generatedAt: string,
  missingCapabilities: ProviderCapability[] = [],
): CapabilityRoutingResult {
  const uniqueFailures = unique(failureCodes)
  return {
    status: 'Unable To Route',
    requestId,
    normalizedRequest,
    failureCodes: uniqueFailures,
    reasons: uniqueFailures.map((code) => reason(code, code)),
    missingCapabilities,
    conflictingConstraints,
    fallbackUnavailable: uniqueFailures.includes('Fallback Unavailable'),
    humanReviewRequired: uniqueFailures.includes('Human Review Required') ||
      uniqueFailures.includes('Privacy Constraint Failure') ||
      uniqueFailures.includes('Preferred Provider Not Approved'),
    generatedAt,
  }
}

function createSuccessResult(
  request: NormalizedCapabilityRoutingRequest,
  selected: CapabilityRoutingCandidateEvaluation,
  fallbackCandidates: CapabilityRoutingCandidateEvaluation[],
  generatedAt: string,
): CapabilityRoutingSuccessResult {
  const selectedModel = selected.models[0]
  const warnings: CapabilityRoutingReason[] = selected.warnings.map((message) => reason('Provider Has Warnings', message))

  if (fallbackCandidates.length > 0) {
    warnings.push(reason('Fallback Candidates Available', `${fallbackCandidates.length} fallback candidate(s) are available.`))
  }
  if (request.preferredProviderId && ![selected.provider.id, selected.provider.providerId].includes(request.preferredProviderId)) {
    warnings.push(reason('Preferred Provider Not Selected', 'The preferred provider was not selected because another provider ranked higher or satisfied constraints better.'))
  }

  return {
    status: 'Routed',
    requestId: request.requestId,
    normalizedRequest: request,
    recommendedProviderId: selected.provider.providerId,
    recommendedProviderRecordId: selected.provider.id,
    recommendedModelId: selectedModel?.modelId,
    recommendedModelRecordId: selectedModel?.id,
    score: selected.score,
    matchedCapabilities: selected.matchedCapabilities,
    providerState: snapshot(selected),
    fallbackCandidates: fallbackCandidates.map(snapshot),
    reasons: [
      reason('Provider Recommended', `Provider ${selected.provider.name} is the highest ranked compatible stored provider metadata match.`),
      ...selected.reasons.map((message) => reason('Provider Recommended', message)),
    ],
    warnings,
    generatedAt,
  }
}

export const capabilityResolver = {
  normalizeCapabilityRequest(request: CapabilityRoutingRequest) {
    return normalizeRequest(request)
  },

  resolveCapabilityRequest(request: CapabilityRoutingRequest): CapabilityRoutingResult {
    const generatedAt = now()
    const normalizedResult = normalizeRequest(request)

    if (!normalizedResult.normalized) {
      return failureResult(
        request.requestId || 'UNROUTABLE-REQUEST',
        undefined,
        normalizedResult.failureCodes,
        normalizedResult.conflictingConstraints,
        generatedAt,
      )
    }

    const normalized = normalizedResult.normalized
    const recommendations = providerManager.recommendProviders({
      requiredCapabilities: normalized.requiredCapabilities,
      localOnly: normalized.localOnly,
      cloudAllowed: normalized.cloudAllowed,
      preferredProviderId: normalized.preferredProviderId,
      excludedProviderIds: normalized.excludedProviderIds,
      fallbackAllowed: normalized.fallbackAllowed,
      policy: {
        id: `ephemeral-policy-${normalized.requestId}`,
        policyId: `EPHEMERAL-${normalized.requestId}`,
        name: `Capability routing policy for ${normalized.requestId}`,
        description: 'Ephemeral routing policy generated from a capability request. It is not persisted.',
        requiredCapabilities: normalized.requiredCapabilities,
        providerPriority: 'Medium',
        maximumEstimatedCost: normalized.maximumEstimatedCost,
        currency: normalized.currency,
        localOnly: normalized.localOnly,
        cloudAllowed: normalized.cloudAllowed,
        privacyRequirement: normalized.privacyRequirement,
        speedPriority: normalized.speedPriority,
        qualityPriority: normalized.qualityPriority,
        fallbackAllowed: normalized.fallbackAllowed,
        preferredProviderId: normalized.preferredProviderId,
        excludedProviderIds: normalized.excludedProviderIds,
        createdAt: generatedAt,
        updatedAt: generatedAt,
      },
    })

    if (recommendations.length === 0) {
      return failureResult(
        normalized.requestId,
        normalized,
        ['No Compatible Provider'],
        [],
        generatedAt,
        normalized.requiredCapabilities,
      )
    }

    const evaluations = recommendations.map((recommendation) => evaluateCandidate(recommendation, normalized))
    const eligible = evaluations.filter((evaluation) => evaluation.compatible)
    const selected = eligible[0]

    if (!selected) {
      const allFailures = unique(evaluations.flatMap((evaluation) => evaluation.failureCodes))
      const missingCapabilities = normalized.requiredCapabilities.filter((capability) =>
        evaluations.every((evaluation) => !evaluation.matchedCapabilities.includes(capability))
      )

      return failureResult(
        normalized.requestId,
        normalized,
        allFailures.length > 0 ? allFailures : ['No Compatible Provider'],
        [],
        generatedAt,
        missingCapabilities,
      )
    }

    const fallbackCandidates = normalized.fallbackAllowed
      ? eligible.filter((evaluation) => evaluation.provider.id !== selected.provider.id)
      : []

    if (!normalized.fallbackAllowed && eligible.length > 1) {
      selected.warnings.push('Fallback is disabled; alternate compatible providers were not returned as fallback candidates.')
    }

    return createSuccessResult(normalized, selected, fallbackCandidates, generatedAt)
  },
}
