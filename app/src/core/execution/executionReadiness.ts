import { capabilityPlanningStore } from '../capabilityPlanning'
import { CapabilityPlanRecord } from '../capabilityPlanning/capabilityPlanningTypes'
import { approvalStore } from '../../features/approval/store/approvalStore'
import { Approval } from '../../features/approval/types/approvalTypes'
import {
  ApprovalReference,
  CapabilityPlanReference,
  CapabilityReference,
  ExecutionReadinessBlocker,
  ExecutionReadinessReport,
  ExecutionRecord,
  ProviderReference,
  ToolReference,
} from './executionTypes'

function capabilityPlanReference(plan: CapabilityPlanRecord): CapabilityPlanReference {
  return {
    capabilityPlanRecordId: plan.id,
    capabilityPlanId: plan.capabilityPlanId,
    sourceQueueItemId: plan.sourceQueueItemId,
    readinessStatus: plan.readinessStatus,
    estimatedCost: plan.estimatedCost,
  }
}

function capabilityReferences(plan: CapabilityPlanRecord): CapabilityReference[] {
  return plan.requiredCapabilities.map((capability) => ({
    capabilityId: capability.id,
    name: capability.name,
    category: capability.category,
    capabilityPlanId: plan.capabilityPlanId,
  }))
}

function toolReferences(plan: CapabilityPlanRecord): ToolReference[] {
  return plan.requiredTools.map((tool) => ({
    toolId: tool.id,
    name: tool.name,
    category: tool.category,
  }))
}

function providerReferences(plan: CapabilityPlanRecord): ProviderReference[] {
  return plan.preferredProviders.map((provider) => ({
    providerId: provider.id,
    name: provider.name,
    category: provider.category,
  }))
}

function approvalReference(approval: Approval): ApprovalReference {
  return {
    approvalId: approval.id,
    status: approval.status,
    decidedAt: approval.decidedAt,
    decision: approval.decision,
    sourceQueueItemId: approval.sourceQueueItemId,
    sourceWorkItemId: approval.sourceWorkItemId,
  }
}

function resolveCapabilityPlan(execution: ExecutionRecord) {
  if (execution.capabilityPlan?.capabilityPlanRecordId) {
    return capabilityPlanningStore.getCapabilityPlan(execution.capabilityPlan.capabilityPlanRecordId)
  }

  if (execution.capabilityPlan?.capabilityPlanId) {
    return capabilityPlanningStore.getCapabilityPlan(execution.capabilityPlan.capabilityPlanId)
  }

  return capabilityPlanningStore.getCapabilityPlanForQueueItem(execution.queueItem.queueRecordId)
}

function resolveApproval(execution: ExecutionRecord) {
  const approvals = approvalStore.getApprovals()

  if (execution.approval?.approvalId) {
    const linked = approvals.find((approval) => approval.id === execution.approval?.approvalId)
    if (linked) return linked
  }

  return approvals.find((approval) =>
    approval.sourceQueueItemId === execution.queueItem.queueRecordId ||
    approval.sourceQueueCode === execution.queueItem.queueId ||
    approval.sourceWorkItemId === execution.workItem.workItemId,
  )
}

function capabilityBlockers(plan: CapabilityPlanRecord | undefined): ExecutionReadinessBlocker[] {
  if (!plan) {
    return [{
      code: 'Missing Capability Plan',
      message: 'No Capability Plan is linked to this execution record.',
    }]
  }

  const blockers: ExecutionReadinessBlocker[] = []

  if (plan.readinessStatus !== 'Approved') {
    blockers.push({
      code: 'Capability Plan Not Approved',
      message: `Capability Plan ${plan.capabilityPlanId} is ${plan.readinessStatus}, not Approved.`,
    })
  }

  if (plan.missingRequirements.length > 0) {
    blockers.push({
      code: 'Capability Requirements Missing',
      message: `Capability Plan ${plan.capabilityPlanId} has missing requirements: ${plan.missingRequirements.join(', ')}.`,
    })
  }

  return blockers
}

function approvalBlockers(approval: Approval | undefined): ExecutionReadinessBlocker[] {
  if (!approval) {
    return [{
      code: 'Missing Approval',
      message: 'No Approval Queue record is linked to this execution record.',
    }]
  }

  if (approval.status !== 'Approved') {
    return [{
      code: 'Approval Not Approved',
      message: `Approval ${approval.id} is ${approval.status}, not Approved.`,
    }]
  }

  return []
}

export function evaluateExecutionReadiness(execution: ExecutionRecord): ExecutionReadinessReport {
  const plan = resolveCapabilityPlan(execution)
  const approval = resolveApproval(execution)
  const blockers = [
    ...capabilityBlockers(plan),
    ...approvalBlockers(approval),
  ]

  const capabilityReady = !!plan && capabilityBlockers(plan).length === 0
  const approvalReady = !!approval && approvalBlockers(approval).length === 0

  return {
    executionRecordId: execution.id,
    executionId: execution.executionId,
    capabilityPlan: plan ? capabilityPlanReference(plan) : execution.capabilityPlan,
    approval: approval ? approvalReference(approval) : execution.approval,
    capabilityReady,
    approvalReady,
    eligibleForAwaitingApproval: execution.status === 'Awaiting Capability Review' && capabilityReady,
    eligibleForApproved: execution.status === 'Awaiting Approval' && approvalReady,
    eligibleForReady: execution.status === 'Approved' && capabilityReady && approvalReady,
    blockers,
  }
}

export function applyReadinessReferences(execution: ExecutionRecord): ExecutionRecord {
  const plan = resolveCapabilityPlan(execution)
  const approval = resolveApproval(execution)

  return {
    ...execution,
    capabilityPlan: plan ? capabilityPlanReference(plan) : execution.capabilityPlan,
    selectedCapabilities: plan ? capabilityReferences(plan) : execution.selectedCapabilities,
    selectedTools: plan ? toolReferences(plan) : execution.selectedTools,
    selectedProviders: plan ? providerReferences(plan) : execution.selectedProviders,
    approval: approval ? approvalReference(approval) : execution.approval,
    estimatedCost: plan ? plan.estimatedCost : execution.estimatedCost,
  }
}

export function readinessMessage(report: ExecutionReadinessReport) {
  if (report.blockers.length === 0) {
    return 'Execution readiness requirements are satisfied.'
  }

  return report.blockers.map((blocker) => blocker.message).join(' ')
}
