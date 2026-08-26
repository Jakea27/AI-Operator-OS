import type { ExecutionRecord } from '../execution'
import type { ProjectRecord } from './projectTypes'

export type CreativeCostBreakdownItem = {
  key: string
  label: string
  executionCount: number
  actualRecordedCost: number
  estimatedExecutionCost: number
}

export type CreativeCostSummary = {
  projectRecordId: string
  projectId: string
  executionCount: number
  successfulExecutionCount: number
  failedExecutionCount: number
  noCostRecordedCount: number
  localProviderDirectCostCount: number
  actualRecordedCost: number
  estimatedExecutionCost: number
  totalExecutionDurationMs: number
  averageLatencyMs?: number
  revisionExecutionCount: number
  revisionActualRecordedCost: number
  revisionEstimatedExecutionCost: number
  topicDevelopmentExecutionCount: number
  topicDevelopmentActualRecordedCost: number
  topicDevelopmentEstimatedExecutionCost: number
  providerModelBreakdown: CreativeCostBreakdownItem[]
  workOrderCapabilityBreakdown: CreativeCostBreakdownItem[]
  executions: ExecutionRecord[]
}

function money(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
}

function hasActualCostRecord(execution: ExecutionRecord) {
  return execution.costRecords.some((record) => record.kind === 'Actual')
}

function hasEstimatedCostRecord(execution: ExecutionRecord) {
  return execution.costRecords.some((record) => record.kind === 'Estimated')
}

function actualCostForExecution(execution: ExecutionRecord) {
  const costRecordTotal = execution.costRecords
    .filter((record) => record.kind === 'Actual')
    .reduce((total, record) => total + money(record.amount), 0)

  return costRecordTotal > 0 ? costRecordTotal : money(execution.actualCost)
}

function estimatedCostForExecution(execution: ExecutionRecord) {
  const costRecordTotal = execution.costRecords
    .filter((record) => record.kind === 'Estimated')
    .reduce((total, record) => total + money(record.amount), 0)

  return costRecordTotal > 0 ? costRecordTotal : money(execution.estimatedCost)
}

function providerName(execution: ExecutionRecord) {
  return execution.result?.provider?.name || execution.selectedProviders[0]?.name || 'Provider not recorded'
}

function modelName(execution: ExecutionRecord) {
  return execution.result?.model?.name || execution.selectedProviders[0]?.model || 'Model not recorded'
}

function providerModelKey(execution: ExecutionRecord) {
  return `${providerName(execution)} / ${modelName(execution)}`
}

function isLocalProviderExecution(execution: ExecutionRecord) {
  const provider = providerName(execution).toLowerCase()
  const category = execution.selectedProviders[0]?.category?.toLowerCase() ?? ''
  return provider.includes('ollama') || provider.includes('local') || category.includes('local')
}

function isRevisionExecution(execution: ExecutionRecord) {
  return execution.workOrder?.metadata?.isRevision === 'true' ||
    execution.executionRequest?.correlationMetadata?.isRevision === 'true'
}

function isTopicDevelopmentExecution(execution: ExecutionRecord) {
  return execution.workOrder?.workOrderType === 'Develop Creative Concepts' ||
    execution.executionRequest?.correlationMetadata?.workOrderType === 'Develop Creative Concepts'
}

function workOrderCapabilityLabel(execution: ExecutionRecord) {
  const workOrderType = execution.workOrder?.workOrderType?.trim()
  const capability = execution.executionRequest?.requestedCapability?.trim() ||
    execution.selectedCapabilities[0]?.name?.trim()

  if (workOrderType && capability) return `${workOrderType} / ${capability}`
  return workOrderType || capability || 'Unclassified execution'
}

function matchesProject(project: ProjectRecord, execution: ExecutionRecord) {
  const stableProjectIds = new Set([
    project.id,
    project.projectId,
  ].filter(Boolean))

  const executionProjectIds = [
    execution.projectId,
    execution.projectCode,
    execution.workItem.projectId,
    execution.workItem.projectCode,
    execution.workOrder?.businessAssetProjectId,
    execution.executionRequest?.projectId,
    execution.executionRequest?.projectCode,
    execution.executionRequest?.businessAssetProjectId,
  ].filter((value): value is string => Boolean(value))

  return executionProjectIds.some((value) => stableProjectIds.has(value))
}

function upsertBreakdown(
  items: Map<string, CreativeCostBreakdownItem>,
  key: string,
  execution: ExecutionRecord,
) {
  const current = items.get(key) ?? {
    key,
    label: key,
    executionCount: 0,
    actualRecordedCost: 0,
    estimatedExecutionCost: 0,
  }

  items.set(key, {
    ...current,
    executionCount: current.executionCount + 1,
    actualRecordedCost: current.actualRecordedCost + actualCostForExecution(execution),
    estimatedExecutionCost: current.estimatedExecutionCost + estimatedCostForExecution(execution),
  })
}

export function buildCreativeCostSummary(project: ProjectRecord, executions: ExecutionRecord[]): CreativeCostSummary {
  const projectExecutions = executions.filter((execution) => matchesProject(project, execution))
  const providerModelBreakdown = new Map<string, CreativeCostBreakdownItem>()
  const workOrderCapabilityBreakdown = new Map<string, CreativeCostBreakdownItem>()
  const latencyValues = projectExecutions
    .map((execution) => execution.result?.latencyMs ?? execution.timing.durationMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)

  for (const execution of projectExecutions) {
    upsertBreakdown(providerModelBreakdown, providerModelKey(execution), execution)
    upsertBreakdown(workOrderCapabilityBreakdown, workOrderCapabilityLabel(execution), execution)
  }

  const revisionExecutions = projectExecutions.filter(isRevisionExecution)
  const topicDevelopmentExecutions = projectExecutions.filter(isTopicDevelopmentExecution)
  const noCostRecordedCount = projectExecutions.filter((execution) =>
    !hasActualCostRecord(execution) &&
    !hasEstimatedCostRecord(execution) &&
    actualCostForExecution(execution) === 0 &&
    estimatedCostForExecution(execution) === 0 &&
    !isLocalProviderExecution(execution),
  ).length
  const localProviderDirectCostCount = projectExecutions.filter((execution) =>
    isLocalProviderExecution(execution) &&
    actualCostForExecution(execution) === 0 &&
    estimatedCostForExecution(execution) === 0,
  ).length

  return {
    projectRecordId: project.id,
    projectId: project.projectId,
    executionCount: projectExecutions.length,
    successfulExecutionCount: projectExecutions.filter((execution) => execution.result?.success || execution.status === 'Completed').length,
    failedExecutionCount: projectExecutions.filter((execution) => execution.result?.failure || execution.status === 'Failed').length,
    noCostRecordedCount,
    localProviderDirectCostCount,
    actualRecordedCost: projectExecutions.reduce((total, execution) => total + actualCostForExecution(execution), 0),
    estimatedExecutionCost: projectExecutions.reduce((total, execution) => total + estimatedCostForExecution(execution), 0),
    totalExecutionDurationMs: projectExecutions.reduce((total, execution) => total + money(execution.timing.durationMs), 0),
    averageLatencyMs: latencyValues.length > 0
      ? latencyValues.reduce((total, value) => total + value, 0) / latencyValues.length
      : undefined,
    revisionExecutionCount: revisionExecutions.length,
    revisionActualRecordedCost: revisionExecutions.reduce((total, execution) => total + actualCostForExecution(execution), 0),
    revisionEstimatedExecutionCost: revisionExecutions.reduce((total, execution) => total + estimatedCostForExecution(execution), 0),
    topicDevelopmentExecutionCount: topicDevelopmentExecutions.length,
    topicDevelopmentActualRecordedCost: topicDevelopmentExecutions.reduce((total, execution) => total + actualCostForExecution(execution), 0),
    topicDevelopmentEstimatedExecutionCost: topicDevelopmentExecutions.reduce((total, execution) => total + estimatedCostForExecution(execution), 0),
    providerModelBreakdown: Array.from(providerModelBreakdown.values()).sort((first, second) => second.executionCount - first.executionCount),
    workOrderCapabilityBreakdown: Array.from(workOrderCapabilityBreakdown.values()).sort((first, second) => second.executionCount - first.executionCount),
    executions: projectExecutions,
  }
}
