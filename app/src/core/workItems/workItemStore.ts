import { useSyncExternalStore } from 'react'
import {
  WorkItemInput,
  WorkItemPriority,
  WorkItemRecord,
  WorkItemStatus,
  WorkItemTimelineItem,
  WorkItemUpdate,
} from './workItemTypes'

const STORAGE_KEY = 'ai-operator-os-work-items-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): WorkItemTimelineItem {
  return {
    id: id('work-item-timeline'),
    message,
    createdAt,
  }
}

function fallbackWorkItemCode(index: number) {
  return `WI-${String(index + 1).padStart(4, '0')}`
}

function generateWorkItemCode(existing: WorkItemRecord[]) {
  const max = existing.reduce((highest, workItem) => {
    const match = workItem.workItemId?.match(/^WI-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `WI-${String(max + 1).padStart(4, '0')}`
}

function normalizeHours(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric * 10) / 10)
}

function normalizeWorkItem(raw: Partial<WorkItemRecord>, index = 0): WorkItemRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('work-item'),
    workItemId: raw.workItemId ?? fallbackWorkItemCode(index),
    title: raw.title?.trim() || 'Untitled Work Item',
    description: raw.description?.trim() || 'No description recorded yet.',
    status: raw.status ?? 'Planning',
    priority: raw.priority ?? 'Medium',
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    projectId: raw.projectId ?? '',
    projectCode: raw.projectCode ?? 'PROJ-0000',
    projectName: raw.projectName ?? 'Unknown Project',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    assignedManagerId: raw.assignedManagerId,
    assignedManagerName: raw.assignedManagerName ?? 'Unassigned',
    assignedOperatorId: raw.assignedOperatorId,
    assignedOperatorCode: raw.assignedOperatorCode,
    assignedOperatorName: raw.assignedOperatorName ?? 'Unassigned',
    estimatedHours: normalizeHours(raw.estimatedHours),
    dueDate: raw.dueDate ?? '',
    notes: raw.notes ?? '',
    placeholderMetrics: raw.placeholderMetrics ?? 'No Work Item metrics connected yet.',
    placeholderNotes: raw.placeholderNotes ?? 'Execution notes will remain placeholders until the execution layer exists.',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Work Item record created.', timestamp)],
  }
}

function readState(): WorkItemRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeWorkItem(item, index))
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

function persist(next: WorkItemRecord[]) {
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

export const workItemStore = {
  createWorkItem(input: WorkItemInput) {
    const timestamp = now()
    const workItem: WorkItemRecord = {
      id: id('work-item'),
      workItemId: generateWorkItemCode(state),
      title: input.title.trim() || 'Untitled Work Item',
      description: input.description.trim() || 'No description recorded yet.',
      status: input.status,
      priority: input.priority,
      businessId: input.businessId,
      businessCode: input.businessCode,
      businessName: input.businessName,
      projectId: input.projectId,
      projectCode: input.projectCode,
      projectName: input.projectName,
      departmentId: input.departmentId,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      assignedManagerId: input.assignedManagerId,
      assignedManagerName: input.assignedManagerName || 'Unassigned',
      assignedOperatorId: input.assignedOperatorId,
      assignedOperatorCode: input.assignedOperatorCode,
      assignedOperatorName: input.assignedOperatorName || 'Unassigned',
      estimatedHours: normalizeHours(input.estimatedHours),
      dueDate: input.dueDate,
      notes: input.notes.trim(),
      placeholderMetrics: 'No Work Item metrics connected yet.',
      placeholderNotes: 'Execution notes will remain placeholders until the execution layer exists.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Work Item created for ${input.projectCode}.`, timestamp)],
    }

    persist([workItem, ...state])
    return workItem
  },

  updateWorkItem(workItemRecordId: string, updates: WorkItemUpdate) {
    const timestamp = now()
    persist(state.map((workItem) =>
      workItem.id === workItemRecordId
        ? {
          ...workItem,
          ...updates,
          title: updates.title?.trim() || workItem.title,
          description: updates.description?.trim() || workItem.description,
          assignedOperatorName: updates.assignedOperatorName ?? workItem.assignedOperatorName,
          estimatedHours: updates.estimatedHours === undefined ? workItem.estimatedHours : normalizeHours(updates.estimatedHours),
          notes: updates.notes ?? workItem.notes,
          updatedAt: timestamp,
          timeline: [timeline('Work Item record updated.', timestamp), ...workItem.timeline],
        }
        : workItem,
    ))
  },

  getWorkItems() {
    return state
  },

  getWorkItem(workItemRecordId: string) {
    return state.find((workItem) => workItem.id === workItemRecordId)
  },
}

export function useWorkItemStore() {
  const workItems = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    workItems,
    createWorkItem: workItemStore.createWorkItem,
    updateWorkItem: workItemStore.updateWorkItem,
  }
}

export const workItemStatuses: WorkItemStatus[] = ['Planning', 'Ready', 'In Progress', 'Blocked', 'Review', 'Completed', 'Archived']

export const workItemPriorities: WorkItemPriority[] = ['Low', 'Medium', 'High', 'Critical']
