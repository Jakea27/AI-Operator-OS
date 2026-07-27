import { useSyncExternalStore } from 'react'
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
  ExecutionEvent,
  ExecutionInput,
  ExecutionLifecycleTransitionInput,
  ExecutionLifecycleTransitionResult,
  ExecutionLog,
  ExecutionLogCategory,
  ExecutionLogLevel,
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
        event(`Execution Request lifecycle established for ${executionRequest.requestId}. No provider execution started.`, timestamp),
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
