import { useSyncExternalStore } from 'react'
import {
  ExecutionQueueInput,
  ExecutionQueuePriority,
  ExecutionQueueRecord,
  ExecutionQueueStatus,
  ExecutionQueueTimelineItem,
  ExecutionQueueUpdate,
  ExecutionType,
} from './executionQueueTypes'

const STORAGE_KEY = 'ai-operator-os-execution-queue-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): ExecutionQueueTimelineItem {
  return {
    id: id('execution-queue-timeline'),
    message,
    createdAt,
  }
}

function fallbackQueueCode(index: number) {
  return `EQ-${String(index + 1).padStart(4, '0')}`
}

function generateQueueCode(existing: ExecutionQueueRecord[]) {
  const max = existing.reduce((highest, queueItem) => {
    const match = queueItem.queueId?.match(/^EQ-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `EQ-${String(max + 1).padStart(4, '0')}`
}

function normalizeQueueItem(raw: Partial<ExecutionQueueRecord>, index = 0): ExecutionQueueRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('execution-queue'),
    queueId: raw.queueId ?? fallbackQueueCode(index),
    sourceWorkItemRecordId: raw.sourceWorkItemRecordId ?? '',
    sourceWorkItemId: raw.sourceWorkItemId ?? 'WI-0000',
    workItemTitle: raw.workItemTitle?.trim() || 'Untitled Work Item',
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    projectId: raw.projectId ?? '',
    projectCode: raw.projectCode ?? 'PROJ-0000',
    projectName: raw.projectName ?? 'Unknown Project',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    managerId: raw.managerId,
    managerName: raw.managerName ?? 'Unassigned',
    operatorId: raw.operatorId,
    operatorCode: raw.operatorCode,
    operatorName: raw.operatorName ?? 'Unassigned',
    queueStatus: raw.queueStatus ?? 'Queued',
    priority: raw.priority ?? 'Medium',
    executionType: raw.executionType ?? 'Manual',
    requiresApproval: raw.requiresApproval ?? false,
    notes: raw.notes ?? '',
    placeholderResult: raw.placeholderResult ?? 'No execution result exists yet. This queue item prepares future work but does not execute anything.',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Execution Queue record created.', timestamp)],
  }
}

function readState(): ExecutionQueueRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeQueueItem(item, index))
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
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: ExecutionQueueRecord[]) {
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

export const executionQueueStore = {
  createQueueItem(input: ExecutionQueueInput) {
    const existing = state.find((queueItem) => queueItem.sourceWorkItemRecordId === input.sourceWorkItemRecordId)
    if (existing) return existing

    const timestamp = now()
    const queueItem: ExecutionQueueRecord = {
      id: id('execution-queue'),
      queueId: generateQueueCode(state),
      sourceWorkItemRecordId: input.sourceWorkItemRecordId,
      sourceWorkItemId: input.sourceWorkItemId,
      workItemTitle: input.workItemTitle.trim() || 'Untitled Work Item',
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
      queueStatus: input.queueStatus,
      priority: input.priority,
      executionType: input.executionType,
      requiresApproval: input.requiresApproval,
      notes: input.notes.trim(),
      placeholderResult: 'No execution result exists yet. This queue item prepares future work but does not execute anything.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Execution Queue item created from ${input.sourceWorkItemId}.`, timestamp)],
    }

    persist([queueItem, ...state])
    return queueItem
  },

  updateQueueItem(queueRecordId: string, updates: ExecutionQueueUpdate) {
    const timestamp = now()
    persist(state.map((queueItem) =>
      queueItem.id === queueRecordId
        ? {
          ...queueItem,
          ...updates,
          notes: updates.notes ?? queueItem.notes,
          updatedAt: timestamp,
          timeline: [timeline('Execution Queue record updated.', timestamp), ...queueItem.timeline],
        }
        : queueItem,
    ))
  },

  getQueueItems() {
    return state
  },

  getQueueItem(queueRecordId: string) {
    return state.find((queueItem) => queueItem.id === queueRecordId)
  },

  getQueueItemForWorkItem(workItemRecordId: string) {
    return state.find((queueItem) => queueItem.sourceWorkItemRecordId === workItemRecordId)
  },
}

export function useExecutionQueueStore() {
  const queueItems = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    queueItems,
    createQueueItem: executionQueueStore.createQueueItem,
    updateQueueItem: executionQueueStore.updateQueueItem,
    getQueueItemForWorkItem: executionQueueStore.getQueueItemForWorkItem,
  }
}

export const executionQueueStatuses: ExecutionQueueStatus[] = ['Queued', 'Waiting Approval', 'Ready', 'Blocked', 'Completed', 'Archived']

export const executionTypes: ExecutionType[] = ['Manual', 'Draft', 'Review', 'Future AI', 'Future Automation']

export const executionQueuePriorities: ExecutionQueuePriority[] = ['Low', 'Medium', 'High', 'Critical']
