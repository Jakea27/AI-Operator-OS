import { MemoryEntry, MemoryFilters, MemorySearchQuery } from './memoryTypes'

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
    entry.relatedMemoryIds.join(' '),
  ].join(' ').toLowerCase()
}

export function queryBusinessMemory(entries: MemoryEntry[], query: MemorySearchQuery = {}) {
  const text = query.text?.trim().toLowerCase()
  const issue = query.relatedIssue?.trim().toLowerCase()
  const sprint = query.relatedSprint?.trim().toLowerCase()
  const results = entries.filter((entry) => {
    if (query.archived !== undefined && entry.archived !== query.archived) return false
    if (query.pinned !== undefined && entry.pinned !== query.pinned) return false
    if (query.types?.length && !query.types.includes(entry.type)) return false
    if (query.categories?.length && !query.categories.includes(entry.category)) return false
    if (query.tags?.length && !query.tags.every((tag) => entry.tags.includes(tag.toLowerCase()))) return false
    if (issue && !entry.relatedIssue.toLowerCase().includes(issue)) return false
    if (sprint && !entry.relatedSprint.toLowerCase().includes(sprint)) return false
    if (query.relatedMemoryIds?.length && !query.relatedMemoryIds.every((id) => entry.relatedMemoryIds.includes(id))) return false
    return !text || searchableText(entry).includes(text)
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt.localeCompare(a.updatedAt)
  })
  return query.limit ? results.slice(0, query.limit) : results
}

export function searchMemories(entries: MemoryEntry[], filters: MemoryFilters) {
  const query = filters.query.trim().toLowerCase()
  const filtered = entries.filter((entry) => {
    if (entry.archived !== filters.archived) return false
    if (filters.type !== 'All' && entry.type !== filters.type) return false
    if (filters.category && entry.category !== filters.category) return false
    if (filters.tag && !entry.tags.includes(filters.tag)) return false
    if (filters.pinned === 'pinned' && !entry.pinned) return false
    if (filters.pinned === 'unpinned' && entry.pinned) return false
    return !query || searchableText(entry).includes(query)
  })

  return filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (filters.sort === 'pinned') {
      return b.updatedAt.localeCompare(a.updatedAt)
    }
    if (filters.sort === 'updated') return b.updatedAt.localeCompare(a.updatedAt)
    if (filters.sort === 'oldest') return a.createdAt.localeCompare(b.createdAt)
    return b.createdAt.localeCompare(a.createdAt)
  })
}
