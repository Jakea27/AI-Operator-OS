import { MemoryFilters as Filters, MemoryType, memoryTypes } from '@/src/core/memory'

export function MemoryFilters({
  filters,
  categories,
  tags,
  onChange,
}: {
  filters: Filters
  categories: string[]
  tags: string[]
  onChange: (filters: Filters) => void
}) {
  return (
    <div className="panel grid grid-cols-3 gap-3 p-3" data-testid="structured-memory-filters">
      <select className="field" value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as MemoryType | 'All' })}>
        <option value="All">All types</option>
        {memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select className="field" value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </select>
      <select className="field" value={filters.tag} onChange={(event) => onChange({ ...filters, tag: event.target.value })}>
        <option value="">All tags</option>
        {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
      </select>
      <select className="field" value={filters.pinned} onChange={(event) => onChange({ ...filters, pinned: event.target.value as Filters['pinned'] })}>
        <option value="all">All pin states</option>
        <option value="pinned">Pinned only</option>
        <option value="unpinned">Unpinned only</option>
      </select>
      <select className="field" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as Filters['sort'] })}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="updated">Updated</option>
        <option value="pinned">Pinned first</option>
      </select>
      <select className="field" value={filters.archived ? 'archived' : 'active'} onChange={(event) => onChange({ ...filters, archived: event.target.value === 'archived' })}>
        <option value="active">Active memories</option>
        <option value="archived">Archived memories</option>
      </select>
    </div>
  )
}
