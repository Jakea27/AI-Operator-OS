import {
  RoadmapFilters as RoadmapFilterState,
  roadmapOperators,
  roadmapPriorities,
  roadmapStatuses,
} from '@/src/core/roadmap'

export function RoadmapFilters({
  filters,
  onChange,
}: {
  filters: RoadmapFilterState
  onChange: (filters: RoadmapFilterState) => void
}) {
  return (
    <section className="panel p-4">
      <div className="grid grid-cols-6 gap-3">
        <input
          className="field col-span-2"
          placeholder="Search roadmap title or description"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
        <select className="field" value={filters.operator} onChange={(event) => onChange({ ...filters, operator: event.target.value as RoadmapFilterState['operator'] })}>
          <option>All</option>
          {roadmapOperators.map((operator) => <option key={operator}>{operator}</option>)}
        </select>
        <select className="field" value={filters.priority} onChange={(event) => onChange({ ...filters, priority: event.target.value as RoadmapFilterState['priority'] })}>
          <option>All</option>
          {roadmapPriorities.map((priority) => <option key={priority}>{priority}</option>)}
        </select>
        <select className="field" value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as RoadmapFilterState['status'] })}>
          <option>All</option>
          {roadmapStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <select className="field" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as RoadmapFilterState['sort'] })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </section>
  )
}
