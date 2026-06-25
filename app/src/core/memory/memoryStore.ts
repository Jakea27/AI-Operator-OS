import { useSyncExternalStore } from 'react'
import { MemoryDraft, MemoryEntry, MemoryType, memoryTypes } from './memoryTypes'
import { normalizeTags } from './memoryTags'

const STORAGE_KEY = 'ai-operator-os-business-memory-v1'
const OPERATING_STORAGE_KEY = 'ai-operator-os-operating-state-v1'
const LEGACY_MEMORY_KEY = 'operator-os-memory'

const listeners = new Set<() => void>()

function createId() {
  return `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function migrateLegacyMemory(): MemoryEntry[] {
  const now = new Date().toISOString()
  const migrated: MemoryEntry[] = []
  try {
    const operating = JSON.parse(localStorage.getItem(OPERATING_STORAGE_KEY) ?? '{}') as {
      memoryEntries?: Array<{
        id?: string
        title?: string
        body?: string
        tag?: string
        createdAt?: string
      }>
    }
    for (const entry of operating.memoryEntries ?? []) {
      migrated.push({
        id: entry.id ?? createId(),
        title: entry.title ?? 'Migrated memory',
        type: 'Knowledge',
        category: 'Legacy',
        tags: normalizeTags([entry.tag ?? 'legacy']),
        summary: entry.body ?? '',
        details: entry.body ?? '',
        createdAt: entry.createdAt ?? now,
        updatedAt: entry.createdAt ?? now,
        author: 'AI Operator',
        relatedIssue: '',
        relatedSprint: '',
        relatedMemoryIds: [],
        pinned: false,
        archived: false,
      })
    }

    const older = JSON.parse(localStorage.getItem(LEGACY_MEMORY_KEY) ?? '[]') as Array<{
      id?: number | string
      title?: string
      body?: string
      tag?: string
      date?: string
    }>
    for (const entry of older) {
      migrated.push({
        id: entry.id ? `legacy-${entry.id}` : createId(),
        title: entry.title ?? 'Migrated memory',
        type: 'Knowledge',
        category: 'Legacy',
        tags: normalizeTags([entry.tag ?? 'legacy']),
        summary: entry.body ?? '',
        details: entry.body ?? '',
        createdAt: now,
        updatedAt: now,
        author: 'AI Operator',
        relatedIssue: '',
        relatedSprint: '',
        relatedMemoryIds: [],
        pinned: false,
        archived: false,
      })
    }
  } catch {
    return migrated
  }
  return Array.from(new Map(migrated.map((entry) => [entry.id, entry])).values())
}

type StoredMemory = Partial<MemoryEntry> & {
  body?: string
  context?: string
  tag?: string
}

function normalizeEntry(entry: StoredMemory): MemoryEntry {
  const timestamp = new Date().toISOString()
  const type = memoryTypes.includes(entry.type as MemoryType)
    ? entry.type as MemoryType
    : 'Knowledge'
  const rawTags = Array.isArray(entry.tags)
    ? entry.tags
    : entry.tag
      ? [entry.tag]
      : []
  const details = entry.details ?? entry.body ?? entry.context ?? ''
  return {
    id: entry.id ?? createId(),
    title: entry.title?.trim() || 'Untitled memory',
    type,
    category: entry.category?.trim() || 'General',
    tags: normalizeTags(rawTags),
    summary: entry.summary?.trim() || details.slice(0, 240),
    details,
    createdAt: entry.createdAt ?? timestamp,
    updatedAt: entry.updatedAt ?? entry.createdAt ?? timestamp,
    author: entry.author?.trim() || 'AI Operator',
    relatedIssue: entry.relatedIssue?.trim().toUpperCase() || '',
    relatedSprint: entry.relatedSprint?.trim() || '',
    relatedMemoryIds: Array.isArray(entry.relatedMemoryIds)
      ? entry.relatedMemoryIds.filter((id): id is string => typeof id === 'string')
      : [],
    pinned: Boolean(entry.pinned),
    archived: Boolean(entry.archived),
  }
}

function readEntries(): MemoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const normalized = (JSON.parse(stored) as StoredMemory[]).map(normalizeEntry)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }
    const migrated = migrateLegacyMemory()
    const normalized = migrated.map(normalizeEntry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    return []
  }
}

let entries = readEntries()

function persist(next: MemoryEntry[]) {
  entries = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } finally {
    listeners.forEach((listener) => listener())
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return entries
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    entries = readEntries()
    listeners.forEach((listener) => listener())
  })
}

export const memoryStore = {
  add(draft: MemoryDraft) {
    const timestamp = new Date().toISOString()
    const entry: MemoryEntry = {
      ...draft,
      id: createId(),
      tags: normalizeTags(draft.tags),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    persist([entry, ...entries])
    return entry
  },
  update(id: string, draft: MemoryDraft) {
    persist(entries.map((entry) => (
      entry.id === id
        ? { ...entry, ...draft, tags: normalizeTags(draft.tags), updatedAt: new Date().toISOString() }
        : entry
    )))
  },
  delete(id: string) {
    persist(entries.filter((entry) => entry.id !== id).map((entry) => ({
      ...entry,
      relatedMemoryIds: entry.relatedMemoryIds.filter((relatedId) => relatedId !== id),
    })))
  },
  toggleArchive(id: string) {
    persist(entries.map((entry) => entry.id === id
      ? { ...entry, archived: !entry.archived, updatedAt: new Date().toISOString() }
      : entry))
  },
  togglePin(id: string) {
    persist(entries.map((entry) => entry.id === id
      ? { ...entry, pinned: !entry.pinned, updatedAt: new Date().toISOString() }
      : entry))
  },
  clear() {
    persist([])
  },
  loadSampleData() {
    if (entries.length > 0) return
    const timestamp = new Date().toISOString()
    persist([
      {
        id: createId(),
        title: 'Money Department completed',
        type: 'Release Note',
        category: 'Product',
        tags: ['money', 'release'],
        summary: 'AO-001 established the local-first accounting source of truth.',
        details: 'Revenue and expense CRUD, calculations, history, categories, business attribution, and charts are complete.',
        createdAt: timestamp,
        updatedAt: timestamp,
        author: 'AI Operator',
        relatedIssue: 'AO-001',
        relatedSprint: 'Sprint 0.1',
        relatedMemoryIds: [],
        pinned: true,
        archived: false,
      },
      {
        id: createId(),
        title: 'CEO Daily Briefing completed',
        type: 'Release Note',
        category: 'Product',
        tags: ['ceo', 'briefing'],
        summary: 'AO-002 added deterministic daily executive summaries from local operating data.',
        details: 'Briefings include financials, approvals, sprint progress, priorities, risks, recommendations, and memory.',
        createdAt: timestamp,
        updatedAt: timestamp,
        author: 'AI Operator',
        relatedIssue: 'AO-002',
        relatedSprint: 'Sprint 0.1',
        relatedMemoryIds: [],
        pinned: true,
        archived: false,
      },
      {
        id: createId(),
        title: 'Business Memory Engine in progress',
        type: 'Issue',
        category: 'Product',
        tags: ['memory', 'architecture'],
        summary: 'AO-003 creates permanent local business memory with search, filters, relationships, pinning, and archives.',
        details: 'The engine replaces legacy memory arrays with a dedicated core module.',
        createdAt: timestamp,
        updatedAt: timestamp,
        author: 'AI Operator',
        relatedIssue: 'AO-003',
        relatedSprint: 'Sprint 0.1',
        relatedMemoryIds: [],
        pinned: false,
        archived: false,
      },
    ])
  },
}

export function useMemoryStore() {
  const memoryEntries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { memoryEntries, ...memoryStore }
}
