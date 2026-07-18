import type {
  CostRecord,
  ExecutionCostCategory,
  ExecutionCostStatus,
  ExecutionEvent,
  ExecutionEventType,
  ExecutionLog,
  ExecutionLogCategory,
  ExecutionLogLevel,
  ExecutionRecord,
  ISODateTimeString,
} from './executionTypes'

type MetadataValue = string | number | boolean | null
type AuditMetadata = Record<string, MetadataValue>

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeMoney(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric * 100) / 100)
}

export function normalizeCurrency(value?: string) {
  const currency = value?.trim().toUpperCase()
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : 'USD'
}

export function compactMetadata(metadata?: AuditMetadata) {
  if (!metadata) return undefined

  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== '')
  if (entries.length === 0) return undefined

  return Object.fromEntries(entries) as AuditMetadata
}

export function createExecutionEvent(input: {
  eventType: ExecutionEventType
  message: string
  source?: string
  metadata?: AuditMetadata
  createdAt: ISODateTimeString
}): ExecutionEvent {
  return {
    id: id('execution-event'),
    eventType: input.eventType,
    message: input.message.trim() || 'Execution event recorded.',
    source: input.source?.trim() || 'Execution Store',
    metadata: compactMetadata(input.metadata),
    createdAt: input.createdAt,
  }
}

export function createExecutionLog(input: {
  sequence: number
  level: ExecutionLogLevel
  category?: ExecutionLogCategory
  message: string
  source?: string
  metadata?: AuditMetadata
  createdAt: ISODateTimeString
}): ExecutionLog {
  return {
    id: id('execution-log'),
    logId: `EXLOG-${String(input.sequence).padStart(4, '0')}`,
    level: input.level,
    category: input.category ?? 'System',
    message: input.message.trim() || 'Execution log recorded.',
    source: input.source?.trim() || 'Execution Store',
    metadata: compactMetadata(input.metadata),
    createdAt: input.createdAt,
  }
}

export function createCostRecord(input: {
  execution: ExecutionRecord
  sequence: number
  kind: CostRecord['kind']
  category?: ExecutionCostCategory
  status?: ExecutionCostStatus
  amount: number
  currency?: string
  businessId?: string
  projectId?: string
  providerId?: string
  toolId?: string
  approvalId?: string
  notes?: string
  recordedBy?: string
  createdAt: ISODateTimeString
}): CostRecord {
  return {
    id: id('execution-cost'),
    costRecordId: `EXCOST-${String(input.sequence).padStart(4, '0')}`,
    executionRecordId: input.execution.id,
    executionId: input.execution.executionId,
    kind: input.kind,
    category: input.category ?? 'Other',
    status: input.status ?? 'Recorded',
    amount: normalizeMoney(input.amount),
    currency: normalizeCurrency(input.currency),
    businessId: input.businessId || input.execution.businessId,
    projectId: input.projectId || input.execution.projectId,
    providerId: input.providerId,
    toolId: input.toolId,
    approvalId: input.approvalId || input.execution.approval?.approvalId,
    notes: input.notes?.trim() || 'Execution cost recorded.',
    recordedBy: input.recordedBy?.trim() || 'Execution Core',
    createdAt: input.createdAt,
  }
}

export function summarizeCostRecord(record: CostRecord) {
  return `${record.kind} ${record.category.toLowerCase()} cost ${record.costRecordId}: ${record.currency} ${record.amount.toFixed(2)} (${record.status}).`
}

export function costDelta(execution: ExecutionRecord) {
  return Math.round((normalizeMoney(execution.actualCost) - normalizeMoney(execution.estimatedCost)) * 100) / 100
}

export function auditCompleteness(execution: ExecutionRecord) {
  const hasCost = execution.costRecords.length > 0 || execution.estimatedCost > 0 || execution.actualCost > 0
  const hasLogs = execution.logs.length > 0
  const hasEvents = execution.events.length > 0

  if (hasCost && hasLogs && hasEvents) return 'Complete'
  if (hasLogs || hasEvents || hasCost) return 'Partial'
  return 'Needs Records'
}

export function validateExecutionAudit(execution: ExecutionRecord) {
  const warnings: string[] = []

  if (!execution.events.length) warnings.push('No execution events recorded.')
  if (execution.actualCost > 0 && !execution.costRecords.some((record) => record.kind === 'Actual')) {
    warnings.push('Actual cost exists without an actual cost record.')
  }
  if (execution.estimatedCost > 0 && !execution.costRecords.some((record) => record.kind === 'Estimated')) {
    warnings.push('Estimated cost exists without an estimated cost record.')
  }
  if (execution.failures.length > 0 && !execution.logs.some((log) => log.category === 'Failure')) {
    warnings.push('Failure history exists without a matching failure audit log.')
  }
  if (execution.retryHistory.length > 0 && !execution.logs.some((log) => log.category === 'Retry')) {
    warnings.push('Retry history exists without a matching retry audit log.')
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}
