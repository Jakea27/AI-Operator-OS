import { useSyncExternalStore } from 'react'
import { ExecutionQueueRecord } from '@/src/core/executionQueue'
import {
  CapabilityPlanHistoryItem,
  CapabilityPlanInput,
  CapabilityPlanRecord,
  CapabilityPlanUpdate,
  CapabilityReadinessStatus,
} from './capabilityPlanningTypes'

const STORAGE_KEY = 'ai-operator-os-capability-plans-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function history(message: string, createdAt = now()): CapabilityPlanHistoryItem {
  return {
    id: id('capability-plan-history'),
    message,
    createdAt,
  }
}

function fallbackCapabilityPlanCode(index: number) {
  return `CAP-${String(index + 1).padStart(4, '0')}`
}

function generateCapabilityPlanCode(existing: CapabilityPlanRecord[]) {
  const max = existing.reduce((highest, plan) => {
    const match = plan.capabilityPlanId?.match(/^CAP-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `CAP-${String(max + 1).padStart(4, '0')}`
}

function numericOrZero(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, numeric)
}

export function deriveMissingRequirements(plan: Pick<
  CapabilityPlanRecord,
  | 'requiredCapabilities'
  | 'preferredProviders'
  | 'requiredTools'
  | 'requiredPermissions'
  | 'requiredOperators'
  | 'estimatedCost'
  | 'estimatedRuntimeMinutes'
>) {
  const missing: string[] = []

  if (plan.requiredCapabilities.length === 0) missing.push('Missing capability')
  if (plan.preferredProviders.length === 0) missing.push('Missing provider')
  if (plan.requiredTools.length === 0) missing.push('Missing tool')
  if (plan.requiredPermissions.length === 0) missing.push('Missing permission')
  if (plan.requiredOperators.length === 0) missing.push('Missing operator')
  if (numericOrZero(plan.estimatedCost) <= 0) missing.push('Cost not estimated')
  if (numericOrZero(plan.estimatedRuntimeMinutes) <= 0) missing.push('Runtime not estimated')

  return missing
}

function normalizePlan(raw: Partial<CapabilityPlanRecord>, index = 0): CapabilityPlanRecord {
  const timestamp = raw.createdAt ?? now()
  const normalized: CapabilityPlanRecord = {
    id: raw.id ?? id('capability-plan'),
    capabilityPlanId: raw.capabilityPlanId ?? fallbackCapabilityPlanCode(index),
    sourceQueueItemId: raw.sourceQueueItemId ?? '',
    sourceQueueCode: raw.sourceQueueCode ?? 'EQ-0000',
    sourceWorkItemId: raw.sourceWorkItemId ?? 'WI-0000',
    workItemTitle: raw.workItemTitle?.trim() || 'Untitled Work Item',
    sourceProjectId: raw.sourceProjectId ?? '',
    sourceProjectCode: raw.sourceProjectCode ?? 'PROJ-0000',
    projectName: raw.projectName ?? 'Unknown Project',
    sourceBusinessId: raw.sourceBusinessId ?? '',
    sourceBusinessCode: raw.sourceBusinessCode ?? 'BIZ-0000',
    businessName: raw.businessName ?? 'Unknown Business',
    requiredCapabilities: Array.isArray(raw.requiredCapabilities) ? raw.requiredCapabilities : [],
    preferredProviders: Array.isArray(raw.preferredProviders) ? raw.preferredProviders : [],
    requiredTools: Array.isArray(raw.requiredTools) ? raw.requiredTools : [],
    requiredPermissions: Array.isArray(raw.requiredPermissions) ? raw.requiredPermissions : [],
    requiredOperators: Array.isArray(raw.requiredOperators) ? raw.requiredOperators : [],
    estimatedCost: numericOrZero(raw.estimatedCost),
    estimatedRuntimeMinutes: numericOrZero(raw.estimatedRuntimeMinutes),
    readinessStatus: raw.readinessStatus ?? 'Draft',
    missingRequirements: [],
    notes: raw.notes ?? '',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    history: Array.isArray(raw.history) && raw.history.length > 0
      ? raw.history
      : [history('Capability Plan created.', timestamp)],
  }

  return {
    ...normalized,
    missingRequirements: deriveMissingRequirements(normalized),
  }
}

function readState(): CapabilityPlanRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizePlan(item, index))
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

function persist(next: CapabilityPlanRecord[]) {
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

function createInputFromQueueItem(queueItem: ExecutionQueueRecord): CapabilityPlanInput {
  return {
    sourceQueueItemId: queueItem.id,
    sourceQueueCode: queueItem.queueId,
    sourceWorkItemId: queueItem.sourceWorkItemId,
    workItemTitle: queueItem.workItemTitle,
    sourceProjectId: queueItem.projectId,
    sourceProjectCode: queueItem.projectCode,
    projectName: queueItem.projectName,
    sourceBusinessId: queueItem.businessId,
    sourceBusinessCode: queueItem.businessCode,
    businessName: queueItem.businessName,
  }
}

export const capabilityPlanningStore = {
  storageKey: STORAGE_KEY,

  createCapabilityPlan(input: CapabilityPlanInput) {
    const existing = state.find((plan) => plan.sourceQueueItemId === input.sourceQueueItemId)
    if (existing) return existing

    const timestamp = now()
    const plan: CapabilityPlanRecord = normalizePlan({
      id: id('capability-plan'),
      capabilityPlanId: generateCapabilityPlanCode(state),
      ...input,
      readinessStatus: 'Draft',
      estimatedCost: 0,
      estimatedRuntimeMinutes: 0,
      notes: '',
      createdAt: timestamp,
      updatedAt: timestamp,
      history: [history(`Capability Plan created for ${input.sourceQueueCode}.`, timestamp)],
    })

    persist([plan, ...state])
    return plan
  },

  createCapabilityPlanFromQueueItem(queueItem: ExecutionQueueRecord) {
    return this.createCapabilityPlan(createInputFromQueueItem(queueItem))
  },

  updateCapabilityPlan(planRecordId: string, updates: CapabilityPlanUpdate) {
    const timestamp = now()
    persist(state.map((plan) => {
      if (plan.id !== planRecordId) return plan

      const next = normalizePlan({
        ...plan,
        ...updates,
        estimatedCost: updates.estimatedCost === undefined ? plan.estimatedCost : numericOrZero(updates.estimatedCost),
        estimatedRuntimeMinutes: updates.estimatedRuntimeMinutes === undefined
          ? plan.estimatedRuntimeMinutes
          : numericOrZero(updates.estimatedRuntimeMinutes),
        notes: updates.notes ?? plan.notes,
        updatedAt: timestamp,
        history: [history('Capability Plan updated.', timestamp), ...plan.history],
      })

      return next
    }))
  },

  getCapabilityPlans() {
    return state
  },

  getCapabilityPlan(planRecordId: string) {
    return state.find((plan) => plan.id === planRecordId || plan.capabilityPlanId === planRecordId)
  },

  getCapabilityPlanForQueueItem(queueItemRecordId: string) {
    return state.find((plan) => plan.sourceQueueItemId === queueItemRecordId)
  },
}

export function useCapabilityPlanningStore() {
  const capabilityPlans = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    capabilityPlans,
    createCapabilityPlan: capabilityPlanningStore.createCapabilityPlan,
    createCapabilityPlanFromQueueItem: capabilityPlanningStore.createCapabilityPlanFromQueueItem.bind(capabilityPlanningStore),
    updateCapabilityPlan: capabilityPlanningStore.updateCapabilityPlan,
    getCapabilityPlanForQueueItem: capabilityPlanningStore.getCapabilityPlanForQueueItem,
  }
}

export const capabilityReadinessStatuses: CapabilityReadinessStatus[] = [
  'Draft',
  'Incomplete',
  'Ready for Review',
  'Approved',
  'Blocked',
  'Archived',
]
