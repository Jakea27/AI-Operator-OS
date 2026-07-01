import { useSyncExternalStore } from 'react'
import { getNextStage, getPreviousStage } from './opportunityLifecycle'
import {
  OpportunityActivity,
  OpportunityActivityType,
  OpportunityDecisionStatus,
  OpportunityFilters,
  OpportunityInput,
  OpportunityPriority,
  OpportunityRecord,
  OpportunityStage,
} from './opportunityTypes'

const STORAGE_KEY = 'ai-operator-os-opportunities-v1'

const listeners = new Set<() => void>()

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function now() {
  return new Date().toISOString()
}

function createActivity(type: OpportunityActivityType, message: string, createdAt = now()): OpportunityActivity {
  return {
    id: id('opportunity-activity'),
    type,
    message,
    createdAt,
  }
}

function normalizeOpportunity(raw: Partial<OpportunityRecord>): OpportunityRecord {
  const timestamp = raw.createdAt ?? now()
  return {
    id: raw.id ?? id('opportunity'),
    name: raw.name?.trim() || 'Untitled Opportunity',
    description: raw.description?.trim() || 'No description recorded yet.',
    businessCategory: raw.businessCategory?.trim() || 'Uncategorized',
    notes: raw.notes ?? '',
    priority: raw.priority ?? 'Medium',
    stage: raw.stage ?? 'Idea',
    decisionStatus: raw.decisionStatus ?? 'Active',
    createdAt: timestamp,
    updatedAt: raw.updatedAt ?? timestamp,
    activity: Array.isArray(raw.activity) && raw.activity.length > 0
      ? raw.activity
      : [createActivity('Created', 'Opportunity created.', timestamp)],
  }
}

function readState(): OpportunityRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item) => normalizeOpportunity(item))
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

function persist(next: OpportunityRecord[]) {
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

function withActivity(
  opportunity: OpportunityRecord,
  type: OpportunityActivityType,
  message: string,
  updates: Partial<OpportunityRecord> = {},
): OpportunityRecord {
  const timestamp = now()
  return {
    ...opportunity,
    ...updates,
    updatedAt: timestamp,
    activity: [createActivity(type, message, timestamp), ...opportunity.activity],
  }
}

const priorityRank: Record<OpportunityPriority, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

export function filterOpportunities(opportunities: OpportunityRecord[], filters: OpportunityFilters) {
  const query = filters.search.trim().toLowerCase()

  return opportunities
    .filter((opportunity) =>
      !query ||
      `${opportunity.name} ${opportunity.description} ${opportunity.businessCategory} ${opportunity.notes}`
        .toLowerCase()
        .includes(query),
    )
    .filter((opportunity) => filters.stage === 'All' || opportunity.stage === filters.stage)
    .filter((opportunity) => filters.priority === 'All' || opportunity.priority === filters.priority)
    .filter((opportunity) => filters.status === 'All' || opportunity.decisionStatus === filters.status)
    .sort((a, b) => {
      if (filters.sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
      if (filters.sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt)
      if (filters.sort === 'priority') {
        return priorityRank[b.priority] - priorityRank[a.priority] || b.updatedAt.localeCompare(a.updatedAt)
      }
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export const opportunityStore = {
  createOpportunity(input: OpportunityInput) {
    const timestamp = now()
    const opportunity: OpportunityRecord = {
      id: id('opportunity'),
      name: input.name.trim() || 'Untitled Opportunity',
      description: input.description.trim(),
      businessCategory: input.businessCategory.trim() || 'Uncategorized',
      notes: input.notes.trim(),
      priority: input.priority ?? 'Medium',
      stage: 'Idea',
      decisionStatus: 'Active',
      createdAt: timestamp,
      updatedAt: timestamp,
      activity: [createActivity('Created', 'Opportunity entered the pipeline.', timestamp)],
    }
    persist([opportunity, ...state])
    return opportunity
  },

  updateOpportunity(opportunityId: string, updates: Partial<OpportunityRecord>) {
    let updated: OpportunityRecord | undefined
    persist(state.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity
      updated = withActivity(opportunity, 'Updated', 'Opportunity details updated.', updates)
      return updated
    }))
    return updated
  },

  setStage(opportunityId: string, stage: OpportunityStage) {
    persist(state.map((opportunity) =>
      opportunity.id === opportunityId
        ? withActivity(opportunity, 'Stage Changed', `Lifecycle stage changed to ${stage}.`, { stage })
        : opportunity,
    ))
  },

  advanceStage(opportunityId: string) {
    const opportunity = state.find((item) => item.id === opportunityId)
    if (!opportunity) return
    this.setStage(opportunityId, getNextStage(opportunity.stage))
  },

  moveBackStage(opportunityId: string) {
    const opportunity = state.find((item) => item.id === opportunityId)
    if (!opportunity) return
    this.setStage(opportunityId, getPreviousStage(opportunity.stage))
  },

  setDecision(opportunityId: string, decisionStatus: OpportunityDecisionStatus) {
    const activityType: OpportunityActivityType =
      decisionStatus === 'Approved'
        ? 'Approved'
        : decisionStatus === 'Changes Requested'
          ? 'Changes Requested'
          : decisionStatus === 'Rejected'
            ? 'Rejected'
            : decisionStatus === 'Archived'
              ? 'Archived'
              : 'Updated'

    const message =
      decisionStatus === 'Approved'
        ? 'CEO approved this opportunity for the next appropriate step.'
        : decisionStatus === 'Changes Requested'
          ? 'CEO requested changes before this opportunity can continue.'
          : decisionStatus === 'Rejected'
            ? 'CEO rejected this opportunity.'
            : decisionStatus === 'Archived'
              ? 'Opportunity archived.'
              : 'Opportunity returned to active status.'

    persist(state.map((opportunity) => {
      if (opportunity.id !== opportunityId) return opportunity
      const stage = decisionStatus === 'Approved' && opportunity.stage === 'CEO Review'
        ? 'Phase 2 Blueprint'
        : opportunity.stage
      return withActivity(opportunity, activityType, message, { decisionStatus, stage })
    }))
  },

  getOpportunities() {
    return state
  },

  getOpportunity(opportunityId: string) {
    return state.find((opportunity) => opportunity.id === opportunityId)
  },
}

export function useOpportunityStore() {
  const opportunities = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    opportunities,
    activeOpportunities: opportunities.filter((opportunity) => opportunity.decisionStatus !== 'Archived'),
    createOpportunity: opportunityStore.createOpportunity,
    updateOpportunity: opportunityStore.updateOpportunity,
    setStage: opportunityStore.setStage,
    advanceStage: opportunityStore.advanceStage.bind(opportunityStore),
    moveBackStage: opportunityStore.moveBackStage.bind(opportunityStore),
    setDecision: opportunityStore.setDecision,
  }
}

