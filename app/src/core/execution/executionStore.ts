import { useSyncExternalStore } from 'react'
import { capabilityResolver, providerManager, type ProviderCapability } from '../providers'
import type { ExecutionQueueRecord } from '../executionQueue'
import type { WorkItemRecord } from '../workItems'
import {
  initialExecutionRequestLifecycle,
  pauseExecutionRecord,
  recordFailureForExecution,
  recordRetryForExecution,
  resumeExecutionRecord,
  transitionExecutionRequestLifecycleRecord,
  transitionExecutionRecord,
} from './executionLifecycle'
import {
  applyReadinessReferences,
  evaluateExecutionReadiness,
  readinessMessage,
} from './executionReadiness'
import {
  createCostRecord,
  createExecutionEvent,
  createExecutionLog,
  normalizeCurrency,
  normalizeMoney,
  summarizeCostRecord,
  validateExecutionAudit,
} from './executionAudit'
import {
  CostRecord,
  ContentScriptExecutionInput,
  ExecutionEvent,
  ExecutionInput,
  ExecutionLifecycleTransitionInput,
  ExecutionLifecycleTransitionResult,
  ExecutionLog,
  ExecutionLogCategory,
  ExecutionLogLevel,
  ExecutionProviderRunResult,
  ExecutionRecord,
  ExecutionRequestLifecycleTransitionInput,
  ExecutionRequestLifecycleTransitionResult,
  ExecutionResult,
  ExecutionReadinessReport,
  ExecutionRiskLevel,
  ExecutionStatus,
  ExecutionType,
  ExecutionUpdate,
  FailureRecord,
  FailureSeverity,
  RetryRecord,
  RetryStatus,
} from './executionTypes'

const STORAGE_KEY = 'ai-operator-os-execution-core-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function fallbackExecutionCode(index: number) {
  return `EXE-${String(index + 1).padStart(4, '0')}`
}

function generateExecutionCode(existing: ExecutionRecord[]) {
  const max = existing.reduce((highest, execution) => {
    const match = execution.executionId?.match(/^EXE-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `EXE-${String(max + 1).padStart(4, '0')}`
}

function event(message: string, createdAt = now()): ExecutionEvent {
  return createExecutionEvent({
    eventType: 'Execution Created',
    message,
    source: 'Execution Store',
    createdAt,
  })
}

function normalizeCostRecord(raw: Partial<CostRecord>, executionId: string, executionRecordId: string, index = 0): CostRecord {
  return {
    id: raw.id ?? id('execution-cost'),
    costRecordId: raw.costRecordId ?? `EXCOST-${String(index + 1).padStart(4, '0')}`,
    executionRecordId: raw.executionRecordId ?? executionRecordId,
    executionId: raw.executionId ?? executionId,
    kind: raw.kind ?? 'Estimated',
    category: raw.category ?? 'Other',
    status: raw.status ?? 'Recorded',
    amount: normalizeMoney(raw.amount),
    currency: normalizeCurrency(raw.currency),
    businessId: raw.businessId,
    projectId: raw.projectId,
    providerId: raw.providerId,
    toolId: raw.toolId,
    approvalId: raw.approvalId,
    notes: raw.notes?.trim() || 'Execution cost recorded.',
    recordedBy: raw.recordedBy?.trim() || 'Execution Core',
    createdAt: raw.createdAt ?? now(),
  }
}

function normalizeLog(raw: Partial<ExecutionLog>, index = 0): ExecutionLog {
  return {
    id: raw.id ?? id('execution-log'),
    logId: raw.logId ?? `EXLOG-${String(index + 1).padStart(4, '0')}`,
    level: raw.level ?? 'Info',
    category: raw.category ?? 'System',
    message: raw.message?.trim() || 'Execution log recorded.',
    source: raw.source?.trim() || 'Execution Store',
    metadata: raw.metadata,
    createdAt: raw.createdAt ?? now(),
  }
}

function normalizeMetadata(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
}

function normalizeExecution(raw: Partial<ExecutionRecord>, index = 0): ExecutionRecord {
  const timestamp = raw.createdAt ?? now()
  const recordId = raw.id ?? id('execution')
  const executionId = raw.executionId ?? fallbackExecutionCode(index)

  return {
    id: recordId,
    executionId,
    title: raw.title?.trim() || 'Untitled Execution',
    description: raw.description?.trim() || 'Execution foundation record. No execution behavior is implemented yet.',
    status: raw.status ?? 'Prepared',
    sourceType: raw.sourceType ?? (raw.executionRequest ? 'Execution Request' : 'Execution Queue'),
    priority: raw.priority ?? 'Medium',
    executionType: raw.executionType ?? 'Manual',
    riskLevel: raw.riskLevel ?? 'Low',
    workItem: {
      workItemRecordId: raw.workItem?.workItemRecordId ?? '',
      workItemId: raw.workItem?.workItemId ?? 'WI-0000',
      title: raw.workItem?.title ?? 'Unknown Work Item',
      projectId: raw.workItem?.projectId ?? '',
      projectCode: raw.workItem?.projectCode ?? 'PROJ-0000',
      businessId: raw.workItem?.businessId ?? '',
      businessCode: raw.workItem?.businessCode ?? 'BIZ-0000',
    },
    queueItem: raw.queueItem ? {
      queueRecordId: raw.queueItem.queueRecordId ?? '',
      queueId: raw.queueItem.queueId ?? 'EQ-0000',
      sourceWorkItemRecordId: raw.queueItem.sourceWorkItemRecordId ?? '',
      sourceWorkItemId: raw.queueItem.sourceWorkItemId ?? 'WI-0000',
    } : undefined,
    workOrder: raw.workOrder ? {
      workOrderId: raw.workOrder.workOrderId ?? '',
      workOrderType: raw.workOrder.workOrderType ?? 'Work Order',
      workOrderStatus: raw.workOrder.workOrderStatus ?? 'Prepared',
      assetType: raw.workOrder.assetType ?? '',
      platform: raw.workOrder.platform ?? '',
      businessAssetProjectId: raw.workOrder.businessAssetProjectId ?? raw.projectId ?? '',
      blueprintDeliverableId: raw.workOrder.blueprintDeliverableId ?? '',
      blueprintDeliverableName: raw.workOrder.blueprintDeliverableName ?? '',
      metadata: normalizeMetadata(raw.workOrder.metadata),
    } : undefined,
    executionRequest: raw.executionRequest ? {
      requestId: raw.executionRequest.requestId ?? '',
      status: raw.executionRequest.status ?? 'Built',
      requestedCapability: raw.executionRequest.requestedCapability ?? '',
      workItemRecordId: raw.executionRequest.workItemRecordId ?? raw.workItem?.workItemRecordId ?? '',
      workItemId: raw.executionRequest.workItemId ?? raw.workItem?.workItemId ?? 'WI-0000',
      projectId: raw.executionRequest.projectId ?? raw.projectId ?? raw.workItem?.projectId ?? '',
      projectCode: raw.executionRequest.projectCode ?? raw.projectCode ?? raw.workItem?.projectCode ?? 'PROJ-0000',
      businessAssetProjectId: raw.executionRequest.businessAssetProjectId ?? raw.projectId ?? '',
      blueprintDeliverableId: raw.executionRequest.blueprintDeliverableId ?? '',
      blueprintDeliverableName: raw.executionRequest.blueprintDeliverableName ?? '',
      knowledgeReferenceIds: Array.isArray(raw.executionRequest.knowledgeReferenceIds) ? raw.executionRequest.knowledgeReferenceIds : [],
      instructions: raw.executionRequest.instructions ?? '',
      outputRequirements: raw.executionRequest.outputRequirements ?? '',
      correlationMetadata: normalizeMetadata(raw.executionRequest.correlationMetadata),
      createdAt: raw.executionRequest.createdAt ?? timestamp,
    } : undefined,
    requestLifecycle: raw.requestLifecycle ? {
      status: raw.requestLifecycle.status ?? 'Pending',
      acceptedAt: raw.requestLifecycle.acceptedAt,
      executingAt: raw.requestLifecycle.executingAt,
      completedAt: raw.requestLifecycle.completedAt,
      failedAt: raw.requestLifecycle.failedAt,
      history: Array.isArray(raw.requestLifecycle.history) ? raw.requestLifecycle.history : [],
    } : (raw.executionRequest ? initialExecutionRequestLifecycle(timestamp) : undefined),
    capabilityPlan: raw.capabilityPlan,
    selectedCapabilities: Array.isArray(raw.selectedCapabilities) ? raw.selectedCapabilities : [],
    selectedTools: Array.isArray(raw.selectedTools) ? raw.selectedTools : [],
    selectedProviders: Array.isArray(raw.selectedProviders) ? raw.selectedProviders : [],
    approval: raw.approval,
    businessId: raw.businessId ?? raw.workItem?.businessId ?? '',
    businessCode: raw.businessCode ?? raw.workItem?.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    projectId: raw.projectId ?? raw.workItem?.projectId ?? '',
    projectCode: raw.projectCode ?? raw.workItem?.projectCode ?? 'PROJ-0000',
    projectName: raw.projectName ?? 'Unknown Project',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    managerId: raw.managerId,
    managerName: raw.managerName ?? 'Unassigned',
    operatorId: raw.operatorId,
    operatorCode: raw.operatorCode,
    operatorName: raw.operatorName ?? 'Unassigned',
    timing: {
      preparedAt: raw.timing?.preparedAt ?? timestamp,
      readyAt: raw.timing?.readyAt,
      startedAt: raw.timing?.startedAt,
      pausedAt: raw.timing?.pausedAt,
      completedAt: raw.timing?.completedAt,
      failedAt: raw.timing?.failedAt,
      cancelledAt: raw.timing?.cancelledAt,
      durationMs: raw.timing?.durationMs,
    },
    estimatedCost: normalizeMoney(raw.estimatedCost),
    actualCost: normalizeMoney(raw.actualCost),
    costRecords: Array.isArray(raw.costRecords)
      ? raw.costRecords.map((record, costIndex) => normalizeCostRecord(record, executionId, recordId, costIndex))
      : [],
    result: raw.result,
    resultRef: raw.resultRef,
    events: Array.isArray(raw.events) && raw.events.length > 0
      ? raw.events
      : [event('Execution foundation record created.', timestamp)],
    transitionHistory: Array.isArray(raw.transitionHistory) ? raw.transitionHistory : [],
    logs: Array.isArray(raw.logs) ? raw.logs.map((log, logIndex) => normalizeLog(log, logIndex)) : [],
    retryHistory: Array.isArray(raw.retryHistory) ? raw.retryHistory : [],
    failures: Array.isArray(raw.failures) ? raw.failures : [],
    notes: raw.notes ?? '',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
  }
}

function readState(): ExecutionRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeExecution(item, index))
  } catch {
    return []
  }
}

let state = readState()

if (typeof window !== 'undefined' && state.length > 0) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Keep normalized in-memory state if localStorage is temporarily unavailable.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (storageEvent) => {
    if (storageEvent.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: ExecutionRecord[]) {
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

function appendEvent(execution: ExecutionRecord, message: string, eventType: ExecutionEvent['eventType'] = 'State Updated') {
  const createdAt = now()
  return {
    ...execution,
    updatedAt: createdAt,
    events: [
      createExecutionEvent({
        eventType,
        message,
        source: 'Execution Store',
        createdAt,
      }),
      ...execution.events,
    ],
  }
}

function providerExecutionMetadata(execution: ExecutionRecord) {
  return {
    executionRecordId: execution.id,
    executionId: execution.executionId,
    executionRequestId: execution.executionRequest?.requestId,
    workItemId: execution.workItem.workItemId,
    workOrderId: execution.workOrder?.workOrderId,
    blueprintDeliverableId: execution.executionRequest?.blueprintDeliverableId,
    ...execution.executionRequest?.correlationMetadata,
  }
}

function executionRequestPrompt(execution: ExecutionRecord) {
  const request = execution.executionRequest
  if (!request) return ''

  return [
    request.instructions,
    '',
    'Output Requirements:',
    request.outputRequirements,
  ].join('\n').trim()
}

function resultFromProviderExecution(
  execution: ExecutionRecord,
  providerResult: Awaited<ReturnType<typeof providerManager.executePrompt>>,
): ExecutionResult {
  const timestamp = providerResult.completedAt
  return {
    id: id('execution-result'),
    resultId: `EXR-${Date.now()}`,
    executionRecordId: execution.id,
    executionId: execution.executionId,
    status: 'Recorded',
    summary: providerResult.success
      ? providerResult.response
      : providerResult.errorMessage,
    success: providerResult.success,
    failure: !providerResult.success,
    provider: providerResult.provider ? {
      providerId: providerResult.provider.providerId,
      providerRecordId: providerResult.provider.providerRecordId,
      name: providerResult.provider.name,
    } : undefined,
    model: providerResult.model ? {
      modelId: providerResult.model.modelId,
      modelRecordId: providerResult.model.modelRecordId,
      name: providerResult.model.name,
    } : undefined,
    responseText: providerResult.response,
    latencyMs: providerResult.latencyMs,
    startedAt: providerResult.startedAt,
    completedAt: providerResult.completedAt,
    lifecycleState: providerResult.success ? 'Completed' : 'Failed',
    errorMessage: providerResult.success ? undefined : providerResult.errorMessage,
    artifactRefs: [],
    recommendedNextAction: providerResult.success
      ? 'Review the structured execution result. Blueprint deliverables remain unchanged until a later approved task applies results.'
      : 'Review provider execution failure details before retrying in a later approved workflow.',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const executionStore = {
  createExecution(input: ExecutionInput) {
    const timestamp = now()
    const execution: ExecutionRecord = {
      id: id('execution'),
      executionId: generateExecutionCode(state),
      title: input.title.trim() || 'Untitled Execution',
      description: input.description.trim() || 'Execution foundation record. No execution behavior is implemented yet.',
      status: 'Prepared',
      sourceType: 'Execution Queue',
      priority: input.priority,
      executionType: input.executionType,
      riskLevel: input.riskLevel,
      workItem: input.workItem,
      queueItem: input.queueItem,
      capabilityPlan: input.capabilityPlan,
      selectedCapabilities: input.selectedCapabilities ?? [],
      selectedTools: input.selectedTools ?? [],
      selectedProviders: input.selectedProviders ?? [],
      approval: input.approval,
      businessId: input.businessId,
      businessCode: input.businessCode,
      businessName: input.businessName,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectName: input.projectName,
      departmentId: input.departmentId,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      managerId: input.managerId,
      managerName: input.managerName || 'Unassigned',
      operatorId: input.operatorId,
      operatorCode: input.operatorCode,
      operatorName: input.operatorName || 'Unassigned',
      timing: {
        preparedAt: timestamp,
      },
      estimatedCost: normalizeMoney(input.estimatedCost),
      actualCost: normalizeMoney(input.actualCost),
      costRecords: [],
      result: undefined,
      resultRef: undefined,
      events: [event(`Execution record prepared from ${input.queueItem.queueId}.`, timestamp)],
      transitionHistory: [],
      logs: [],
      retryHistory: [],
      failures: [],
      notes: input.notes.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    persist([execution, ...state])
    return execution
  },

  createExecutionFromQueueItem(queueItem: ExecutionQueueRecord) {
    const existing = state.find((execution) => execution.queueItem?.queueRecordId === queueItem.id)

    if (existing) {
      return existing
    }

    const timestamp = now()
    const execution: ExecutionRecord = applyReadinessReferences({
      id: id('execution'),
      executionId: generateExecutionCode(state),
      title: `${queueItem.sourceWorkItemId} execution record`,
      description: `Execution infrastructure record for ${queueItem.workItemTitle}. This record stores references only and does not execute work.`,
      status: 'Prepared',
      sourceType: 'Execution Queue',
      priority: queueItem.priority,
      executionType: queueItem.executionType,
      riskLevel: queueItem.requiresApproval ? 'High' : 'Low',
      workItem: {
        workItemRecordId: queueItem.sourceWorkItemRecordId,
        workItemId: queueItem.sourceWorkItemId,
        title: queueItem.workItemTitle,
        projectId: queueItem.projectId,
        projectCode: queueItem.projectCode,
        businessId: queueItem.businessId,
        businessCode: queueItem.businessCode,
      },
      queueItem: {
        queueRecordId: queueItem.id,
        queueId: queueItem.queueId,
        sourceWorkItemRecordId: queueItem.sourceWorkItemRecordId,
        sourceWorkItemId: queueItem.sourceWorkItemId,
      },
      selectedCapabilities: [],
      selectedTools: [],
      selectedProviders: [],
      businessId: queueItem.businessId,
      businessCode: queueItem.businessCode,
      businessName: queueItem.businessName,
      projectId: queueItem.projectId,
      projectCode: queueItem.projectCode,
      projectName: queueItem.projectName,
      departmentId: queueItem.departmentId,
      departmentCode: queueItem.departmentCode,
      departmentName: queueItem.departmentName,
      managerId: queueItem.managerId,
      managerName: queueItem.managerName || 'Unassigned',
      operatorId: queueItem.operatorId,
      operatorCode: queueItem.operatorCode,
      operatorName: queueItem.operatorName || 'Unassigned',
      timing: {
        preparedAt: timestamp,
      },
      estimatedCost: 0,
      actualCost: 0,
      costRecords: [],
      events: [event(`Execution detail record prepared from ${queueItem.queueId}.`, timestamp)],
      transitionHistory: [],
      logs: [],
      retryHistory: [],
      failures: [],
      notes: queueItem.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    persist([execution, ...state])
    return execution
  },

  createExecutionFromWorkOrder(workItem: WorkItemRecord) {
    const workOrder = workItem.workOrder
    const executionRequest = workOrder?.executionRequest

    if (!workOrder?.enabled || !executionRequest) {
      return undefined
    }

    const existing = state.find((execution) =>
      execution.executionRequest?.requestId === executionRequest.requestId ||
      execution.workOrder?.workOrderId === workOrder.workOrderId,
    )

    if (existing) {
      return existing
    }

    const timestamp = now()
    const requestLifecycle = initialExecutionRequestLifecycle(timestamp)
    const execution: ExecutionRecord = {
      id: id('execution'),
      executionId: generateExecutionCode(state),
      title: `${workOrder.workOrderId} execution lifecycle`,
      description: `Execution lifecycle record for ${executionRequest.requestId}. This record establishes lifecycle ownership only and does not execute providers or update Blueprint deliverables.`,
      status: 'Prepared',
      sourceType: 'Execution Request',
      priority: workItem.priority,
      executionType: 'Future AI',
      riskLevel: 'Medium',
      workItem: {
        workItemRecordId: workItem.id,
        workItemId: workItem.workItemId,
        title: workItem.title,
        projectId: workItem.projectId,
        projectCode: workItem.projectCode,
        businessId: workItem.businessId,
        businessCode: workItem.businessCode,
      },
      workOrder: {
        workOrderId: workOrder.workOrderId,
        workOrderType: workOrder.workOrderType,
        workOrderStatus: workOrder.status,
        assetType: workOrder.assetType,
        platform: workOrder.platform,
        businessAssetProjectId: workOrder.businessAssetProjectId,
        blueprintDeliverableId: workOrder.blueprintDeliverableId,
        blueprintDeliverableName: workOrder.blueprintDeliverableName,
        metadata: workOrder.metadata,
      },
      executionRequest: {
        requestId: executionRequest.requestId,
        status: executionRequest.status,
        requestedCapability: executionRequest.requestedCapability,
        workItemRecordId: executionRequest.workItemRecordId,
        workItemId: executionRequest.workItemId,
        projectId: executionRequest.projectId,
        projectCode: executionRequest.projectCode,
        businessAssetProjectId: executionRequest.businessAssetProjectId,
        blueprintDeliverableId: executionRequest.blueprintDeliverableId,
        blueprintDeliverableName: executionRequest.blueprintDeliverableName,
        knowledgeReferenceIds: executionRequest.knowledgeReferenceIds,
        instructions: executionRequest.instructions,
        outputRequirements: executionRequest.outputRequirements,
        correlationMetadata: executionRequest.correlationMetadata,
        createdAt: executionRequest.createdAt,
      },
      requestLifecycle,
      selectedCapabilities: [{
        capabilityId: executionRequest.requestedCapability,
        name: executionRequest.requestedCapability,
        category: 'Execution Request Capability',
      }],
      selectedTools: [],
      selectedProviders: [],
      businessId: workItem.businessId,
      businessCode: workItem.businessCode,
      businessName: workItem.businessName,
      projectId: workItem.projectId,
      projectCode: workItem.projectCode,
      projectName: workItem.projectName,
      departmentId: workItem.departmentId,
      departmentCode: workItem.departmentCode,
      departmentName: workItem.departmentName,
      managerId: workItem.assignedManagerId,
      managerName: workItem.assignedManagerName || 'Unassigned',
      operatorId: workItem.assignedOperatorId,
      operatorCode: workItem.assignedOperatorCode,
      operatorName: workItem.assignedOperatorName || 'Unassigned',
      timing: {
        preparedAt: timestamp,
      },
      estimatedCost: 0,
      actualCost: 0,
      costRecords: [],
      result: undefined,
      resultRef: undefined,
      events: [
        event(`${workOrder.metadata.isRevision === 'true' ? 'Revision ' : ''}Execution Request lifecycle established for ${executionRequest.requestId}. No provider execution started.`, timestamp),
      ],
      transitionHistory: [],
      logs: [],
      retryHistory: [],
      failures: [],
      notes: workItem.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    persist([execution, ...state])
    return execution
  },

  createContentScriptExecution(input: ContentScriptExecutionInput) {
    const existing = state.find((execution) =>
      execution.executionRequest?.requestId === input.requestId ||
      (
        execution.executionRequest?.correlationMetadata.contentProductionJobId === input.jobId &&
        execution.executionRequest?.correlationMetadata.contentProductionAttemptId === input.attemptId
      ),
    )
    if (existing) return existing

    const timestamp = now()
    const executionId = generateExecutionCode(state)
    const internalReferenceId = `content-production:${input.jobId}:${input.attemptId}`
    const execution: ExecutionRecord = {
      id: id('execution'),
      executionId,
      title: `Content script execution for ${input.jobId}`,
      description: `Provider-independent content script execution for ${input.formatId}. The visible content job owns orchestration; Execution Core owns this execution history.`,
      status: 'Prepared',
      sourceType: 'Execution Request',
      priority: 'Medium',
      executionType: 'Future AI',
      riskLevel: 'Low',
      workItem: {
        workItemRecordId: internalReferenceId,
        workItemId: internalReferenceId,
        title: `Automated ${input.formatId} script generation`,
        projectId: '',
        projectCode: '',
        businessId: '',
        businessCode: '',
      },
      executionRequest: {
        requestId: input.requestId,
        status: 'Built',
        requestedCapability: 'Text Generation',
        workItemRecordId: internalReferenceId,
        workItemId: internalReferenceId,
        projectId: '',
        projectCode: '',
        businessAssetProjectId: '',
        blueprintDeliverableId: '',
        blueprintDeliverableName: 'Content Script',
        knowledgeReferenceIds: [],
        instructions: input.instructions,
        outputRequirements: input.outputRequirements,
        correlationMetadata: {
          executionKind: 'Content Script Generation',
          contentProductionJobId: input.jobId,
          contentProductionAttemptId: input.attemptId,
          contentFormatId: input.formatId,
        },
        createdAt: timestamp,
      },
      requestLifecycle: initialExecutionRequestLifecycle(timestamp),
      selectedCapabilities: [{
        capabilityId: 'Text Generation',
        name: 'Text Generation',
        category: 'Execution Request Capability',
      }],
      selectedTools: [],
      selectedProviders: [],
      businessId: '',
      businessCode: '',
      businessName: 'Content Production',
      projectId: '',
      projectCode: '',
      projectName: 'Content Production Job',
      departmentId: '',
      departmentCode: '',
      departmentName: 'Content Production',
      managerName: 'Unassigned',
      operatorName: 'AI Operator OS',
      timing: { preparedAt: timestamp },
      estimatedCost: 0,
      actualCost: 0,
      costRecords: [],
      events: [event(`Content script Execution Request established for ${input.jobId} attempt ${input.attemptId}.`, timestamp)],
      transitionHistory: [],
      logs: [],
      retryHistory: [],
      failures: [],
      notes: 'Automatically created internal execution lineage. No Project, Blueprint, or Work Item record was created.',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    persist([execution, ...state])
    return execution
  },

  createRetryExecution(executionRecordId: string) {
    const failedExecution = state.find((execution) => execution.id === executionRecordId)
    const requestId = failedExecution?.executionRequest?.requestId

    if (!failedExecution || !requestId || failedExecution.requestLifecycle?.status !== 'Failed') {
      return undefined
    }

    const activeRetry = state.find((execution) =>
      execution.id !== failedExecution.id &&
      execution.executionRequest?.requestId === requestId &&
      execution.requestLifecycle?.status !== 'Completed' &&
      execution.requestLifecycle?.status !== 'Failed',
    )
    if (activeRetry) return activeRetry

    const timestamp = now()
    const attemptNumber = state.filter((execution) => execution.executionRequest?.requestId === requestId).length + 1
    const retryExecutionId = generateExecutionCode(state)
    const retryExecution: ExecutionRecord = {
      ...failedExecution,
      id: id('execution'),
      executionId: retryExecutionId,
      title: `${failedExecution.workOrder?.workOrderId ?? failedExecution.executionId} retry ${attemptNumber} lifecycle`,
      description: `Manual retry lifecycle for ${requestId}. Failed execution ${failedExecution.executionId} remains immutable in history.`,
      status: 'Prepared',
      requestLifecycle: initialExecutionRequestLifecycle(timestamp),
      selectedProviders: [],
      timing: {
        preparedAt: timestamp,
      },
      actualCost: 0,
      costRecords: [],
      result: undefined,
      resultRef: undefined,
      events: [
        event(`Retry attempt ${attemptNumber} established from failed execution ${failedExecution.executionId}. No provider execution started.`, timestamp),
      ],
      transitionHistory: [],
      logs: [],
      retryHistory: [],
      failures: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const failedWithRetry = recordRetryForExecution(failedExecution, {
      attemptNumber,
      status: 'Attempted',
      reason: 'CEO manually created a provider retry lifecycle.',
      resultSummary: `Retry lifecycle ${retryExecutionId} created.`,
    })

    persist([retryExecution, ...state.map((execution) =>
      execution.id === failedExecution.id ? failedWithRetry : execution,
    )])
    return retryExecution
  },

  async executeProviderRequest(executionRecordId: string): Promise<ExecutionProviderRunResult | undefined> {
    const initialExecution = state.find((execution) => execution.id === executionRecordId)

    if (!initialExecution?.executionRequest) {
      return undefined
    }

    const request = initialExecution.executionRequest
    const prompt = executionRequestPrompt(initialExecution)
    const startedAt = now()

    if (!prompt) {
      return undefined
    }

    function replaceExecution(nextExecution: ExecutionRecord) {
      persist(state.map((execution) => execution.id === nextExecution.id ? nextExecution : execution))
      return nextExecution
    }

    function latestExecution() {
      return state.find((execution) => execution.id === executionRecordId)
    }

    let working = initialExecution
    const currentLifecycle = working.requestLifecycle?.status ?? 'Pending'

    if (currentLifecycle === 'Completed' || currentLifecycle === 'Failed') {
      return {
        success: false,
        execution: working,
        responseText: '',
        startedAt,
        completedAt: startedAt,
        lifecycleState: currentLifecycle,
        errorMessage: `Execution Request lifecycle is already terminal: ${currentLifecycle}.`,
      }
    }

    if (currentLifecycle === 'Pending') {
      const accepted = transitionExecutionRequestLifecycleRecord(working, {
        toStatus: 'Accepted',
        actor: 'Execution Core',
        reason: 'Execution Request accepted for provider-independent execution.',
        createdAt: startedAt,
      })

      if (!accepted.success) {
        return {
          success: false,
          execution: working,
          responseText: '',
          startedAt,
          completedAt: startedAt,
          lifecycleState: working.requestLifecycle?.status ?? 'Pending',
          errorMessage: accepted.message,
        }
      }

      working = replaceExecution(accepted.execution)
    }

    if ((working.requestLifecycle?.status ?? 'Pending') === 'Accepted') {
      const executing = transitionExecutionRequestLifecycleRecord(working, {
        toStatus: 'Executing',
        actor: 'Execution Core',
        reason: 'Provider-independent execution path started.',
        createdAt: startedAt,
      })

      if (!executing.success) {
        return {
          success: false,
          execution: working,
          responseText: '',
          startedAt,
          completedAt: startedAt,
          lifecycleState: working.requestLifecycle?.status ?? 'Accepted',
          errorMessage: executing.message,
        }
      }

      working = replaceExecution({
        ...executing.execution,
        timing: {
          ...executing.execution.timing,
          startedAt: executing.execution.timing.startedAt ?? startedAt,
        },
      })
    }

    const capabilityRequest = {
      requestId: request.requestId,
      requestedCapability: request.requestedCapability as ProviderCapability,
      requestingEntity: {
        entityType: 'Workflow' as const,
        entityId: request.workItemRecordId,
        displayName: request.blueprintDeliverableName,
      },
      workItemId: request.workItemId,
      executionId: working.executionId,
      requiredInputModalities: ['Text' as const],
      requiredOutputModalities: ['Text' as const],
      localOnly: true,
      cloudAllowed: false,
      fallbackAllowed: false,
      requestedAt: startedAt,
      metadata: {
        workOrderId: working.workOrder?.workOrderId,
        blueprintDeliverableId: request.blueprintDeliverableId,
        projectCode: request.projectCode,
      },
    }

    const routing = capabilityResolver.resolveCapabilityRequest(capabilityRequest)

    const isContentScriptGeneration = request.correlationMetadata.executionKind === 'Content Script Generation'
    const isCreativeConceptDevelopment = request.correlationMetadata.workOrderType === 'Develop Creative Concepts' ||
      request.correlationMetadata.workOrderKind === 'Creative Concept Development'
    const providerResult = routing.status === 'Routed'
      ? await providerManager.executePrompt({
        capabilityRequest,
        prompt,
        systemPrompt: isContentScriptGeneration
          ? 'You are AI Operator OS executing one provider-independent content script request. Return one valid JSON object matching the requested schema. Do not publish, approve, create projects, create work items, or trigger another execution.'
          : isCreativeConceptDevelopment
            ? 'You are AI Operator OS executing one approved local provider request for creative concept development. Return valid JSON only with exactly 4 concept candidates. Do not publish, approve, rank, create blueprints, create work orders, or update final deliverables.'
            : 'You are AI Operator OS executing one approved local provider request. Return only draft content for CEO review. Do not publish, approve, or update final deliverables.',
        temperature: isContentScriptGeneration ? 0 : 0.2,
        maxTokens: isContentScriptGeneration ? 1800 : isCreativeConceptDevelopment ? 900 : request.blueprintDeliverableName === 'Script' ? 1200 : 240,
        structuredResponse: isContentScriptGeneration,
        metadata: providerExecutionMetadata(working),
      })
      : undefined

    const completedAt = providerResult?.completedAt ?? now()
    const latest = latestExecution() ?? working
    const finalLifecycle = providerResult?.success ? 'Completed' : 'Failed'
    const lifecycleTransition = transitionExecutionRequestLifecycleRecord(latest, {
      toStatus: finalLifecycle,
      actor: 'Execution Core',
      reason: providerResult?.success
        ? 'Provider-independent execution path completed with a structured result.'
        : routing.status === 'Routed'
          ? providerResult?.errorMessage ?? 'Provider execution failed.'
          : `Capability routing failed: ${routing.failureCodes.join(', ')}.`,
      createdAt: completedAt,
    })
    const transitioned = lifecycleTransition.success ? lifecycleTransition.execution : latest
    const failureMessage = providerResult?.success
      ? undefined
      : routing.status === 'Routed'
        ? providerResult?.errorMessage ?? 'Provider execution failed.'
        : `Capability routing failed: ${routing.failureCodes.join(', ')}.`
    const executionResult = providerResult
      ? resultFromProviderExecution(transitioned, providerResult)
      : {
        id: id('execution-result'),
        resultId: `EXR-${Date.now()}`,
        executionRecordId: transitioned.id,
        executionId: transitioned.executionId,
        status: 'Recorded' as const,
        summary: failureMessage ?? 'Provider execution failed.',
        success: false,
        failure: true,
        responseText: '',
        startedAt,
        completedAt,
        lifecycleState: 'Failed' as const,
        errorMessage: failureMessage,
        artifactRefs: [],
        recommendedNextAction: 'Review capability routing failures before attempting provider execution again.',
        createdAt: completedAt,
        updatedAt: completedAt,
      }
    const providerReference = providerResult?.provider
      ? {
        providerId: providerResult.provider.providerId,
        name: providerResult.provider.name,
        category: providerResult.provider.runtime,
        model: providerResult.model?.name,
      }
      : undefined
    const resultLog = createExecutionLog({
      sequence: transitioned.logs.length + 1,
      level: executionResult.success ? 'Audit' : 'Error',
      category: executionResult.success ? 'Result' : 'Failure',
      message: executionResult.success
        ? `Provider execution completed using ${executionResult.provider?.name ?? 'selected provider'} / ${executionResult.model?.name ?? 'selected model'}.`
        : `Provider execution failed: ${executionResult.errorMessage}`,
      source: 'Execution Core',
      metadata: {
        provider: executionResult.provider?.name ?? null,
        model: executionResult.model?.name ?? null,
        latencyMs: executionResult.latencyMs ?? null,
        lifecycleState: executionResult.lifecycleState ?? null,
      },
      createdAt: completedAt,
    })
    const failureRecord: FailureRecord | undefined = executionResult.success ? undefined : {
      id: id('execution-failure'),
      failureId: `EXFAIL-${String(transitioned.failures.length + 1).padStart(4, '0')}`,
      severity: 'Moderate',
      message: executionResult.errorMessage ?? 'Provider execution failed.',
      cause: routing.status === 'Routed' ? providerResult?.failures.join(', ') : routing.failureCodes.join(', '),
      createdAt: completedAt,
    }
    const durationMs = Date.parse(completedAt) - Date.parse(startedAt)
    const finalExecution: ExecutionRecord = {
      ...transitioned,
      selectedProviders: providerReference
        ? [providerReference, ...transitioned.selectedProviders.filter((provider) => provider.providerId !== providerReference.providerId)]
        : transitioned.selectedProviders,
      timing: {
        ...transitioned.timing,
        startedAt: transitioned.timing.startedAt ?? startedAt,
        completedAt: executionResult.success ? completedAt : transitioned.timing.completedAt,
        failedAt: executionResult.success ? transitioned.timing.failedAt : completedAt,
        durationMs: Number.isFinite(durationMs) ? Math.max(0, durationMs) : transitioned.timing.durationMs,
      },
      actualCost: executionResult.provider ? transitioned.actualCost : transitioned.actualCost,
      result: executionResult,
      resultRef: executionResult.resultId,
      logs: [resultLog, ...transitioned.logs],
      failures: failureRecord ? [failureRecord, ...transitioned.failures] : transitioned.failures,
      updatedAt: completedAt,
    }

    replaceExecution(finalExecution)

    if (executionResult.success) {
      return {
        success: true,
        execution: finalExecution,
        provider: executionResult.provider?.name ?? 'Selected Provider',
        model: executionResult.model?.name ?? 'Selected Model',
        responseText: executionResult.responseText ?? '',
        latencyMs: executionResult.latencyMs ?? 0,
        startedAt: executionResult.startedAt ?? startedAt,
        completedAt: executionResult.completedAt ?? completedAt,
        lifecycleState: executionResult.lifecycleState ?? 'Completed',
      }
    }

    return {
      success: false,
      execution: finalExecution,
      provider: executionResult.provider?.name,
      model: executionResult.model?.name,
      responseText: '',
      latencyMs: executionResult.latencyMs,
      startedAt: executionResult.startedAt ?? startedAt,
      completedAt: executionResult.completedAt ?? completedAt,
      lifecycleState: executionResult.lifecycleState ?? 'Failed',
      errorMessage: executionResult.errorMessage ?? 'Provider execution failed.',
    }
  },

  transitionExecution(executionRecordId: string, input: ExecutionLifecycleTransitionInput): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      result = transitionExecutionRecord(execution, input)
      return result.success ? result.execution : execution
    })

    if (result?.success) {
      persist(next)
    }

    return result
  },

  pauseExecution(executionRecordId: string, actor?: string, reason?: string): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      result = pauseExecutionRecord(execution, actor, reason)
      return result.success ? result.execution : execution
    })

    if (result?.success) {
      persist(next)
    }

    return result
  },

  resumeExecution(executionRecordId: string, actor?: string, reason?: string): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      result = resumeExecutionRecord(execution, actor, reason)
      return result.success ? result.execution : execution
    })

    if (result?.success) {
      persist(next)
    }

    return result
  },

  recordExecutionFailure(
    executionRecordId: string,
    input: Omit<FailureRecord, 'id' | 'failureId' | 'createdAt'>,
    actor?: string,
  ): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      result = recordFailureForExecution(execution, input, actor)
      return result.success ? result.execution : execution
    })

    if (result?.success) {
      persist(next)
    }

    return result
  },

  recordLifecycleRetry(executionRecordId: string, input: Omit<RetryRecord, 'id' | 'retryId' | 'createdAt' | 'updatedAt'>) {
    persist(state.map((execution) =>
      execution.id === executionRecordId
        ? recordRetryForExecution(execution, input)
        : execution,
    ))
  },

  syncReadinessReferences(executionRecordId: string) {
    let synced: ExecutionRecord | undefined
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      synced = appendEvent(
        applyReadinessReferences(execution),
        'Capability and approval references synchronized.',
        'State Updated',
      )
      return synced
    }))
    return synced
  },

  evaluateReadiness(executionRecordId: string): ExecutionReadinessReport | undefined {
    const execution = state.find((item) => item.id === executionRecordId)
    if (!execution) return undefined
    return evaluateExecutionReadiness(applyReadinessReferences(execution))
  },

  advanceFromCapabilityReview(executionRecordId: string): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const synced = applyReadinessReferences(execution)
      const readiness = evaluateExecutionReadiness(synced)

      if (!readiness.eligibleForAwaitingApproval) {
        result = {
          success: false,
          execution: synced,
          message: readinessMessage(readiness),
          allowedTransitions: ['Awaiting Approval', 'Requires Human Intervention', 'Cancelled'],
        }
        return synced
      }

      result = transitionExecutionRecord(synced, {
        toStatus: 'Awaiting Approval',
        actor: 'Execution Readiness Gate',
        reason: 'Capability Plan is approved and requirements are satisfied.',
      })
      return result.success ? result.execution : synced
    })

    persist(next)
    return result
  },

  advanceFromApprovalReview(executionRecordId: string): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const synced = applyReadinessReferences(execution)
      const readiness = evaluateExecutionReadiness(synced)

      if (!readiness.eligibleForApproved) {
        result = {
          success: false,
          execution: synced,
          message: readinessMessage(readiness),
          allowedTransitions: ['Approved', 'Requires Human Intervention', 'Cancelled'],
        }
        return synced
      }

      result = transitionExecutionRecord(synced, {
        toStatus: 'Approved',
        actor: 'Execution Approval Gate',
        reason: 'Linked Approval Queue record is approved.',
      })
      return result.success ? result.execution : synced
    })

    persist(next)
    return result
  },

  markReadyWhenEligible(executionRecordId: string): ExecutionLifecycleTransitionResult | undefined {
    let result: ExecutionLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const synced = applyReadinessReferences(execution)
      const readiness = evaluateExecutionReadiness(synced)

      if (!readiness.eligibleForReady) {
        result = {
          success: false,
          execution: synced,
          message: readinessMessage(readiness),
          allowedTransitions: ['Ready', 'Cancelled'],
        }
        return synced
      }

      result = transitionExecutionRecord(synced, {
        toStatus: 'Ready',
        actor: 'Execution Readiness Gate',
        reason: 'Capability and approval requirements are satisfied. Execution is ready but not running.',
      })
      return result.success ? result.execution : synced
    })

    persist(next)
    return result
  },

  updateExecution(executionRecordId: string, updates: ExecutionUpdate) {
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      return appendEvent(
        {
          ...execution,
          ...updates,
          title: updates.title?.trim() || execution.title,
          description: updates.description?.trim() || execution.description,
          estimatedCost: updates.estimatedCost === undefined ? execution.estimatedCost : normalizeMoney(updates.estimatedCost),
          actualCost: updates.actualCost === undefined ? execution.actualCost : normalizeMoney(updates.actualCost),
          notes: updates.notes ?? execution.notes,
        },
        'Execution record updated.',
      )
    }))
  },

  addExecutionLog(
    executionRecordId: string,
    input: Omit<ExecutionLog, 'id' | 'logId' | 'createdAt' | 'category'> & { category?: ExecutionLogCategory },
  ) {
    const timestamp = now()
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const log = createExecutionLog({
        sequence: execution.logs.length + 1,
        level: input.level,
        category: input.category,
        message: input.message,
        source: input.source,
        metadata: input.metadata,
        createdAt: timestamp,
      })
      return appendEvent(
        {
          ...execution,
          logs: [log, ...execution.logs],
        },
        'Execution log recorded.',
        'Log Recorded',
      )
    }))
  },

  addRetryRecord(executionRecordId: string, input: Omit<RetryRecord, 'id' | 'retryId' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now()
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const retryRecord: RetryRecord = {
        id: id('execution-retry'),
        retryId: `EXRETRY-${String(execution.retryHistory.length + 1).padStart(4, '0')}`,
        attemptNumber: input.attemptNumber,
        status: input.status,
        reason: input.reason,
        resultSummary: input.resultSummary,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      const auditLog = createExecutionLog({
        sequence: execution.logs.length + 1,
        level: retryRecord.status === 'Failed' ? 'Warning' : 'Audit',
        category: 'Retry',
        message: `Retry ${retryRecord.retryId} recorded as ${retryRecord.status}: ${retryRecord.reason}`,
        source: 'Execution Store',
        metadata: {
          retryId: retryRecord.retryId,
          attemptNumber: retryRecord.attemptNumber,
          status: retryRecord.status,
        },
        createdAt: timestamp,
      })
      return appendEvent(
        {
          ...execution,
          retryHistory: [retryRecord, ...execution.retryHistory],
          logs: [auditLog, ...execution.logs],
        },
        'Retry history recorded.',
        'Retry Recorded',
      )
    }))
  },

  addFailureRecord(executionRecordId: string, input: Omit<FailureRecord, 'id' | 'failureId' | 'createdAt'>) {
    const timestamp = now()
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const failureRecord: FailureRecord = {
        id: id('execution-failure'),
        failureId: `EXFAIL-${String(execution.failures.length + 1).padStart(4, '0')}`,
        severity: input.severity,
        message: input.message,
        cause: input.cause,
        resolutionNotes: input.resolutionNotes,
        createdAt: timestamp,
        resolvedAt: input.resolvedAt,
      }
      const auditLog = createExecutionLog({
        sequence: execution.logs.length + 1,
        level: failureRecord.severity === 'Critical' ? 'Error' : 'Warning',
        category: 'Failure',
        message: `Failure ${failureRecord.failureId} recorded: ${failureRecord.message}`,
        source: 'Execution Store',
        metadata: {
          failureId: failureRecord.failureId,
          severity: failureRecord.severity,
          resolved: Boolean(failureRecord.resolvedAt),
        },
        createdAt: timestamp,
      })
      return appendEvent(
        {
          ...execution,
          failures: [failureRecord, ...execution.failures],
          logs: [auditLog, ...execution.logs],
        },
        'Failure record added.',
        'Failure Recorded',
      )
    }))
  },

  addCostRecord(
    executionRecordId: string,
    input: Omit<CostRecord, 'id' | 'costRecordId' | 'executionRecordId' | 'executionId' | 'createdAt' | 'category' | 'status' | 'recordedBy'> & Pick<Partial<CostRecord>, 'category' | 'status' | 'recordedBy'>,
  ) {
    const timestamp = now()
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const costRecord = createCostRecord({
        execution,
        sequence: execution.costRecords.length + 1,
        kind: input.kind,
        amount: normalizeMoney(input.amount),
        currency: input.currency || 'USD',
        businessId: input.businessId,
        projectId: input.projectId,
        providerId: input.providerId,
        toolId: input.toolId,
        approvalId: input.approvalId,
        category: input.category,
        status: input.status,
        notes: input.notes,
        recordedBy: input.recordedBy,
        createdAt: timestamp,
      })
      const auditLog = createExecutionLog({
        sequence: execution.logs.length + 1,
        level: 'Audit',
        category: 'Cost',
        message: summarizeCostRecord(costRecord),
        source: 'Execution Store',
        metadata: {
          costRecordId: costRecord.costRecordId,
          kind: costRecord.kind,
          category: costRecord.category,
          status: costRecord.status,
          amount: costRecord.amount,
          currency: costRecord.currency,
        },
        createdAt: timestamp,
      })
      return appendEvent(
        {
          ...execution,
          estimatedCost: input.kind === 'Estimated' ? normalizeMoney(input.amount) : execution.estimatedCost,
          actualCost: input.kind === 'Actual' ? normalizeMoney(input.amount) : execution.actualCost,
          costRecords: [costRecord, ...execution.costRecords],
          logs: [auditLog, ...execution.logs],
        },
        'Execution cost record added.',
        'Cost Recorded',
      )
    }))
  },

  attachResult(executionRecordId: string, input: Omit<ExecutionResult, 'id' | 'resultId' | 'executionRecordId' | 'executionId' | 'createdAt' | 'updatedAt'>) {
    const timestamp = now()
    persist(state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      const result: ExecutionResult = {
        id: id('execution-result'),
        resultId: `EXR-${String(state.length + 1).padStart(4, '0')}`,
        executionRecordId: execution.id,
        executionId: execution.executionId,
        status: input.status,
        summary: input.summary,
        artifactRefs: input.artifactRefs,
        recommendedNextAction: input.recommendedNextAction,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      return appendEvent(
        {
          ...execution,
          result,
          resultRef: result.resultId,
        },
        'Execution result referenced.',
        'Result Referenced',
      )
    }))
  },

  getExecutions() {
    return state
  },

  getExecution(executionRecordId: string) {
    return state.find((execution) => execution.id === executionRecordId)
  },

  getExecutionsForQueueItem(queueRecordId: string) {
    return state.filter((execution) => execution.queueItem?.queueRecordId === queueRecordId)
  },

  getExecutionForQueueItem(queueRecordId: string) {
    return state.find((execution) => execution.queueItem?.queueRecordId === queueRecordId)
  },

  getExecutionForExecutionRequest(requestId: string) {
    return state.find((execution) => execution.executionRequest?.requestId === requestId)
  },

  getExecutionsForWorkOrder(workOrderId: string) {
    return state.filter((execution) => execution.workOrder?.workOrderId === workOrderId)
  },

  getExecutionsForWorkItem(workItemRecordId: string) {
    return state.filter((execution) => execution.workItem.workItemRecordId === workItemRecordId)
  },

  transitionExecutionRequestLifecycle(
    executionRecordId: string,
    input: ExecutionRequestLifecycleTransitionInput,
  ): ExecutionRequestLifecycleTransitionResult | undefined {
    let result: ExecutionRequestLifecycleTransitionResult | undefined

    const next = state.map((execution) => {
      if (execution.id !== executionRecordId) return execution
      result = transitionExecutionRequestLifecycleRecord(execution, input)
      return result.success ? result.execution : execution
    })

    if (result?.success) {
      persist(next)
    }

    return result
  },

  validateExecutionAudit(executionRecordId: string) {
    const execution = state.find((item) => item.id === executionRecordId)
    return execution ? validateExecutionAudit(execution) : undefined
  },
}

export function useExecutionStore() {
  const executions = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    executions,
    createExecution: executionStore.createExecution,
    createExecutionFromQueueItem: executionStore.createExecutionFromQueueItem,
    createExecutionFromWorkOrder: executionStore.createExecutionFromWorkOrder,
    createContentScriptExecution: executionStore.createContentScriptExecution,
    createRetryExecution: executionStore.createRetryExecution,
    executeProviderRequest: executionStore.executeProviderRequest,
    transitionExecution: executionStore.transitionExecution,
    transitionExecutionRequestLifecycle: executionStore.transitionExecutionRequestLifecycle,
    pauseExecution: executionStore.pauseExecution,
    resumeExecution: executionStore.resumeExecution,
    recordExecutionFailure: executionStore.recordExecutionFailure,
    recordLifecycleRetry: executionStore.recordLifecycleRetry,
    syncReadinessReferences: executionStore.syncReadinessReferences,
    evaluateReadiness: executionStore.evaluateReadiness,
    advanceFromCapabilityReview: executionStore.advanceFromCapabilityReview,
    advanceFromApprovalReview: executionStore.advanceFromApprovalReview,
    markReadyWhenEligible: executionStore.markReadyWhenEligible,
    updateExecution: executionStore.updateExecution,
    addExecutionLog: executionStore.addExecutionLog,
    addRetryRecord: executionStore.addRetryRecord,
    addFailureRecord: executionStore.addFailureRecord,
    addCostRecord: executionStore.addCostRecord,
    attachResult: executionStore.attachResult,
    getExecutionForQueueItem: executionStore.getExecutionForQueueItem,
    getExecutionsForQueueItem: executionStore.getExecutionsForQueueItem,
    getExecutionForExecutionRequest: executionStore.getExecutionForExecutionRequest,
    getExecutionsForWorkOrder: executionStore.getExecutionsForWorkOrder,
    getExecutionsForWorkItem: executionStore.getExecutionsForWorkItem,
    validateExecutionAudit: executionStore.validateExecutionAudit,
  }
}

export const executionStatuses: ExecutionStatus[] = [
  'Prepared',
  'Awaiting Capability Review',
  'Awaiting Approval',
  'Approved',
  'Ready',
  'Running',
  'Paused',
  'Completed',
  'Failed',
  'Cancelled',
  'Requires Human Intervention',
]

export const executionTypes: ExecutionType[] = ['Manual', 'Draft', 'Review', 'Future AI', 'Future Automation']

export const executionRiskLevels: ExecutionRiskLevel[] = ['Low', 'Medium', 'High', 'Critical']

export const executionLogLevels: ExecutionLogLevel[] = ['Info', 'Warning', 'Error', 'Audit']

export const retryStatuses: RetryStatus[] = ['Planned', 'Attempted', 'Succeeded', 'Failed', 'Cancelled']

export const failureSeverities: FailureSeverity[] = ['Minor', 'Moderate', 'Major', 'Critical']
