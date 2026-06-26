import { Approval, ApprovalOperator, ApprovalStatus } from '../types/approvalTypes'

export type ApprovalStoreContext = {
  pending: number
  total: number
  byOperator: Record<ApprovalOperator, number>
}

export function getApprovalStats(approvals: Approval[]) {
  const latestDecision = approvals
    .filter((approval) => approval.status !== 'Draft' && approval.status !== 'Pending')
    .sort((a, b) => (b.decidedAt ?? b.updated).localeCompare(a.decidedAt ?? a.updated))[0]

  return {
    pending: countByStatus(approvals, 'Pending'),
    approved: countByStatus(approvals, 'Approved'),
    rejected: countByStatus(approvals, 'Rejected'),
    deferred: countByStatus(approvals, 'Deferred'),
    changesRequested: countByStatus(approvals, 'Changes Requested'),
    archived: countByStatus(approvals, 'Archived'),
    total: approvals.length,
    approvedToday: countToday(approvals, 'Approved'),
    rejectedToday: countToday(approvals, 'Rejected'),
    waitingOnCEO: countByStatus(approvals, 'Pending'),
    latestDecision,
    byOperator: getApprovalsByOperator(approvals),
  }
}

export function getOperatorApprovalStats(approvals: Approval[], operator: ApprovalOperator) {
  const scoped = approvals.filter((approval) => approval.operator === operator)
  const latestDecision = scoped
    .filter((approval) => approval.status !== 'Draft' && approval.status !== 'Pending')
    .sort((a, b) => (b.decidedAt ?? b.updated).localeCompare(a.decidedAt ?? a.updated))[0]

  return {
    approvals: scoped,
    pending: countByStatus(scoped, 'Pending'),
    approved: countByStatus(scoped, 'Approved'),
    rejected: countByStatus(scoped, 'Rejected'),
    deferred: countByStatus(scoped, 'Deferred'),
    changesRequested: countByStatus(scoped, 'Changes Requested'),
    lastDecision: latestDecision,
    needsAttention: scoped.some((approval) => approval.status === 'Pending'),
    history: scoped
      .flatMap((approval) => approval.decisionHistory.map((item) => ({
        ...item,
        approvalTitle: approval.title,
        approvalId: approval.id,
      })))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 6),
  }
}

export function getApprovalDecisionLabel(approval?: Approval) {
  if (!approval) return 'None yet'
  const date = approval.decidedAt ? ` · ${new Date(approval.decidedAt).toLocaleString()}` : ''
  if (approval.status === 'Approved') return `Approved${date}`
  if (approval.status === 'Rejected') return `Rejected${date}`
  if (approval.status === 'Changes Requested') return `Changes Requested${date}`
  if (approval.status === 'Deferred') return `Deferred${date}`
  if (approval.status === 'Archived') return `Archived${date}`
  if (approval.status === 'Pending') return 'Waiting on CEO decision'
  return 'Draft'
}

export function getApprovalStoreContext(approvals: Approval[]): ApprovalStoreContext {
  return {
    pending: countByStatus(approvals, 'Pending'),
    total: approvals.length,
    byOperator: getApprovalsByOperator(approvals),
  }
}

function countByStatus(approvals: Approval[], status: ApprovalStatus) {
  return approvals.filter((approval) => approval.status === status).length
}

function countToday(approvals: Approval[], status: ApprovalStatus) {
  const today = new Date().toISOString().slice(0, 10)
  return approvals.filter((approval) => approval.status === status && approval.decidedAt?.slice(0, 10) === today).length
}

function getApprovalsByOperator(approvals: Approval[]) {
  const counts: Record<ApprovalOperator, number> = {
    CTO: 0,
    CFO: 0,
    CMO: 0,
    COO: 0,
    Research: 0,
    System: 0,
  }
  approvals.forEach((approval) => {
    counts[approval.operator] += 1
  })
  return counts
}
