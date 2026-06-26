import { useSyncExternalStore } from 'react'
import {
  RoadmapFilters,
  RoadmapItem,
  RoadmapItemInput,
  RoadmapPriority,
  RoadmapStatus,
} from './roadmapTypes'

const STORAGE_KEY = 'ai-operator-os-roadmap-v1'

const listeners = new Set<() => void>()

function id() {
  return `roadmap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyState(): RoadmapItem[] {
  return []
}

function normalizeItem(raw: Partial<RoadmapItem>): RoadmapItem {
  const now = new Date().toISOString()
  return {
    id: raw.id ?? id(),
    title: raw.title?.trim() || 'Untitled roadmap item',
    description: raw.description?.trim() || 'No description recorded.',
    sourceOperator: raw.sourceOperator ?? 'CTO',
    priority: raw.priority ?? 'Medium',
    status: raw.status ?? 'backlog',
    relatedIssue: raw.relatedIssue ?? '',
    recommendationId: raw.recommendationId,
    sourceApprovalId: raw.sourceApprovalId,
    approvalStatus: raw.approvalStatus,
    approvedAt: raw.approvedAt,
    created: raw.created ?? now,
    updated: raw.updated ?? raw.created ?? now,
  }
}

function readState(): RoadmapItem[] {
  if (typeof window === 'undefined') return emptyState()
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return emptyState()
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return emptyState()
    return parsed.map((item) => normalizeItem(item))
  } catch {
    return emptyState()
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

function persist(next: RoadmapItem[]) {
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

export function filterRoadmapItems(items: RoadmapItem[], filters: RoadmapFilters) {
  const query = filters.search.trim().toLowerCase()
  const priorityWeight: Record<RoadmapPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  }

  return items
    .filter((item) => item.status !== 'archived' || filters.status === 'archived')
    .filter((item) => !query || `${item.title} ${item.description}`.toLowerCase().includes(query))
    .filter((item) => filters.operator === 'All' || item.sourceOperator === filters.operator)
    .filter((item) => filters.priority === 'All' || item.priority === filters.priority)
    .filter((item) => filters.status === 'All' || item.status === filters.status)
    .sort((a, b) => {
      if (filters.sort === 'oldest') return a.created.localeCompare(b.created)
      if (filters.sort === 'priority') return priorityWeight[b.priority] - priorityWeight[a.priority] || b.created.localeCompare(a.created)
      return b.created.localeCompare(a.created)
    })
}

export const roadmapStore = {
  addItem(input: RoadmapItemInput) {
    const now = new Date().toISOString()
    const item: RoadmapItem = {
      ...input,
      id: id(),
      created: now,
      updated: now,
    }
    persist([item, ...state])
    return item
  },
  updateStatus(itemId: string, status: RoadmapStatus) {
    persist(state.map((item) =>
      item.id === itemId
        ? { ...item, status, updated: new Date().toISOString() }
        : item,
    ))
  },
  archiveItem(itemId: string) {
    this.updateStatus(itemId, 'archived')
  },
  getItems() {
    return state
  },
}

export function useRoadmapStore() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    items,
    activeItems: items.filter((item) => item.status !== 'archived'),
    backlogCount: items.filter((item) => item.status !== 'archived' && item.status !== 'complete').length,
    addItem: roadmapStore.addItem,
    updateStatus: roadmapStore.updateStatus,
    archiveItem: roadmapStore.archiveItem.bind(roadmapStore),
  }
}
