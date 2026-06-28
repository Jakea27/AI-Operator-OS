import { useSyncExternalStore } from 'react'
import {
  AutomationFilters,
  AutomationInput,
  AutomationRecord,
  AutomationStatus,
  AutomationStoreState,
  automationRisks,
  automationTypes,
} from './automationTypes'
import { appendAutomationHistory, createAutomationHistoryItem, createAutomationId, statusHistoryNote } from './automationHistory'
import { enforceAutomationSafety } from './automationSafety'

const STORAGE_KEY = 'ai-operator-os-automation-core-v1'

const emptyState: AutomationStoreState = {
  version: 1,
  automations: [],
}

const listeners = new Set<() => void>()

function normalizeAutomation(raw: Partial<AutomationRecord>): AutomationRecord {
  const now = new Date().toISOString()
  const safe = enforceAutomationSafety({
    title: raw.title?.trim() || 'Untitled automation',
    description: raw.description?.trim() || 'No automation description recorded.',
    type: raw.type ?? 'Other',
    category: raw.category ?? 'Internal OS',
    source: raw.source ?? 'Manual',
    sourceOperator: raw.sourceOperator ?? 'Unassigned',
    relatedBusiness: raw.relatedBusiness ?? '',
    relatedIssue: raw.relatedIssue ?? '',
    relatedApprovalId: raw.relatedApprovalId ?? '',
    relatedRoadmapItemId: raw.relatedRoadmapItemId ?? '',
    priority: raw.priority ?? 'Medium',
    risk: raw.risk,
    status: raw.status ?? 'Draft',
    requiresCEOApproval: raw.requiresCEOApproval,
    canAutoExecute: false,
    queuedAt: raw.queuedAt ?? null,
    approvedAt: raw.approvedAt ?? null,
    completedAt: raw.completedAt ?? null,
  })

  return {
    id: raw.id ?? createAutomationId(),
    ...safe,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? now,
    history: Array.isArray(raw.history) && raw.history.length > 0
      ? raw.history
      : [createAutomationHistoryItem('Draft', 'AI Operator OS', 'Automation record normalized.', raw.createdAt ?? now)],
  }
}

function readState(): AutomationStoreState {
  if (typeof window === 'undefined') return emptyState
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState
    const parsed = JSON.parse(stored) as Partial<AutomationStoreState>
    return {
      version: 1,
      automations: Array.isArray(parsed.automations)
        ? parsed.automations.map(normalizeAutomation)
        : [],
    }
  } catch {
    return emptyState
  }
}

let state = readState()

function persist(next: AutomationStoreState) {
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

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = readState()
    listeners.forEach((listener) => listener())
  })
}

function updateAutomationRecord(automationId: string, updater: (automation: AutomationRecord) => AutomationRecord) {
  const next = {
    ...state,
    automations: state.automations.map((automation) => automation.id === automationId ? updater(automation) : automation),
  }
  persist(next)
  return next.automations.find((automation) => automation.id === automationId)
}

function transitionAutomation(automation: AutomationRecord, status: AutomationStatus, note = statusHistoryNote(status), actor = 'AI Operator OS') {
  const now = new Date().toISOString()
  const next: AutomationRecord = {
    ...automation,
    status,
    updatedAt: now,
    queuedAt: status === 'Queued' || status === 'Needs Approval' ? (automation.queuedAt ?? now) : automation.queuedAt,
    approvedAt: status === 'Approved' || status === 'Ready' ? (automation.approvedAt ?? now) : automation.approvedAt,
    completedAt: status === 'Completed' ? now : automation.completedAt,
    canAutoExecute: false,
  }
  return appendAutomationHistory(next, status, actor, note, now)
}

export function filterAutomations(automations: AutomationRecord[], filters: AutomationFilters = {}) {
  const search = filters.search?.trim().toLowerCase() ?? ''
  const priorityRank = { Low: 1, Medium: 2, High: 3, Critical: 4 }
  const riskRank = { Low: 1, Medium: 2, High: 3, Critical: 4 }

  return automations
    .filter((automation) => automation.status !== 'Archived' || filters.status === 'Archived')
    .filter((automation) => !search || [
      automation.title,
      automation.description,
      automation.type,
      automation.category,
      automation.source,
      automation.sourceOperator,
      automation.relatedBusiness,
      automation.relatedIssue,
      automation.relatedApprovalId,
      automation.relatedRoadmapItemId,
    ].join(' ').toLowerCase().includes(search))
    .filter((automation) => !filters.type || filters.type === 'All' || automation.type === filters.type)
    .filter((automation) => !filters.category || filters.category === 'All' || automation.category === filters.category)
    .filter((automation) => !filters.source || filters.source === 'All' || automation.source === filters.source)
    .filter((automation) => !filters.sourceOperator || filters.sourceOperator === 'All' || automation.sourceOperator === filters.sourceOperator)
    .filter((automation) => !filters.priority || filters.priority === 'All' || automation.priority === filters.priority)
    .filter((automation) => !filters.risk || filters.risk === 'All' || automation.risk === filters.risk)
    .filter((automation) => !filters.status || filters.status === 'All' || automation.status === filters.status)
    .filter((automation) => filters.requiresCEOApproval === undefined || filters.requiresCEOApproval === 'All' || automation.requiresCEOApproval === filters.requiresCEOApproval)
    .sort((a, b) => {
      if (filters.sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
      if (filters.sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt)
      if (filters.sort === 'priority') return priorityRank[b.priority] - priorityRank[a.priority]
      if (filters.sort === 'risk') return riskRank[b.risk] - riskRank[a.risk]
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export const automationStore = {
  createAutomation(input: AutomationInput) {
    const now = new Date().toISOString()
    const safe = enforceAutomationSafety(input)
    const automation: AutomationRecord = {
      id: createAutomationId(),
      title: safe.title.trim() || 'Untitled automation',
      description: safe.description.trim() || 'No automation description recorded.',
      type: safe.type ?? 'Other',
      category: safe.category ?? 'Internal OS',
      source: safe.source ?? 'Manual',
      sourceOperator: safe.sourceOperator ?? 'Unassigned',
      relatedBusiness: safe.relatedBusiness ?? '',
      relatedIssue: safe.relatedIssue ?? '',
      relatedApprovalId: safe.relatedApprovalId ?? '',
      relatedRoadmapItemId: safe.relatedRoadmapItemId ?? '',
      priority: safe.priority ?? 'Medium',
      risk: safe.risk,
      status: safe.status ?? 'Draft',
      requiresCEOApproval: safe.requiresCEOApproval,
      canAutoExecute: false,
      createdAt: now,
      updatedAt: now,
      queuedAt: safe.queuedAt ?? null,
      approvedAt: safe.approvedAt ?? null,
      completedAt: safe.completedAt ?? null,
      history: [
        createAutomationHistoryItem(safe.status ?? 'Draft', safe.sourceOperator ?? 'AI Operator OS', statusHistoryNote(safe.status ?? 'Draft'), now),
        ...(safe.history ?? []),
      ],
    }
    persist({ ...state, automations: [automation, ...state.automations] })
    return automation
  },
  updateAutomation(automationId: string, updates: Partial<AutomationInput>) {
    return updateAutomationRecord(automationId, (automation) => {
      const safe = enforceAutomationSafety({ ...automation, ...updates, title: updates.title ?? automation.title, description: updates.description ?? automation.description })
      return appendAutomationHistory({
        ...automation,
        ...safe,
        canAutoExecute: false,
        updatedAt: new Date().toISOString(),
      }, 'Updated', 'AI Operator OS', 'Automation details updated.')
    })
  },
  deleteAutomation(automationId: string) {
    persist({ ...state, automations: state.automations.filter((automation) => automation.id !== automationId) })
  },
  archiveAutomation(automationId: string, note = statusHistoryNote('Archived')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Archived', note))
  },
  getAutomationById(automationId: string) {
    return state.automations.find((automation) => automation.id === automationId)
  },
  listAutomations() {
    return state.automations
  },
  filterAutomations(filters: AutomationFilters = {}) {
    return filterAutomations(state.automations, filters)
  },
  addAutomationHistory(automationId: string, action: string, actor = 'AI Operator OS', note = '') {
    return updateAutomationRecord(automationId, (automation) => appendAutomationHistory(automation, action, actor, note))
  },
  queueAutomation(automationId: string, note = statusHistoryNote('Queued')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Queued', note))
  },
  markNeedsApproval(automationId: string, relatedApprovalId = '', note = statusHistoryNote('Needs Approval')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation({ ...automation, relatedApprovalId, requiresCEOApproval: true }, 'Needs Approval', note))
  },
  markApproved(automationId: string, relatedApprovalId = '', note = statusHistoryNote('Approved')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation({ ...automation, relatedApprovalId, requiresCEOApproval: true }, 'Approved', note, 'CEO'))
  },
  markReady(automationId: string, note = statusHistoryNote('Ready')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Ready', note))
  },
  markCompleted(automationId: string, note = statusHistoryNote('Completed')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Completed', note))
  },
  markFailed(automationId: string, note = statusHistoryNote('Failed')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Failed', note))
  },
  markBlocked(automationId: string, note = statusHistoryNote('Blocked')) {
    return updateAutomationRecord(automationId, (automation) => transitionAutomation(automation, 'Blocked', note))
  },
  getState() {
    return state
  },
}

export function useAutomationStore() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    data,
    automations: data.automations,
    ...automationStore,
  }
}

export function getEmptyAutomationStats() {
  return {
    total: 0,
    draft: 0,
    queued: 0,
    needsApproval: 0,
    approved: 0,
    ready: 0,
    running: 0,
    completed: 0,
    failed: 0,
    blocked: 0,
    archived: 0,
    requiresCEOApproval: 0,
    canAutoExecute: 0,
    byRisk: Object.fromEntries(automationRisks.map((risk) => [risk, 0])),
    byType: Object.fromEntries(automationTypes.map((type) => [type, 0])),
  }
}

