import { MemoryFilters as Filters, MemoryType, memoryTypes } from '@/src/core/memory'

export function MemoryFilters({
  filters,
  tags,
  onChange,
}: {
  filters: Filters
  tags: string[]
  onChange: (filters: Filters) => void
}) {
  return (
    <div className="panel grid grid-cols-4 gap-3 p-3">
      <select className="field" value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as MemoryType | 'All' })}>
        <option value="All">All types</option>
        {memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select className="field" value={filters.tag} onChange={(event) => onChange({ ...filters, tag: event.target.value })}>
        <option value="">All tags</option>
        {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
      </select>
      <select className="field" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as Filters['sort'] })}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="pinned">Pinned first</option>
      </select>
      <select className="field" value={filters.archived ? 'archived' : 'active'} onChange={(event) => onChange({ ...filters, archived: event.target.value === 'archived' })}>
        <option value="active">Active memories</option>
        <option value="archived">Archived memories</option>
      </select>
    </div>
  )
}
