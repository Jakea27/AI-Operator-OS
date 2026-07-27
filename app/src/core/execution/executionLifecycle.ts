import {
  ExecutionLifecycleTransitionInput,
  ExecutionLifecycleTransitionResult,
  ExecutionRecord,
  ExecutionRequestLifecycle,
  ExecutionRequestLifecycleHistoryItem,
  ExecutionRequestLifecycleStatus,
  ExecutionRequestLifecycleTransitionInput,
  ExecutionRequestLifecycleTransitionResult,
  ExecutionStatus,
  ExecutionTiming,
  ExecutionTransitionHistoryItem,
  FailureRecord,
  RetryRecord,
} from './executionTypes'

export const executionAllowedTransitions: Record<ExecutionStatus, ExecutionStatus[]> = {
  Prepared: ['Awaiting Capability Review', 'Cancelled'],
  'Awaiting Capability Review': ['Awaiting Approval', 'Requires Human Intervention', 'Cancelled'],
  'Awaiting Approval': ['Approved', 'Requires Human Intervention', 'Cancelled'],
  Approved: ['Ready', 'Cancelled'],
  Ready: ['Running', 'Requires Human Intervention', 'Cancelled'],
  Running: ['Paused', 'Completed', 'Failed', 'Requires Human Intervention', 'Cancelled'],
  Paused: ['Running', 'Requires Human Intervention', 'Cancelled'],
  Completed: [],
  Failed: ['Requires Human Intervention', 'Ready', 'Cancelled'],
  Cancelled: [],
  'Requires Human Intervention': ['Awaiting Capability Review', 'Awaiting Approval', 'Ready', 'Cancelled'],
}

export const executionRequestLifecycleAllowedTransitions: Record<ExecutionRequestLifecycleStatus, ExecutionRequestLifecycleStatus[]> = {
  Pending: ['Accepted'],
  Accepted: ['Executing', 'Failed'],
  Executing: ['Completed', 'Failed'],
  Completed: [],
  Failed: [],
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function durationFromStart(timing: ExecutionTiming, completedAt: string) {
  if (!timing.startedAt) return timing.durationMs
  const started = Date.parse(timing.startedAt)
  const completed = Date.parse(completedAt)
  if (!Number.isFinite(started) || !Number.isFinite(completed)) return timing.durationMs
  return Math.max(0, completed - started)
}

function timingForTransition(execution: ExecutionRecord, toStatus: ExecutionStatus, createdAt: string): ExecutionTiming {
  const base = execution.timing

  switch (toStatus) {
    case 'Prepared':
      return { ...base, preparedAt: base.preparedAt ?? createdAt }
    case 'Ready':
      return { ...base, readyAt: createdAt }
    case 'Running':
      return { ...base, startedAt: base.startedAt ?? createdAt }
    case 'Paused':
      return { ...base, pausedAt: createdAt }
    case 'Completed':
      return { ...base, completedAt: createdAt, durationMs: durationFromStart(base, createdAt) }
    case 'Failed':
      return { ...base, failedAt: createdAt, durationMs: durationFromStart(base, createdAt) }
    case 'Cancelled':
      return { ...base, cancelledAt: createdAt }
    default:
      return base
  }
}

function requestLifecycleTiming(
  lifecycle: ExecutionRequestLifecycle,
  toStatus: ExecutionRequestLifecycleStatus,
  createdAt: string,
): ExecutionRequestLifecycle {
  switch (toStatus) {
    case 'Accepted':
      return { ...lifecycle, acceptedAt: lifecycle.acceptedAt ?? createdAt }
    case 'Executing':
      return { ...lifecycle, executingAt: lifecycle.executingAt ?? createdAt }
    case 'Completed':
      return { ...lifecycle, completedAt: createdAt }
    case 'Failed':
      return { ...lifecycle, failedAt: createdAt }
    default:
      return lifecycle
  }
}

export function getAllowedExecutionTransitions(status: ExecutionStatus) {
  return executionAllowedTransitions[status]
}

export function canTransitionExecution(fromStatus: ExecutionStatus, toStatus: ExecutionStatus) {
  return executionAllowedTransitions[fromStatus].includes(toStatus)
}

export function assertCanTransitionExecution(fromStatus: ExecutionStatus, toStatus: ExecutionStatus) {
  if (!canTransitionExecution(fromStatus, toStatus)) {
    throw new Error(`Invalid execution transition: ${fromStatus} -> ${toStatus}`)
  }
}

export function getAllowedExecutionRequestLifecycleTransitions(status: ExecutionRequestLifecycleStatus) {
  return executionRequestLifecycleAllowedTransitions[status]
}

export function canTransitionExecutionRequestLifecycle(
  fromStatus: ExecutionRequestLifecycleStatus,
  toStatus: ExecutionRequestLifecycleStatus,
) {
  return executionRequestLifecycleAllowedTransitions[fromStatus].includes(toStatus)
}

export function initialExecutionRequestLifecycle(createdAt = now()): ExecutionRequestLifecycle {
  return {
    status: 'Pending',
    history: [{
      id: id('execution-request-lifecycle'),
      toStatus: 'Pending',
      actor: 'Execution Core',
      reason: 'Execution Request lifecycle established. No provider execution started.',
      valid: true,
      createdAt,
    }],
  }
}

export function transitionExecutionRecord(
  execution: ExecutionRecord,
  input: ExecutionLifecycleTransitionInput,
): ExecutionLifecycleTransitionResult {
  const actor = input.actor?.trim() || 'System'
  const reason = input.reason?.trim() || `Transition requested from ${execution.status} to ${input.toStatus}.`
  const createdAt = input.createdAt ?? now()
  const allowedTransitions = getAllowedExecutionTransitions(execution.status)
  const valid = canTransitionExecution(execution.status, input.toStatus)

  if (!valid) {
    return {
      success: false,
      execution,
      message: `Invalid execution transition: ${execution.status} -> ${input.toStatus}.`,
      allowedTransitions,
    }
  }

  const transitionHistoryItem: ExecutionTransitionHistoryItem = {
    id: id('execution-transition'),
    fromStatus: execution.status,
    toStatus: input.toStatus,
    actor,
    reason,
    valid,
    createdAt,
  }

  const nextExecution: ExecutionRecord = {
    ...execution,
    status: input.toStatus,
    timing: timingForTransition(execution, input.toStatus, createdAt),
    transitionHistory: [transitionHistoryItem, ...execution.transitionHistory],
    events: [
      {
        id: id('execution-event'),
        eventType: 'Lifecycle Transition',
        message: `${execution.status} -> ${input.toStatus}: ${reason}`,
        source: 'Execution Lifecycle Engine',
        metadata: {
          fromStatus: execution.status,
          toStatus: input.toStatus,
          actor,
        },
        createdAt,
      },
      ...execution.events,
    ],
    updatedAt: createdAt,
  }

  return {
    success: true,
    execution: nextExecution,
    message: `Execution transitioned from ${execution.status} to ${input.toStatus}.`,
  }
}

export function transitionExecutionRequestLifecycleRecord(
  execution: ExecutionRecord,
  input: ExecutionRequestLifecycleTransitionInput,
): ExecutionRequestLifecycleTransitionResult {
  const lifecycle = execution.requestLifecycle ?? initialExecutionRequestLifecycle(execution.createdAt)
  const actor = input.actor?.trim() || 'Execution Core'
  const reason = input.reason?.trim() || `Execution Request lifecycle transition requested from ${lifecycle.status} to ${input.toStatus}.`
  const createdAt = input.createdAt ?? now()
  const allowedTransitions = getAllowedExecutionRequestLifecycleTransitions(lifecycle.status)
  const valid = canTransitionExecutionRequestLifecycle(lifecycle.status, input.toStatus)

  if (!valid) {
    return {
      success: false,
      execution,
      message: `Invalid Execution Request lifecycle transition: ${lifecycle.status} -> ${input.toStatus}.`,
      allowedTransitions,
    }
  }

  const historyItem: ExecutionRequestLifecycleHistoryItem = {
    id: id('execution-request-lifecycle'),
    fromStatus: lifecycle.status,
    toStatus: input.toStatus,
    actor,
    reason,
    valid,
    createdAt,
  }

  const nextLifecycle = requestLifecycleTiming(
    {
      ...lifecycle,
      status: input.toStatus,
      history: [historyItem, ...lifecycle.history],
    },
    input.toStatus,
    createdAt,
  )

  const nextExecution: ExecutionRecord = {
    ...execution,
    requestLifecycle: nextLifecycle,
    events: [
      {
        id: id('execution-event'),
        eventType: 'Lifecycle Transition',
        message: `Execution Request lifecycle ${lifecycle.status} -> ${input.toStatus}: ${reason}`,
        source: 'Execution Core',
        metadata: {
          fromStatus: lifecycle.status,
          toStatus: input.toStatus,
          actor,
          executionRequestId: execution.executionRequest?.requestId ?? null,
        },
        createdAt,
      },
      ...execution.events,
    ],
    updatedAt: createdAt,
  }

  return {
    success: true,
    execution: nextExecution,
    message: `Execution Request lifecycle transitioned from ${lifecycle.status} to ${input.toStatus}.`,
  }
}

export function pauseExecutionRecord(execution: ExecutionRecord, actor = 'System', reason = 'Execution paused.') {
  return transitionExecutionRecord(execution, {
    toStatus: 'Paused',
    actor,
    reason,
  })
}

export function resumeExecutionRecord(execution: ExecutionRecord, actor = 'System', reason = 'Execution resumed.') {
  return transitionExecutionRecord(execution, {
    toStatus: 'Running',
    actor,
    reason,
  })
}

export function markExecutionRequiresHumanIntervention(
  execution: ExecutionRecord,
  actor = 'System',
  reason = 'Execution requires human intervention.',
) {
  return transitionExecutionRecord(execution, {
    toStatus: 'Requires Human Intervention',
    actor,
    reason,
  })
}

export function recordFailureForExecution(
  execution: ExecutionRecord,
  failure: Omit<FailureRecord, 'id' | 'failureId' | 'createdAt'>,
  actor = 'System',
) {
  const createdAt = now()
  const transition = transitionExecutionRecord(execution, {
    toStatus: 'Failed',
    actor,
    reason: failure.message,
    createdAt,
  })

  if (!transition.success) return transition

  const failureRecord: FailureRecord = {
    id: id('execution-failure'),
    failureId: `EXFAIL-${String(transition.execution.failures.length + 1).padStart(4, '0')}`,
    severity: failure.severity,
    message: failure.message,
    cause: failure.cause,
    resolutionNotes: failure.resolutionNotes,
    createdAt,
    resolvedAt: failure.resolvedAt,
  }

  return {
    ...transition,
    execution: {
      ...transition.execution,
      failures: [failureRecord, ...transition.execution.failures],
    },
  }
}

export function recordRetryForExecution(
  execution: ExecutionRecord,
  retry: Omit<RetryRecord, 'id' | 'retryId' | 'createdAt' | 'updatedAt'>,
) {
  const createdAt = now()
  const retryRecord: RetryRecord = {
    id: id('execution-retry'),
    retryId: `EXRETRY-${String(execution.retryHistory.length + 1).padStart(4, '0')}`,
    attemptNumber: retry.attemptNumber,
    status: retry.status,
    reason: retry.reason,
    resultSummary: retry.resultSummary,
    createdAt,
    updatedAt: createdAt,
  }

  return {
    ...execution,
    retryHistory: [retryRecord, ...execution.retryHistory],
    events: [
      {
        id: id('execution-event'),
        eventType: 'Retry Recorded' as const,
        message: `Retry ${retry.attemptNumber} recorded: ${retry.reason}`,
        source: 'Execution Lifecycle Engine',
        createdAt,
      },
      ...execution.events,
    ],
    updatedAt: createdAt,
  }
}
