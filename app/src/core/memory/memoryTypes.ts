export const memoryTypes = [
  'Decision',
  'Business Rule',
  'Sprint',
  'Issue',
  'Knowledge',
  'SOP',
  'Meeting Note',
  'Idea',
  'Bug',
  'Release Note',
  'Architecture',
  'Research',
] as const

export type MemoryType = (typeof memoryTypes)[number]

export type MemoryEntry = {
  id: string
  title: string
  type: MemoryType
  category: string
  tags: string[]
  summary: string
  details: string
  createdAt: string
  updatedAt: string
  author: string
  relatedIssue: string
  relatedSprint: string
  relatedMemoryIds: string[]
  pinned: boolean
  archived: boolean
}

export type MemoryDraft = Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>

export type MemorySort = 'newest' | 'oldest' | 'pinned'

export type MemoryFilters = {
  query: string
  type: MemoryType | 'All'
  category: string
  tag: string
  pinned: 'all' | 'pinned' | 'unpinned'
  sort: MemorySort
  archived: boolean
}
