import { useSyncExternalStore } from 'react'
import {
  BusinessActivity,
  BusinessInput,
  BusinessPriority,
  BusinessRecord,
  BusinessStatus,
  defaultBusinessMetrics,
} from './businessTypes'
import { businessStatuses } from './businessLifecycle'

const STORAGE_KEY = 'ai-operator-os-businesses-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function createActivity(message: string, createdAt = now()): BusinessActivity {
  return {
    id: id('business-activity'),
    message,
    createdAt,
  }
}

function fallbackBusinessCode(index: number) {
  return `BIZ-${String(index + 1).padStart(4, '0')}`
}

function generateBusinessCode(existing: BusinessRecord[]) {
  const max = existing.reduce((highest, business) => {
    const match = business.businessId?.match(/^BIZ-(\d+)$/)
    if (!match) return highest
    return Math.max(highest, Number(match[1]))
  }, 0)

  return `BIZ-${String(max + 1).padStart(4, '0')}`
}

export function normalizeBusinessStatus(status: unknown): BusinessStatus {
  if (status === 'Active') return 'Operating'
  return businessStatuses.includes(status as BusinessStatus) ? status as BusinessStatus : 'Building'
}

function normalizeBusiness(raw: Partial<BusinessRecord>, index = 0): BusinessRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('business'),
    businessId: raw.businessId ?? fallbackBusinessCode(index),
    name: raw.name?.trim() || 'Untitled Business',
    description: raw.description?.trim() || 'No description recorded yet.',
    portfolioType: raw.portfolioType?.trim() || 'General Portfolio',
    businessModel: raw.businessModel?.trim() || 'Unspecified',
    status: normalizeBusinessStatus(raw.status),
    health: raw.health ?? 'Unrated',
    priority: raw.priority ?? 'Medium',
    notes: raw.notes ?? '',
    metrics: { ...defaultBusinessMetrics, ...raw.metrics },
    sourceOpportunityId: raw.sourceOpportunityId,
    sourceOpportunityCode: raw.sourceOpportunityCode,
    sourceOpportunityName: raw.sourceOpportunityName,
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    activity: Array.isArray(raw.activity) && raw.activity.length > 0
      ? raw.activity
      : [createActivity('Business record created.', timestamp)],
  }
}

function readState(): BusinessRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item, index) => normalizeBusiness(item, index))
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

function persist(next: BusinessRecord[]) {
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

export const businessStore = {
  createBusiness(input: BusinessInput) {
    const timestamp = now()
    const business: BusinessRecord = {
      id: id('business'),
      businessId: generateBusinessCode(state),
      name: input.name.trim() || 'Untitled Business',
      description: input.description.trim(),
      portfolioType: input.portfolioType.trim() || 'General Portfolio',
      businessModel: input.businessModel.trim() || 'Unspecified',
      status: input.status,
      health: 'Unrated',
      priority: input.priority,
      notes: input.notes.trim(),
      metrics: defaultBusinessMetrics,
      sourceOpportunityId: input.sourceOpportunityId,
      sourceOpportunityCode: input.sourceOpportunityCode,
      sourceOpportunityName: input.sourceOpportunityName,
      createdAt: timestamp,
      updatedAt: timestamp,
      activity: [
        createActivity(
          input.sourceOpportunityCode
            ? `Business created from opportunity ${input.sourceOpportunityCode}.`
            : 'Business entered the manager.',
          timestamp,
        ),
      ],
    }
    persist([business, ...state])
    return business
  },

  setStatus(businessId: string, status: BusinessStatus) {
    const timestamp = now()
    persist(state.map((business) =>
      business.id === businessId
        ? {
          ...business,
          status,
          updatedAt: timestamp,
          activity: [createActivity(`Lifecycle status changed to ${status}.`, timestamp), ...business.activity],
        }
        : business,
    ))
  },

  getBusinesses() {
    return state
  },

  getBusiness(businessId: string) {
    return state.find((business) => business.id === businessId)
  },
}

export function useBusinessStore() {
  const businesses = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    businesses,
    createBusiness: businessStore.createBusiness,
    setStatus: businessStore.setStatus,
  }
}

export const businessPriorities: BusinessPriority[] = ['Low', 'Medium', 'High', 'Critical']
