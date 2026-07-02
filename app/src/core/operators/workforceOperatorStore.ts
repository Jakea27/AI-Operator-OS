import { useSyncExternalStore } from 'react'
import {
  WorkforceOperatorHealth,
  WorkforceOperatorInput,
  WorkforceOperatorRecord,
  WorkforceOperatorStatus,
  WorkforceOperatorTimelineItem,
  WorkforceOperatorUpdate,
} from './workforceOperatorTypes'

const STORAGE_KEY = 'ai-operator-os-workforce-operators-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function timeline(message: string, createdAt = now()): WorkforceOperatorTimelineItem {
  return {
    id: id('operator-timeline'),
    message,
    createdAt,
  }
}

function fallbackOperatorCode(index: number) {
  return `OPR-${String(index + 1).padStart(4, '0')}`
}

function generateOperatorCode(existing: WorkforceOperatorRecord[]) {
  const max = existing.reduce((highest, operator) => {
    const match = operator.operatorId?.match(/^OPR-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `OPR-${String(max + 1).padStart(4, '0')}`
}

function normalizeOperator(raw: Partial<WorkforceOperatorRecord>, index = 0): WorkforceOperatorRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('workforce-operator'),
    operatorId: raw.operatorId ?? fallbackOperatorCode(index),
    name: raw.name?.trim() || 'Unnamed Operator',
    role: raw.role?.trim() || 'Department Operator',
    businessId: raw.businessId ?? '',
    businessCode: raw.businessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    departmentId: raw.departmentId ?? '',
    departmentCode: raw.departmentCode ?? 'DEP-0000',
    departmentName: raw.departmentName ?? 'Unassigned Department',
    assignedManagerId: raw.assignedManagerId,
    assignedManagerName: raw.assignedManagerName ?? 'Unassigned',
    status: raw.status ?? 'Planning',
    health: raw.health ?? 'Unknown',
    primarySkill: raw.primarySkill ?? 'General operations',
    currentAssignment: raw.currentAssignment ?? 'No current assignment.',
    notes: raw.notes ?? '',
    placeholderMetrics: raw.placeholderMetrics ?? 'No operator metrics connected yet.',
    placeholderQueue: raw.placeholderQueue ?? 'No operator queue connected yet.',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    timeline: Array.isArray(raw.timeline) && raw.timeline.length > 0
      ? raw.timeline
      : [timeline('Operator record created.', timestamp)],
  }
}

function readState(): WorkforceOperatorRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeOperator(item, index))
  } catch {
    return []
  }
}

let state = readState()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function persist(next: WorkforceOperatorRecord[]) {
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

export const workforceOperatorStore = {
  createOperator(input: WorkforceOperatorInput) {
    const timestamp = now()
    const operator: WorkforceOperatorRecord = {
      id: id('workforce-operator'),
      operatorId: generateOperatorCode(state),
      name: input.name.trim() || 'Unnamed Operator',
      role: input.role.trim() || 'Department Operator',
      businessId: input.businessId,
      businessCode: input.businessCode,
      businessName: input.businessName,
      departmentId: input.departmentId,
      departmentCode: input.departmentCode,
      departmentName: input.departmentName,
      assignedManagerId: input.assignedManagerId,
      assignedManagerName: input.assignedManagerName || 'Unassigned',
      status: input.status,
      health: input.health,
      primarySkill: input.primarySkill.trim() || 'General operations',
      currentAssignment: input.currentAssignment.trim() || 'No current assignment.',
      notes: input.notes.trim(),
      placeholderMetrics: 'No operator metrics connected yet.',
      placeholderQueue: 'No operator queue connected yet.',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [timeline(`Operator assigned to ${input.departmentCode}.`, timestamp)],
    }
    persist([operator, ...state])
    return operator
  },

  updateOperator(operatorRecordId: string, updates: WorkforceOperatorUpdate) {
    const timestamp = now()
    persist(state.map((operator) =>
      operator.id === operatorRecordId
        ? {
          ...operator,
          ...updates,
          name: updates.name?.trim() || operator.name,
          role: updates.role?.trim() || operator.role,
          primarySkill: updates.primarySkill?.trim() || operator.primarySkill,
          currentAssignment: updates.currentAssignment?.trim() || operator.currentAssignment,
          notes: updates.notes ?? operator.notes,
          updatedAt: timestamp,
          timeline: [timeline('Operator record updated.', timestamp), ...operator.timeline],
        }
        : operator,
    ))
  },

  getOperators() {
    return state
  },

  getOperator(operatorRecordId: string) {
    return state.find((operator) => operator.id === operatorRecordId)
  },
}

export function useWorkforceOperatorStore() {
  const operators = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    operators,
    createOperator: workforceOperatorStore.createOperator,
    updateOperator: workforceOperatorStore.updateOperator,
  }
}

export const workforceOperatorStatuses: WorkforceOperatorStatus[] = ['Planning', 'Ready', 'Operating', 'Paused', 'Archived']

export const workforceOperatorHealthOptions: WorkforceOperatorHealth[] = ['Excellent', 'Healthy', 'Watch', 'At Risk', 'Unknown']

