import { useSyncExternalStore } from 'react'
import { Approval, ApprovalInput, ApprovalStatus } from '../types/approvalTypes'

const STORAGE_KEY = 'ai-operator-os-approval-queue-v1'

const listeners = new Set<() => void>()

function createId() {
  return `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    }
    persist([approval, ...state])
    return approval
  },
  updateStatus(approvalId: string, status: ApprovalStatus) {
    persist(state.map((approval) =>
      approval.id === approvalId
        ? { ...approval, status, updated: new Date().toISOString() }
        : approval,
    ))
  },
  getApprovals() {
    return state
  },
}

export function useApprovalStore() {
  const approvals = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    approvals,
    pending: approvals.filter((approval) => approval.status === 'Pending').length,
    approved: approvals.filter((approval) => approval.status === 'Approved').length,
    rejected: approvals.filter((approval) => approval.status === 'Rejected').length,
    deferred: approvals.filter((approval) => approval.status === 'Deferred').length,
    addApproval: approvalStore.addApproval,
    updateStatus: approvalStore.updateStatus,
  }
}
