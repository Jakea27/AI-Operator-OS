import type { ExecutionRecord, ExecutionRequestLifecycleStatus, ExecutionStatus } from '../execution'
import type { ExecutionQueueRecord } from '../executionQueue'
import type { ProjectRecord } from '../projects'
import type { WorkItemRecord } from '../workItems'
import type { Approval, ApprovalPriority } from '../../features/approval/types/approvalTypes'
import type { BusinessPriority, BusinessRecord, BusinessStatus } from './businessTypes'

export type BusinessAttentionSignalType =
  | 'Pending CEO Approval'
  | 'Execution Requires Human Intervention'
  | 'Current Execution Failure'
  | 'Blocked Work Item'

export type BusinessAttentionSourceType = 'Approval' | 'Execution' | 'Work Item'

export type BusinessAttentionPriority = BusinessPriority | 'Unspecified'

export type BusinessAttentionOwnershipState = 'Resolved' | 'Unidentified' | 'Conflict'

export type BusinessAttentionNavigationTarget = {
  route: string
  label: string
  recordId: string
  readableId?: string
}

export type BusinessAttentionRelatedReferences = {
  businessRecordId?: string
  businessId?: string
  projectRecordId?: string
  projectId?: string
  workItemRecordId?: string
  workItemId?: string
  queueRecordId?: string
  queueId?: string
  executionRecordId?: string
  executionId?: string
  executionRequestId?: string
  approvalId?: string
}

export type BusinessAttentionOwnershipResult =
  | {
      state: 'Resolved'
      businessRecordId: string
      businessId: string
      businessName: string
      businessStatus: BusinessStatus
      missingReferences: string[]
    }
  | {
      state: 'Unidentified'
      missingReferences: string[]
      warning: string
    }
  | {
      state: 'Conflict'
      candidateBusinessRecordIds: string[]
      candidateBusinessIds: string[]
      missingReferences: string[]
      warning: string
    }

export type BusinessAttentionItem = {
  attentionId: string
  signalType: BusinessAttentionSignalType
  sourceType: BusinessAttentionSourceType
  sourceRecordId: string
  sourceReadableId?: string
  title: string
  reason: string
  priority: BusinessAttentionPriority
  hasValidPriority: boolean
  sourceCreatedAt?: string
  hasValidSourceCreatedAt: boolean
  ownership: BusinessAttentionOwnershipResult
  resolvedBusinessRecordId?: string
  resolvedBusinessId?: string
  resolvedBusinessName?: string
  resolvedBusinessStatus?: BusinessStatus
  navigationTarget: BusinessAttentionNavigationTarget
  relatedReferences: BusinessAttentionRelatedReferences
  ownershipWarning?: string
  stateConsistencyWarning?: string
}

export type BusinessAttentionSummary = {
  businessRecordId: string
  businessId: string
  businessName: string
  businessStatus: BusinessStatus
  attentionItemCount: number
  contributingSourceRecordCount: number
  items: BusinessAttentionItem[]
  countsBySignalType: Record<BusinessAttentionSignalType, number>
  countsByPriority: Record<BusinessAttentionPriority, number>
}

export type BusinessAttentionReviewGroups = {
  unidentifiedOwnership: BusinessAttentionItem[]
  conflictingOwnership: BusinessAttentionItem[]
  unspecifiedPriority: BusinessAttentionItem[]
}

export type BusinessAttentionResult = {
  portfolioItems: BusinessAttentionItem[]
  businessSummaries: BusinessAttentionSummary[]
  reviewGroups: BusinessAttentionReviewGroups
  attentionItemCount: number
  contributingSourceRecordCount: number
}

export type BuildBusinessAttentionInput = {
  businesses: BusinessRecord[]
  projects: ProjectRecord[]
  workItems: WorkItemRecord[]
  executionQueueItems?: ExecutionQueueRecord[]
  executions: ExecutionRecord[]
  approvals: Approval[]
}

const signalOrder: Record<BusinessAttentionSignalType, number> = {
  'Execution Requires Human Intervention': 0,
  'Current Execution Failure': 1,
  'Blocked Work Item': 2,
  'Pending CEO Approval': 3,
}

const priorityOrder: Record<BusinessPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

const emptySignalCounts = (): Record<BusinessAttentionSignalType, number> => ({
  'Pending CEO Approval': 0,
  'Execution Requires Human Intervention': 0,
  'Current Execution Failure': 0,
  'Blocked Work Item': 0,
})

const emptyPriorityCounts = (): Record<BusinessAttentionPriority, number> => ({
  Critical: 0,
  High: 0,
  Medium: 0,
  Low: 0,
  Unspecified: 0,
})

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp)
}

function normalizePriority(value: unknown): { priority: BusinessAttentionPriority; hasValidPriority: boolean } {
  if (value === 'Critical' || value === 'High' || value === 'Medium' || value === 'Low') {
    return { priority: value, hasValidPriority: true }
  }

  return { priority: 'Unspecified', hasValidPriority: false }
}

function readableFallback(recordId: string, readableId?: string) {
  return readableId || recordId
}

type BusinessLookup = {
  byRecordId: Map<string, BusinessRecord>
  byBusinessId: Map<string, BusinessRecord>
}

type SourceLookup = {
  businesses: BusinessLookup
  projects: Map<string, ProjectRecord>
  workItems: Map<string, WorkItemRecord>
  queueItems: Map<string, ExecutionQueueRecord>
  executions: Map<string, ExecutionRecord>
}

function buildSourceLookup(input: BuildBusinessAttentionInput): SourceLookup {
  const businessByRecordId = new Map<string, BusinessRecord>()
  const businessByBusinessId = new Map<string, BusinessRecord>()
  const projects = new Map<string, ProjectRecord>()
  const workItems = new Map<string, WorkItemRecord>()
  const queueItems = new Map<string, ExecutionQueueRecord>()
  const executions = new Map<string, ExecutionRecord>()

  for (const business of input.businesses) {
    if (business.id) businessByRecordId.set(business.id, business)
    if (business.businessId) businessByBusinessId.set(business.businessId, business)
  }

  for (const project of input.projects) {
    if (project.id) projects.set(project.id, project)
    if (project.projectId) projects.set(project.projectId, project)
  }

  for (const workItem of input.workItems) {
    if (workItem.id) workItems.set(workItem.id, workItem)
    if (workItem.workItemId) workItems.set(workItem.workItemId, workItem)
  }

  for (const queueItem of input.executionQueueItems ?? []) {
    if (queueItem.id) queueItems.set(queueItem.id, queueItem)
    if (queueItem.queueId) queueItems.set(queueItem.queueId, queueItem)
  }

  for (const execution of input.executions) {
    if (execution.id) executions.set(execution.id, execution)
    if (execution.executionId) executions.set(execution.executionId, execution)
  }

  return {
    businesses: {
      byRecordId: businessByRecordId,
      byBusinessId: businessByBusinessId,
    },
    projects,
    workItems,
    queueItems,
    executions,
  }
}

type OwnershipCollector = {
  candidates: Map<string, BusinessRecord>
  missingReferences: string[]
}

function collectBusinessReference(collector: OwnershipCollector, lookup: SourceLookup, value: unknown, sourceLabel: string) {
  const reference = normalizeText(value)
  if (!reference) return

  const byRecordId = lookup.businesses.byRecordId.get(reference)
  const byBusinessId = lookup.businesses.byBusinessId.get(reference)

  if (!byRecordId && !byBusinessId) {
    collector.missingReferences.push(`${sourceLabel}: ${reference}`)
    return
  }

  if (byRecordId) collector.candidates.set(byRecordId.id, byRecordId)
  if (byBusinessId) collector.candidates.set(byBusinessId.id, byBusinessId)
}

function collectProjectBusiness(collector: OwnershipCollector, lookup: SourceLookup, value: unknown, sourceLabel: string) {
  const reference = normalizeText(value)
  if (!reference) return

  const project = lookup.projects.get(reference)
  if (!project) {
    collector.missingReferences.push(`${sourceLabel}: ${reference}`)
    return
  }

  collectBusinessReference(collector, lookup, project.businessId, `${sourceLabel} -> Project.businessId`)
  collectBusinessReference(collector, lookup, project.businessCode, `${sourceLabel} -> Project.businessCode`)
}

function collectWorkItemBusiness(collector: OwnershipCollector, lookup: SourceLookup, value: unknown, sourceLabel: string) {
  const reference = normalizeText(value)
  if (!reference) return

  const workItem = lookup.workItems.get(reference)
  if (!workItem) {
    collector.missingReferences.push(`${sourceLabel}: ${reference}`)
    return
  }

  collectBusinessReference(collector, lookup, workItem.businessId, `${sourceLabel} -> WorkItem.businessId`)
  collectBusinessReference(collector, lookup, workItem.businessCode, `${sourceLabel} -> WorkItem.businessCode`)
  collectProjectBusiness(collector, lookup, workItem.projectId, `${sourceLabel} -> WorkItem.projectId`)
  collectProjectBusiness(collector, lookup, workItem.projectCode, `${sourceLabel} -> WorkItem.projectCode`)
}

function collectQueueBusiness(collector: OwnershipCollector, lookup: SourceLookup, value: unknown, sourceLabel: string) {
  const reference = normalizeText(value)
  if (!reference) return

  const queueItem = lookup.queueItems.get(reference)
  if (!queueItem) {
    collector.missingReferences.push(`${sourceLabel}: ${reference}`)
    return
  }

  collectBusinessReference(collector, lookup, queueItem.businessId, `${sourceLabel} -> Queue.businessId`)
  collectBusinessReference(collector, lookup, queueItem.businessCode, `${sourceLabel} -> Queue.businessCode`)
  collectProjectBusiness(collector, lookup, queueItem.projectId, `${sourceLabel} -> Queue.projectId`)
  collectProjectBusiness(collector, lookup, queueItem.projectCode, `${sourceLabel} -> Queue.projectCode`)
  collectWorkItemBusiness(collector, lookup, queueItem.sourceWorkItemRecordId, `${sourceLabel} -> Queue.sourceWorkItemRecordId`)
  collectWorkItemBusiness(collector, lookup, queueItem.sourceWorkItemId, `${sourceLabel} -> Queue.sourceWorkItemId`)
}

function collectExecutionBusiness(collector: OwnershipCollector, lookup: SourceLookup, value: unknown, sourceLabel: string) {
  const reference = normalizeText(value)
  if (!reference) return

  const execution = lookup.executions.get(reference)
  if (!execution) {
    collector.missingReferences.push(`${sourceLabel}: ${reference}`)
    return
  }

  collectBusinessReference(collector, lookup, execution.businessId, `${sourceLabel} -> Execution.businessId`)
  collectBusinessReference(collector, lookup, execution.businessCode, `${sourceLabel} -> Execution.businessCode`)
  collectProjectBusiness(collector, lookup, execution.projectId, `${sourceLabel} -> Execution.projectId`)
  collectProjectBusiness(collector, lookup, execution.projectCode, `${sourceLabel} -> Execution.projectCode`)
  collectWorkItemBusiness(collector, lookup, execution.workItem.workItemRecordId, `${sourceLabel} -> Execution.workItemRecordId`)
  collectWorkItemBusiness(collector, lookup, execution.workItem.workItemId, `${sourceLabel} -> Execution.workItemId`)
  collectQueueBusiness(collector, lookup, execution.queueItem?.queueRecordId, `${sourceLabel} -> Execution.queueRecordId`)
  collectQueueBusiness(collector, lookup, execution.queueItem?.queueId, `${sourceLabel} -> Execution.queueId`)
  collectProjectBusiness(collector, lookup, execution.executionRequest?.projectId, `${sourceLabel} -> ExecutionRequest.projectId`)
  collectProjectBusiness(collector, lookup, execution.executionRequest?.projectCode, `${sourceLabel} -> ExecutionRequest.projectCode`)
  collectProjectBusiness(collector, lookup, execution.executionRequest?.businessAssetProjectId, `${sourceLabel} -> ExecutionRequest.businessAssetProjectId`)
}

function ownershipFromCollector(collector: OwnershipCollector): BusinessAttentionOwnershipResult {
  const candidates = Array.from(collector.candidates.values())
  const missingReferences = Array.from(new Set(collector.missingReferences))

  if (candidates.length === 1) {
    const business = candidates[0]
    return {
      state: 'Resolved',
      businessRecordId: business.id,
      businessId: business.businessId,
      businessName: business.name,
      businessStatus: business.status,
      missingReferences,
    }
  }

  if (candidates.length > 1) {
    return {
      state: 'Conflict',
      candidateBusinessRecordIds: candidates.map((business) => business.id).sort(),
      candidateBusinessIds: candidates.map((business) => business.businessId).sort(),
      missingReferences,
      warning: 'Conflicting stable business references resolve to different Business records.',
    }
  }

  return {
    state: 'Unidentified',
    missingReferences,
    warning: missingReferences.length > 0
      ? 'No stable business reference resolved to a current Business record.'
      : 'No stable business reference was provided.',
  }
}

function resolveApprovalOwnership(approval: Approval, lookup: SourceLookup): BusinessAttentionOwnershipResult {
  const collector: OwnershipCollector = { candidates: new Map(), missingReferences: [] }

  collectBusinessReference(collector, lookup, approval.sourceBusinessId, 'Approval.sourceBusinessId')
  collectProjectBusiness(collector, lookup, approval.sourceProjectId, 'Approval.sourceProjectId')
  collectWorkItemBusiness(collector, lookup, approval.sourceWorkItemId, 'Approval.sourceWorkItemId')
  collectExecutionBusiness(collector, lookup, approval.sourceExecutionRecordId, 'Approval.sourceExecutionRecordId')
  collectExecutionBusiness(collector, lookup, approval.sourceExecutionId, 'Approval.sourceExecutionId')
  collectQueueBusiness(collector, lookup, approval.sourceQueueItemId, 'Approval.sourceQueueItemId')
  collectQueueBusiness(collector, lookup, approval.sourceQueueCode, 'Approval.sourceQueueCode')

  return ownershipFromCollector(collector)
}

function resolveExecutionOwnership(execution: ExecutionRecord, lookup: SourceLookup): BusinessAttentionOwnershipResult {
  const collector: OwnershipCollector = { candidates: new Map(), missingReferences: [] }

  collectBusinessReference(collector, lookup, execution.businessId, 'Execution.businessId')
  collectBusinessReference(collector, lookup, execution.businessCode, 'Execution.businessCode')
  collectProjectBusiness(collector, lookup, execution.projectId, 'Execution.projectId')
  collectProjectBusiness(collector, lookup, execution.projectCode, 'Execution.projectCode')
  collectWorkItemBusiness(collector, lookup, execution.workItem.workItemRecordId, 'Execution.workItemRecordId')
  collectWorkItemBusiness(collector, lookup, execution.workItem.workItemId, 'Execution.workItemId')
  collectQueueBusiness(collector, lookup, execution.queueItem?.queueRecordId, 'Execution.queueRecordId')
  collectQueueBusiness(collector, lookup, execution.queueItem?.queueId, 'Execution.queueId')
  collectProjectBusiness(collector, lookup, execution.executionRequest?.projectId, 'ExecutionRequest.projectId')
  collectProjectBusiness(collector, lookup, execution.executionRequest?.projectCode, 'ExecutionRequest.projectCode')
  collectProjectBusiness(collector, lookup, execution.executionRequest?.businessAssetProjectId, 'ExecutionRequest.businessAssetProjectId')

  return ownershipFromCollector(collector)
}

function resolveWorkItemOwnership(workItem: WorkItemRecord, lookup: SourceLookup): BusinessAttentionOwnershipResult {
  const collector: OwnershipCollector = { candidates: new Map(), missingReferences: [] }

  collectBusinessReference(collector, lookup, workItem.businessId, 'WorkItem.businessId')
  collectBusinessReference(collector, lookup, workItem.businessCode, 'WorkItem.businessCode')
  collectProjectBusiness(collector, lookup, workItem.projectId, 'WorkItem.projectId')
  collectProjectBusiness(collector, lookup, workItem.projectCode, 'WorkItem.projectCode')

  return ownershipFromCollector(collector)
}

function sourceTimestamp(value: string | undefined) {
  return isValidDate(value)
    ? { sourceCreatedAt: value, hasValidSourceCreatedAt: true }
    : { sourceCreatedAt: undefined, hasValidSourceCreatedAt: false }
}

function ownershipFields(ownership: BusinessAttentionOwnershipResult) {
  if (ownership.state !== 'Resolved') {
    return {
      ownershipWarning: ownership.warning,
    }
  }

  return {
    resolvedBusinessRecordId: ownership.businessRecordId,
    resolvedBusinessId: ownership.businessId,
    resolvedBusinessName: ownership.businessName,
    resolvedBusinessStatus: ownership.businessStatus,
    ownershipWarning: ownership.missingReferences.length > 0 ? 'Some linked source references could not be resolved.' : undefined,
  }
}

function executionLifecycleWarning(execution: ExecutionRecord): string | undefined {
  const requestStatus = execution.requestLifecycle?.status

  if (!requestStatus) return undefined

  if (requestStatus === 'Failed' && execution.status !== 'Failed') {
    return `Execution Request lifecycle is Failed while Execution status is ${execution.status}.`
  }

  if (execution.status === 'Failed' && requestStatus === 'Completed') {
    return 'Execution status is Failed while Execution Request lifecycle is Completed.'
  }

  return undefined
}

function approvalAttentionItem(approval: Approval, ownership: BusinessAttentionOwnershipResult): BusinessAttentionItem {
  const priority = normalizePriority(approval.priority)
  const timestamp = sourceTimestamp(approval.created)

  return {
    attentionId: `attention:pending-ceo-approval:approval:${approval.id}`,
    signalType: 'Pending CEO Approval',
    sourceType: 'Approval',
    sourceRecordId: approval.id,
    sourceReadableId: approval.id,
    title: approval.title || `Approval ${approval.id}`,
    reason: 'Approval Queue record is currently Pending and requires CEO approval.',
    priority: priority.priority,
    hasValidPriority: priority.hasValidPriority,
    ...timestamp,
    ownership,
    ...ownershipFields(ownership),
    navigationTarget: {
      route: '/approval',
      label: 'Open Approval Queue',
      recordId: approval.id,
      readableId: approval.id,
    },
    relatedReferences: {
      approvalId: approval.id,
      businessId: approval.sourceBusinessId,
      projectRecordId: approval.sourceProjectId,
      workItemRecordId: approval.sourceWorkItemId,
      queueRecordId: approval.sourceQueueItemId,
      queueId: approval.sourceQueueCode,
      executionRecordId: approval.sourceExecutionRecordId,
      executionId: approval.sourceExecutionId,
      executionRequestId: approval.sourceExecutionRequestId,
    },
  }
}

function executionAttentionItem(
  execution: ExecutionRecord,
  signalType: Extract<BusinessAttentionSignalType, 'Execution Requires Human Intervention' | 'Current Execution Failure'>,
  ownership: BusinessAttentionOwnershipResult,
  warning?: string,
): BusinessAttentionItem {
  const priority = normalizePriority(execution.priority)
  const timestamp = sourceTimestamp(execution.createdAt)
  const isHumanIntervention = signalType === 'Execution Requires Human Intervention'
  const readableId = readableFallback(execution.id, execution.executionId)

  return {
    attentionId: `attention:${isHumanIntervention ? 'human-intervention' : 'current-execution-failure'}:execution:${execution.id}`,
    signalType,
    sourceType: 'Execution',
    sourceRecordId: execution.id,
    sourceReadableId: execution.executionId,
    title: execution.title || `Execution ${readableId}`,
    reason: isHumanIntervention
      ? 'Execution Core record is currently Requires Human Intervention.'
      : execution.status === 'Failed'
        ? 'Execution Core record is currently Failed.'
        : 'Execution Request lifecycle indicates Failed while Execution Core status does not.',
    priority: priority.priority,
    hasValidPriority: priority.hasValidPriority,
    ...timestamp,
    ownership,
    ...ownershipFields(ownership),
    stateConsistencyWarning: warning,
    navigationTarget: {
      route: `/executions/${execution.id}`,
      label: 'Open Execution',
      recordId: execution.id,
      readableId: execution.executionId,
    },
    relatedReferences: {
      executionRecordId: execution.id,
      executionId: execution.executionId,
      businessId: execution.businessId,
      projectRecordId: execution.projectId,
      projectId: execution.projectCode,
      workItemRecordId: execution.workItem.workItemRecordId,
      workItemId: execution.workItem.workItemId,
      queueRecordId: execution.queueItem?.queueRecordId,
      queueId: execution.queueItem?.queueId,
      executionRequestId: execution.executionRequest?.requestId,
      approvalId: execution.approval?.approvalId,
    },
  }
}

function blockedWorkItemAttentionItem(workItem: WorkItemRecord, ownership: BusinessAttentionOwnershipResult): BusinessAttentionItem {
  const priority = normalizePriority(workItem.priority)
  const timestamp = sourceTimestamp(workItem.createdAt)
  const readableId = readableFallback(workItem.id, workItem.workItemId)

  return {
    attentionId: `attention:blocked-work-item:work-item:${workItem.id}`,
    signalType: 'Blocked Work Item',
    sourceType: 'Work Item',
    sourceRecordId: workItem.id,
    sourceReadableId: workItem.workItemId,
    title: workItem.title || `Work Item ${readableId}`,
    reason: 'Work Item is currently Blocked and needs review; this does not necessarily require a CEO decision.',
    priority: priority.priority,
    hasValidPriority: priority.hasValidPriority,
    ...timestamp,
    ownership,
    ...ownershipFields(ownership),
    navigationTarget: {
      route: `/work-items/${workItem.id}`,
      label: 'Open Work Item',
      recordId: workItem.id,
      readableId: workItem.workItemId,
    },
    relatedReferences: {
      workItemRecordId: workItem.id,
      workItemId: workItem.workItemId,
      businessId: workItem.businessId,
      projectRecordId: workItem.projectId,
      projectId: workItem.projectCode,
    },
  }
}

function addUniqueAttentionItem(items: Map<string, BusinessAttentionItem>, item: BusinessAttentionItem) {
  if (!items.has(item.attentionId)) items.set(item.attentionId, item)
}

export function isPendingCeoApproval(approval: Approval) {
  return approval.status === 'Pending' && approval.requiresCEOApproval === true
}

export function isExecutionRequiringHumanIntervention(execution: ExecutionRecord) {
  return execution.status === 'Requires Human Intervention'
}

export function isCurrentExecutionFailure(execution: ExecutionRecord) {
  return execution.status === 'Failed' || execution.requestLifecycle?.status === 'Failed'
}

export function getExecutionLifecycleConsistencyWarning(execution: Pick<ExecutionRecord, 'status' | 'requestLifecycle'>) {
  return executionLifecycleWarning(execution as ExecutionRecord)
}

function compareAttentionItems(first: BusinessAttentionItem, second: BusinessAttentionItem) {
  const firstPriority = first.priority === 'Unspecified' ? Number.POSITIVE_INFINITY : priorityOrder[first.priority]
  const secondPriority = second.priority === 'Unspecified' ? Number.POSITIVE_INFINITY : priorityOrder[second.priority]
  if (firstPriority !== secondPriority) return firstPriority - secondPriority

  const signalDifference = signalOrder[first.signalType] - signalOrder[second.signalType]
  if (signalDifference !== 0) return signalDifference

  if (
    first.hasValidSourceCreatedAt &&
    second.hasValidSourceCreatedAt &&
    first.sourceCreatedAt &&
    second.sourceCreatedAt &&
    first.sourceCreatedAt !== second.sourceCreatedAt
  ) {
    return Date.parse(first.sourceCreatedAt) - Date.parse(second.sourceCreatedAt)
  }

  if (first.hasValidSourceCreatedAt !== second.hasValidSourceCreatedAt) {
    return first.hasValidSourceCreatedAt ? -1 : 1
  }

  return `${first.sourceType}:${first.sourceRecordId}`.localeCompare(`${second.sourceType}:${second.sourceRecordId}`)
}

function buildBusinessSummary(business: BusinessRecord, items: BusinessAttentionItem[]): BusinessAttentionSummary {
  const businessItems = items.filter((item) => item.resolvedBusinessRecordId === business.id).sort(compareAttentionItems)
  const sourceRecords = new Set(businessItems.map((item) => `${item.sourceType}:${item.sourceRecordId}`))
  const countsBySignalType = emptySignalCounts()
  const countsByPriority = emptyPriorityCounts()

  for (const item of businessItems) {
    countsBySignalType[item.signalType] += 1
    countsByPriority[item.priority] += 1
  }

  return {
    businessRecordId: business.id,
    businessId: business.businessId,
    businessName: business.name,
    businessStatus: business.status,
    attentionItemCount: businessItems.length,
    contributingSourceRecordCount: sourceRecords.size,
    items: businessItems,
    countsBySignalType,
    countsByPriority,
  }
}

export function buildBusinessAttentionSummary(input: BuildBusinessAttentionInput): BusinessAttentionResult {
  const lookup = buildSourceLookup(input)
  const items = new Map<string, BusinessAttentionItem>()

  for (const approval of input.approvals) {
    if (!isPendingCeoApproval(approval)) continue
    addUniqueAttentionItem(items, approvalAttentionItem(approval, resolveApprovalOwnership(approval, lookup)))
  }

  for (const execution of input.executions) {
    const ownership = resolveExecutionOwnership(execution, lookup)
    const warning = executionLifecycleWarning(execution)

    if (isExecutionRequiringHumanIntervention(execution)) {
      addUniqueAttentionItem(items, executionAttentionItem(execution, 'Execution Requires Human Intervention', ownership, warning))
    }

    if (isCurrentExecutionFailure(execution)) {
      addUniqueAttentionItem(items, executionAttentionItem(execution, 'Current Execution Failure', ownership, warning))
    }
  }

  for (const workItem of input.workItems) {
    if (workItem.status !== 'Blocked') continue
    addUniqueAttentionItem(items, blockedWorkItemAttentionItem(workItem, resolveWorkItemOwnership(workItem, lookup)))
  }

  const portfolioItems = Array.from(items.values()).sort(compareAttentionItems)
  const contributingSourceRecordCount = new Set(portfolioItems.map((item) => `${item.sourceType}:${item.sourceRecordId}`)).size

  return {
    portfolioItems,
    businessSummaries: input.businesses.map((business) => buildBusinessSummary(business, portfolioItems)),
    reviewGroups: {
      unidentifiedOwnership: portfolioItems.filter((item) => item.ownership.state === 'Unidentified'),
      conflictingOwnership: portfolioItems.filter((item) => item.ownership.state === 'Conflict'),
      unspecifiedPriority: portfolioItems.filter((item) => item.priority === 'Unspecified'),
    },
    attentionItemCount: portfolioItems.length,
    contributingSourceRecordCount,
  }
}
