import { MemoryEntry, MemoryType } from './memoryTypes'

const importantTypes = new Set<MemoryType>([
  'Decision',
  'Business Rule',
  'Sprint',
  'Issue',
  'SOP',
  'Bug',
  'Release Note',
  'Architecture',
])

export function getRecentMemories(entries: MemoryEntry[], limit = 5) {
  return entries
    .filter((entry) => !entry.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .slice(0, limit)
}

export function getPinnedMemories(entries: MemoryEntry[], limit = 5) {
  return entries
    .filter((entry) => entry.pinned && !entry.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)
}

export function getLatestSprintMemories(entries: MemoryEntry[], limit = 3) {
  return entries
    .filter((entry) => entry.type === 'Sprint' && !entry.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .slice(0, limit)
}

export function getOpenIdeas(entries: MemoryEntry[], limit = 3) {
  return entries
    .filter((entry) => entry.type === 'Idea' && !entry.archived)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .slice(0, limit)
}

export function getImportantRecentMemories(entries: MemoryEntry[], limit = 5) {
  return entries
    .filter((entry) => !entry.archived && (entry.pinned || importantTypes.has(entry.type)))
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .slice(0, limit)
}

export function getBriefingMemories(entries: MemoryEntry[]) {
  const pinnedExecutiveMemory = entries
    .filter((entry) => (
      (entry.type === 'Decision' || entry.type === 'Business Rule') &&
      entry.pinned &&
      !entry.archived
    ))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const pinnedIds = new Set(pinnedExecutiveMemory.map((entry) => entry.id))
  const recentImportant = entries
    .filter((entry) => !entry.archived && importantTypes.has(entry.type) && !pinnedIds.has(entry.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  const selectedIds = new Set([...pinnedExecutiveMemory, ...recentImportant].map((entry) => entry.id))
  const openIdeas = entries
    .filter((entry) => entry.type === 'Idea' && !entry.archived && !selectedIds.has(entry.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  return [...pinnedExecutiveMemory, ...recentImportant, ...openIdeas]
}
