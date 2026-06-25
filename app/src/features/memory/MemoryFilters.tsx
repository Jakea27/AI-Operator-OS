import { Search } from 'lucide-react'
import { MemoryFilters as Filters, MemoryType, memoryTypes } from '@/src/core/memory'

export function MemoryFilters({
  filters,
  categories,
  onChange,
}: {
  filters: Filters
  categories: string[]
  onChange: (filters: Filters) => void
}) {
  return (
    <div className="panel grid grid-cols-6 gap-3 p-4" data-testid="structured-memory-filters">
      <label className="col-span-2 flex items-center gap-3 rounded-xl border border-line bg-ink/40 px-3">
        <Search size={16} className="text-muted" />
        <input
          className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-muted"
          placeholder="Search business memory..."
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>
      <select className="field" value={filters.type} onChange={(event) => onChange({ ...filters, type: event.target.value as MemoryType | 'All' })}>
        <option value="All">All types</option>
        {memoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <select className="field" value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
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
      <label className={`col-span-6 flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-xs transition ${filters.archived ? 'border-[#ffcc66]/40 bg-[#ffcc66]/10 text-[#ffcc66]' : 'border-line text-muted'}`}>
        <span>Show archived memories</span>
        <input type="checkbox" checked={filters.archived} onChange={(event) => onChange({ ...filters, archived: event.target.checked })} />
      </label>
    </div>
  )
}
