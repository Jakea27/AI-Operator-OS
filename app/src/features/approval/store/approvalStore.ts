import { useSyncExternalStore } from 'react'
import { Approval, ApprovalInput, ApprovalStatus } from '../types/approvalTypes'

const STORAGE_KEY = 'ai-operator-os-approval-queue-v1'

const listeners = new Set<() => void>()

function createId() {
  return `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function historyId() {
  return `approval-history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeApproval(raw: Partial<Approval>): Approval {
  const now = new Date().toISOString()
  return {
    id: raw.id ?? createId(),
    title: raw.title?.trim() || 'Untitled approval',
    description: raw.description?.trim() || 'No approval description recorded.',
    submittedBy: raw.submittedBy?.trim() || 'AI Operator OS',
    operator: raw.operator ?? 'System',
    department: raw.department?.trim() || 'Operations',
    relatedIssue: raw.relatedIssue ?? '',
    recommendationId: raw.recommendationId ?? '',
    priority: raw.priority ?? 'Medium',
    effort: raw.effort ?? 'Medium',
    risk: raw.risk ?? 'Medium',
    status: raw.status ?? 'Pending',
    requiresCEOApproval: raw.requiresCEOApproval ?? true,
    created: raw.created ?? now,
    updated: raw.updated ?? raw.created ?? now,
    submittedAt: raw.submittedAt,
    decidedAt: raw.decidedAt,
    decision: raw.decision,
    decisionNote: raw.decisionNote,
    businessValue: raw.businessValue,
    supportingEvidence: Array.isArray(raw.supportingEvidence) ? raw.supportingEvidence : [],
    recommendedNextAction: raw.recommendedNextAction,
    sourceQueueItemId: raw.sourceQueueItemId,
    sourceQueueCode: raw.sourceQueueCode,
    sourceWorkItemId: raw.sourceWorkItemId,
    sourceProjectId: raw.sourceProjectId,
    sourceBusinessId: raw.sourceBusinessId,
    sourceExecutionRecordId: raw.sourceExecutionRecordId,
    sourceExecutionId: raw.sourceExecutionId,
    sourceExecutionRequestId: raw.sourceExecutionRequestId,
    sourceBlueprintDeliverableId: raw.sourceBlueprintDeliverableId,
    sourceBlueprintDeliverableName: raw.sourceBlueprintDeliverableName,
    sourceResultId: raw.sourceResultId,
    sourceReviewStatus: raw.sourceReviewStatus,
    decisionHistory: Array.isArray(raw.decisionHistory) ? raw.decisionHistory : [],
  }
}

function readApprovals(): Approval[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalizeApproval(item))
  } catch {
    return []
  }
}

let state = readApprovals()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readApprovals()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: Approval[]) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } finally {
    listeners.forEach((listener) => listener())
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export const approvalStore = {
  addApproval(input: ApprovalInput) {
    const now = new Date().toISOString()
    const approval: Approval = {
      ...input,
      id: createId(),
      created: now,
      updated: now,
      submittedAt: input.submittedAt ?? (input.status === 'Pending' ? now : undefined),
      decisionHistory: [
        {
          id: historyId(),
          action: input.status === 'Pending' ? 'Submitted' : input.status,
          actor: input.submittedBy || 'AI Operator OS',
          note: input.status === 'Pending' ? 'Submitted for CEO approval.' : 'Approval record created.',
          createdAt: now,
        },
      ],
    }
    persist([approval, ...state])
    return approval
  },
  updateStatus(approvalId: string, status: ApprovalStatus, note = '', actor = 'CEO') {
    const now = new Date().toISOString()
    persist(state.map((approval) =>
      approval.id === approvalId
        ? updateApprovalStatus(approval, status, note, actor, now)
        : approval,
    ))
  },
  getApprovals() {
    return state
  },
}

function updateApprovalStatus(
  approval: Approval,
  status: ApprovalStatus,
  note: string,
  actor: string,
  timestamp: string,
) {
  const historyNote = note || decisionNoteFor(status)
  const latest = approval.decisionHistory[0]
  const isDuplicateLatestDecision = approval.status === status &&
    latest?.action === status &&
    latest?.actor === actor &&
    latest?.note === historyNote

  return {
    ...approval,
    status,
    updated: isDuplicateLatestDecision ? approval.updated : timestamp,
    decidedAt: ['Approved', 'Rejected', 'Changes Requested', 'Deferred', 'Archived'].includes(status)
      ? (isDuplicateLatestDecision ? approval.decidedAt : timestamp)
      : approval.decidedAt,
    decision: status,
    decisionNote: note || approval.decisionNote || historyNote,
    decisionHistory: isDuplicateLatestDecision
      ? approval.decisionHistory
      : [
          {
            id: historyId(),
            action: status,
            actor,
            note: historyNote,
            createdAt: timestamp,
          },
          ...approval.decisionHistory,
        ],
  }
}

export function useApprovalStore() {
  const approvals = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    approvals,
    pending: approvals.filter((approval) => approval.status === 'Pending').length,
    approved: approvals.filter((approval) => approval.status === 'Approved').length,
    rejected: approvals.filter((approval) => approval.status === 'Rejected').length,
    deferred: approvals.filter((approval) => approval.status === 'Deferred').length,
    approvedToday: approvals.filter((approval) => approval.status === 'Approved' && approval.decidedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    rejectedToday: approvals.filter((approval) => approval.status === 'Rejected' && approval.decidedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    addApproval: approvalStore.addApproval,
    updateStatus: approvalStore.updateStatus,
  }
}

function decisionNoteFor(status: ApprovalStatus) {
  if (status === 'Approved') return 'Approved by CEO. Execution is not automated yet.'
  if (status === 'Rejected') return 'Rejected by CEO.'
  if (status === 'Changes Requested') return 'CEO requested changes before approval.'
  if (status === 'Deferred') return 'Deferred by CEO for later review.'
  if (status === 'Archived') return 'Archived by CEO.'
  return 'Status updated.'
}
