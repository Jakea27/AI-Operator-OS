import { MemoryEntry, MemoryFilters } from './memoryTypes'

function searchableText(entry: MemoryEntry) {
  return [
    entry.title,
    entry.type,
    entry.category,
    entry.tags.join(' '),
    entry.summary,
    entry.details,
    entry.author,
    entry.relatedIssue,
    entry.relatedSprint,
  ].join(' ').toLowerCase()
}

export function searchMemories(entries: MemoryEntry[], filters: MemoryFilters) {
  const query = filters.query.trim().toLowerCase()
  const filtered = entries.filter((entry) => {
    if (entry.archived !== filters.archived) return false
    if (filters.type !== 'All' && entry.type !== filters.type) return false
    if (filters.tag && !entry.tags.includes(filters.tag)) return false
    return !query || searchableText(entry).includes(query)
  })

  return filtered.sort((a, b) => {
    if (filters.sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
    if (filters.sort === 'pinned') {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    }
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}
